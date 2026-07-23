# Feature 66: Database Backup & Disaster Recovery

**Status:** Not Started  
**Priority:** P0 (Blocking Launch)  
**Dependencies:** None  
**Assigned To:** AI Agent  
**Estimated Effort:** 5 days

---

## Problem Statement

### Current Risks

1. **No Automated Backups:** Relying only on Neon's 7-day retention (free tier)
2. **No Disaster Recovery Plan:** If database corrupted, business is extinct
3. **Cold Start Issues:** Neon goes idle after 5 minutes of inactivity
4. **No Protection Against Accidents:** DROP TABLE or destructive migration = permanent data loss
5. **Single Point of Failure:** One database, no replication

### Impact

- User data loss = business extinction + legal liability
- Cold starts cause first request to fail or timeout
- No rollback capability for bad migrations
- Cannot recover from breach or accidental deletion

---

## Solution Overview

Implement multi-layer backup strategy:

1. **Daily Automated Backups** - pg_dump to 3 geo-distributed locations
2. **Keep-Alive Pinger** - Prevent Neon cold starts
3. **Breach Detection** - Auto-snapshot on anomalous activity
4. **Migration Safety Hooks** - Backup before every migration
5. **Restore Automation** - CLI tool to restore from any backup

---

## Technical Design

### 1. Daily Backup Task

```typescript
// trigger/tasks/backup-database.ts
import { task, schedules } from "@trigger.dev/sdk";
import { exec } from "child_process";
import { promisify } from "util";
import { put } from "@vercel/blob";

const execAsync = promisify(exec);

export const dailyBackup = schedules.task({
  id: "daily-database-backup",
  cron: "0 3 * * *", // 3 AM UTC daily
  run: async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql.gz`;

    // 1. Create compressed pg_dump
    await execAsync(
      `pg_dump ${process.env.DIRECT_URL} | gzip > /tmp/${filename}`
    );

    // 2. Upload to Vercel Blob (primary)
    const blob = await put(`backups/${filename}`, 
      fs.createReadStream(`/tmp/${filename}`), 
      { access: "public" }
    );

    // 3. Upload to S3 (secondary)
    await uploadToS3(`backups/${filename}`, `/tmp/${filename}`);

    // 4. Upload to CloudFlare R2 (tertiary - geo-redundant)
    await uploadToR2(`backups/${filename}`, `/tmp/${filename}`);

    // 5. Log to database
    await db.backupLog.create({
      data: {
        filename,
        size: fs.statSync(`/tmp/${filename}`).size,
        locations: ["vercel-blob", "s3", "r2"],
        timestamp: new Date(),
        type: "FULL",
      },
    });

    // 6. Cleanup old backups (keep 90 days)
    await cleanupOldBackups(90);

    return { success: true, file: filename };
  },
});
```

### 2. Keep-Alive Task (Prevent Cold Starts)

```typescript
// trigger/tasks/keep-alive.ts
export const databaseKeepAlive = schedules.task({
  id: "database-keep-alive",
  cron: "*/4 * * * *", // Every 4 minutes (before 5-min Neon timeout)
  run: async () => {
    await db.$queryRaw`SELECT 1`;
    return { status: "alive", timestamp: new Date() };
  },
});
```

### 3. Breach Detection

```typescript
// lib/security/breach-detector.ts
export async function detectAnomalousActivity() {
  const recentDeletes = await db.$queryRaw`
    SELECT COUNT(*) as count, table_name 
    FROM audit_log 
    WHERE operation = 'DELETE' 
      AND deleted_at > NOW() - INTERVAL '1 minute'
    GROUP BY table_name
    HAVING COUNT(*) > 100; -- 100+ deletes/min = suspicious
  `;

  if (recentDeletes.length > 0) {
    // 1. Create emergency snapshot
    await createEmergencySnapshot();

    // 2. Revoke all active API tokens
    await revokeAllActiveTokens();

    // 3. Alert admin (SMS + Slack + email)
    await alertAdmin("CRITICAL: Anomalous delete activity detected");

    // 4. Set database to read-only
    await db.$executeRaw`ALTER DATABASE SET default_transaction_read_only = on;`;

    return { breachDetected: true };
  }
}
```

### 4. Backup Log Schema

```prisma
// prisma/schema.prisma (ADD THIS)
model BackupLog {
  id        String   @id @default(cuid())
  filename  String   @unique
  size      BigInt   // Bytes
  locations String[] // ["vercel-blob", "s3", "r2"]
  type      BackupType
  timestamp DateTime
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@index([timestamp])
  @@index([type])
}

enum BackupType {
  FULL
  INCREMENTAL
  PRE_MIGRATION
  EMERGENCY
}
```

### 5. Restore CLI

```typescript
// scripts/restore-database.ts
import { Command } from "commander";

const program = new Command();

program
  .name("restore-database")
  .description("Restore database from backup")
  .argument("<backup-file>", "Backup filename or 'latest'")
  .option("--test", "Restore to test branch first")
  .action(async (backupFile, options) => {
    // 1. Download from primary location
    const url = await getBackupUrl(backupFile);
    await downloadFile(url, "/tmp/restore.sql.gz");

    // 2. Decompress
    await execAsync("gunzip /tmp/restore.sql.gz");

    if (options.test) {
      // 3. Create test branch
      await execAsync("neonctl branches create --name restore-test");

      // 4. Restore to test branch
      await execAsync(
        `psql ${process.env.RESTORE_BRANCH_URL} < /tmp/restore.sql`
      );

      // 5. Run integrity checks
      const integrity = await testDatabaseIntegrity();
      console.log(integrity.passed ? "✅ Restore successful" : "❌ Integrity failed");
    } else {
      console.log("⚠️  Restoring to production. Create backup first? (y/n)");
      // ... interactive confirmation
    }
  });

program.parse();
```

---

## Acceptance Criteria

- [ ] Automated daily backups run at 3 AM UTC
- [ ] Backups uploaded to 3 geo-distributed locations (Vercel Blob, S3, R2)
- [ ] Database never cold-starts (keep-alive every 4 minutes)
- [ ] Anomalous delete activity triggers automatic snapshot + alert
- [ ] Restore command can recover to any backup from last 90 days
- [ ] Backup success rate >99.9%
- [ ] Restore completes in <5 minutes for databases <10GB
- [ ] All backups verified for integrity monthly

---

## Files Owned

### New Files
- `trigger/tasks/backup-database.ts`
- `trigger/tasks/keep-alive.ts`
- `lib/security/breach-detector.ts`
- `scripts/restore-database.ts`

### Modified Files
- `prisma/schema.prisma` (add BackupLog model)

---

## Testing Requirements

- Test backup job runs successfully
- Test restore from each backup location (Blob, S3, R2)
- Simulate breach (bulk delete) → verify snapshot created
- Verify keep-alive prevents cold starts
- Load test: backup 10GB database in <5 minutes

---

## Out of Scope

- ❌ Real-time replication (Feature 72)
- ❌ Multi-region active-active (Feature 73)
- ❌ Blockchain-based immutable audit log
- ❌ Quantum-encrypted backups

---

## External Services Setup

### AWS S3 (Secondary Backup)
1. Create AWS account at https://aws.amazon.com
2. Go to S3 console → Create bucket `foundrie-backups`
3. Enable versioning on bucket
4. Create IAM user with `s3:PutObject` permission
5. Add credentials to `.env`:
   ```
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   AWS_BACKUP_BUCKET=foundrie-backups
   ```

### CloudFlare R2 (Tertiary Backup)
1. Create CloudFlare account at https://cloudflare.com
2. Go to R2 → Create bucket `foundrie-backups`
3. Create API token with R2 write permission
4. Add to `.env`:
   ```
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_BUCKET=foundrie-backups
   ```

---

**END OF SPEC**
