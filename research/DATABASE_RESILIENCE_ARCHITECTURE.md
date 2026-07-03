# Database Resilience Architecture

**Created:** 2026-07-04  
**Status:** Active Implementation  
**Related:** Feature 66, FOUNDRIE_V16.0.0  
**Full Analysis:** `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 2

---

## Quick Reference

### Three-Layer Backup Strategy

1. **Neon Native:** Continuous, 7-30 day retention
2. **Daily pg_dump:** 3 geo-distributed locations, 90-day retention
3. **Pre-Migration:** Automatic snapshot before schema changes

### Recovery Targets

- **RPO (Recovery Point Objective):** <1 hour (last backup)
- **RTO (Recovery Time Objective):** <5 minutes for <10GB database

---

## Backup Locations

```
Primary: Vercel Blob (same region as app)
Secondary: AWS S3 (us-east-1, versioned)
Tertiary: CloudFlare R2 (geo-redundant, multiple DCs)
```

**Why 3 locations?** If 2 compromised, 1 survives.

---

## Neon Tier Comparison

| Feature | Free | Pro ($19/mo) | Scale (Custom) |
|---------|------|--------------|----------------|
| Retention | 7 days | 30 days | 90 days |
| Cold starts | Yes (5 min) | Configurable | Never |
| Protected branches | No | Yes | Yes |
| Read replicas | No | Yes | Yes |

**Recommendation:** Upgrade to Pro before launch.

---

## Cold Start Mitigation

```typescript
// Keep-alive task (runs every 4 minutes)
export const databaseKeepAlive = schedules.task({
  id: "database-keep-alive",
  cron: "*/4 * * * *",
  run: async () => {
    await db.$queryRaw`SELECT 1`;
    return { status: "alive" };
  },
});
```

**Cost:** $0 (within free tier limits)  
**Benefit:** Zero cold starts

---

## Breach Detection Triggers

```typescript
// 100+ deletes/minute = suspicious
if (deleteCount > 100 in last minute) {
  1. Create emergency snapshot
  2. Revoke all API tokens
  3. Set database to read-only
  4. Alert admin (SMS + Slack + email)
}
```

---

## Restore Process

```bash
# 1. Download backup
wget https://blob.vercel-storage.com/backup-xxx.sql.gz

# 2. Decompress
gunzip backup-xxx.sql.gz

# 3. Create test branch
neonctl branches create --name restore-test

# 4. Restore to test branch
psql $RESTORE_BRANCH_URL < backup-xxx.sql

# 5. Verify integrity
npm run db:verify-integrity

# 6. Promote to main (if passed)
neonctl branches promote restore-test
```

---

## Daily Backup Script

```typescript
// trigger/tasks/backup-database.ts
export const dailyBackup = schedules.task({
  id: "daily-database-backup",
  cron: "0 3 * * *", // 3 AM UTC
  run: async () => {
    const filename = `backup-${timestamp}.sql.gz`;
    
    // 1. pg_dump
    await execAsync(`pg_dump ${DIRECT_URL} | gzip > /tmp/${filename}`);
    
    // 2. Upload to 3 locations
    await Promise.all([
      put(`backups/${filename}`, stream),  // Vercel Blob
      uploadToS3(`backups/${filename}`),    // AWS S3
      uploadToR2(`backups/${filename}`),    // CloudFlare R2
    ]);
    
    // 3. Log to database
    await db.backupLog.create({ data: {...} });
    
    // 4. Cleanup old backups (>90 days)
    await cleanupOldBackups(90);
  },
});
```

---

## Implementation Checklist

- [ ] Daily backup task in Trigger.dev
- [ ] 3 storage locations configured
- [ ] `BackupLog` model in Prisma
- [ ] Keep-alive task (prevent cold starts)
- [ ] Breach detection monitoring
- [ ] Restore CLI command (`npm run db:restore`)
- [ ] Monthly backup verification tests

---

**See `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 2 for full disaster recovery playbook.**
