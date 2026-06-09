# Environment Configuration Guide

This guide explains all environment variables required to run Foundrie AI in development and production.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your API keys and configuration values
3. Restart your development server

---

## AI Provider API Keys

**Feature:** Feature 05 - AI Rotation Engine

The rotation engine routes every AI call through provider adapters in `lib/ai/providers`. A provider with no key is treated as unavailable and skipped (it does not count as a failed attempt), so the engine degrades gracefully when only some keys are present. Build and tests do not require real keys.

### ANTHROPIC_API_KEY

**Provider:** Anthropic (Claude Sonnet 4)  
**URL:** https://console.anthropic.com  
**Required:** OPTIONAL BUT HIGHLY RECOMMENDED  
**Format:** `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx`

While the rotation engine will gracefully fall back to free providers (like Gemini/DeepSeek) if this is missing, Claude Sonnet 4 is Foundrie's primary model for PRO/ENTERPRISE tiers. It produces significantly higher quality architecture proposals and feature specs. If you leave this blank, the system will still work perfectly using free models.

**Setup Instructions:** See `docs/AI_PROVIDER_SETUP.md` for detailed steps.

### GEMINI_API_KEY

**Provider:** Google Gemini  
**Models:** gemini-2.5-pro, gemini-2.5-flash  
**URL:** https://aistudio.google.com/apikey  
**Required:** YES (minimum for free tier)  
**Format:** `AIzaxxxxxxxxxxxxxxxxxxxxxxxx`

**Setup Instructions:** See `docs/AI_PROVIDER_SETUP.md` for detailed steps.

### DEEPSEEK_API_KEY

**Provider:** DeepSeek  
**Models:** deepseek-reasoner (R1), deepseek-chat (V3)  
**URL:** https://platform.deepseek.com  
**Required:** YES (minimum for free tier)  
**Format:** `sk-xxxxxxxxxxxxxxxxxxxxxxxx`

**Setup Instructions:** See `docs/AI_PROVIDER_SETUP.md` for detailed steps.

### GROQ_API_KEY

**Provider:** Groq  
**Description:** Fast llama/gemma inference  
**URL:** https://console.groq.com/keys  
**Required:** RECOMMENDED  
**Format:** `gsk_xxxxxxxxxxxxxxxxxxxxxxxx`

**Setup Instructions:** See `docs/AI_PROVIDER_SETUP.md` for detailed steps.

### OPENROUTER_API_KEY

**Provider:** OpenRouter  
**Description:** Unified fallback access to many models  
**URL:** https://openrouter.ai/keys  
**Required:** RECOMMENDED  
**Format:** `sk-or-xxxxxxxxxxxxxxxxxxxxxxxx`

**Setup Instructions:** See `docs/AI_PROVIDER_SETUP.md` for detailed steps.

### NVIDIA_API_KEY

**Provider:** Nvidia NIM  
**Description:** High-performance inference  
**URL:** https://build.nvidia.com/explore/discover  
**Required:** RECOMMENDED  
**Format:** `nvapi-xxxxxxxxxxxxxxxxxxxxxxxx`

**Setup:**
1. Create an account at https://build.nvidia.com
2. Navigate to any model page
3. Click "Get API Key"
4. Generate a new key
5. Free tier available

---

## Application Configuration

### NEXT_PUBLIC_APP_URL

**Purpose:** Public app URL for traffic attribution and canonical origin  
**Default:** `https://foundrieai.vercel.app`  
**Development:** `http://localhost:3000`

This is sent by the OpenRouter adapter as HTTP-Referer / X-Title headers for traffic attribution and used elsewhere as the canonical app origin.

---

## Authentication (Clerk)

**Feature:** Feature 02 - Auth

### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

**Purpose:** Clerk public key (client-side)  
**URL:** https://dashboard.clerk.com  
**Required:** YES  
**Format:** `pk_test_xxxxxxxxxxxxxxxxxxxxxxxx` (test) or `pk_live_xxx` (production)

**Setup:**
1. Visit https://dashboard.clerk.com
2. Create or select your application
3. Navigate to "API Keys"
4. Copy the "Publishable key"

### CLERK_SECRET_KEY

**Purpose:** Clerk secret key (server-side)  
**URL:** https://dashboard.clerk.com  
**Required:** YES  
**Format:** `sk_test_xxxxxxxxxxxxxxxxxxxxxxxx` (test) or `sk_live_xxx` (production)

**Setup:**
1. Visit https://dashboard.clerk.com
2. Navigate to "API Keys"
3. Copy the "Secret key"
4. ⚠️ **NEVER commit this to version control**

### CLERK_WEBHOOK_SIGNING_SECRET

**Feature:** Feature 04 - Project CRUD  
**Purpose:** Validates Clerk webhook signatures  
**Required:** YES (for user sync)  
**Format:** `whsec_xxxxxxxxxxxxxxxxxxxxxxxx`

**Setup:**
1. Visit https://dashboard.clerk.com
2. Navigate to "Webhooks"
3. Create a webhook endpoint pointing to your app's `/api/webhooks/clerk`
4. Copy the "Signing Secret" from the webhook settings
5. The `verifyWebhook()` function reads this exact variable name to validate the Svix signature before any user-sync write

---

## Admin Access

**Feature:** Feature 04 - Project CRUD

### ADMIN_EMAILS

**Purpose:** Comma-separated emails granted v1 admin access  
**Required:** NO  
**Format:** `"founder@example.com,admin@example.com"`  
**Code:** Checked by `lib/auth/is-admin.ts`

Example:
```bash
ADMIN_EMAILS="founder@foundrie.ai,admin@foundrie.ai"
```

---

## Database (Neon Postgres)

**Feature:** Feature 03 - Database Schema

### DATABASE_URL

**Purpose:** POOLED runtime connection for all application queries  
**Required:** YES  
**Format:** PostgreSQL connection string with `-pooler` endpoint  

**Important Details:**
- Must use the `-pooler` Neon endpoint (PgBouncer transaction mode)
- All application queries use this URL
- Neon Free tier scales compute to zero after ~5 min idle
- First connection wakes it, which can take longer than Prisma's default 5s connect timeout
- `connect_timeout=15` gives the compute time to wake on both runtime and CLI connections

**Example:**
```
postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15
```

**Setup:**
1. Create a Neon project at https://console.neon.tech
2. Copy the **Pooled connection** string
3. Ensure it includes `-pooler` in the hostname
4. Add `connect_timeout=15` parameter

### DIRECT_URL

**Purpose:** UNPOOLED connection for Prisma CLI migrations  
**Required:** YES (for migrations)  
**Format:** PostgreSQL connection string WITHOUT `-pooler`

**Important Details:**
- Used ONLY by the Prisma CLI for migrations
- Runtime code must NEVER use this
- Does not include `-pooler` in the hostname

**Example:**
```
postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15
```

**Setup:**
1. In your Neon project dashboard
2. Copy the **Direct connection** string (no `-pooler`)
3. Add `connect_timeout=15` parameter

---

## Storage (Vercel Blob)

**Feature:** Feature 07 - Research Library

### BLOB_READ_WRITE_TOKEN

**Purpose:** Upload project references, screenshots, and frame ZIPs  
**Required:** YES (for research library)  
**Format:** `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxx`

**Setup:**
1. Visit https://vercel.com/dashboard
2. Navigate to your project's "Storage" tab
3. Create a Blob store if you haven't already
4. Copy the "Read-Write Token"

---

## Research Connectors

**Feature:** Feature 09 - Web Research Connectors

### TAVILY_API_KEY

**Purpose:** Web research and search capabilities  
**Required:** RECOMMENDED (for web research features)  
**Format:** `tvly-xxxxxxxxxxxxxxxxxxxxxxxx`

**Setup:**
1. Visit https://tavily.com
2. Sign up for an account
3. Navigate to API Keys
4. Copy your API key

### OBSCURA_ENDPOINT

**Purpose:** Local web scraping via Obscura  
**Required:** OPTIONAL  
**Format:** `http://localhost:9222/scrape`

**Setup:**
- Foundrie will auto-detect the local `obscura` binary installed at `~/.local/bin/obscura` or in your PATH
- Only set `OBSCURA_ENDPOINT` if you are explicitly running `obscura serve` as a remote HTTP service
- Leave blank for local binary detection

---

## Background Jobs (Trigger.dev)

**Feature:** Feature 11 - Requirements Generation

### TRIGGER_SECRET_KEY

**Purpose:** Run durable long-running background tasks  
**Required:** YES (for AI generation features)  
**Format:** `tr_dev_xxxxxxxxxxxxxxxxxxxxxxxx` (dev) or `tr_prod_xxx` (production)

**Setup:**
1. Visit https://cloud.trigger.dev
2. Create or select your project
3. Navigate to "API Keys"
4. Copy the secret key for your environment (dev/staging/production)

---

## Environment-Specific Files

### Development

**File:** `.env.local`  
**Usage:** Local development only  
**Git:** ✅ Ignored by default

### Production

**File:** Environment variables configured in Vercel/hosting platform  
**Usage:** Production deployment  
**Git:** ❌ Never commit production secrets

### Testing

**File:** `.env.test.local`  
**Usage:** Test environment  
**Git:** ✅ Ignored by default

---

## Security Best Practices

1. ✅ **Never commit `.env.local` or any file containing real secrets**
2. ✅ **Use `.env.example` as a template only (with placeholder values)**
3. ✅ **Rotate secrets immediately if accidentally committed**
4. ✅ **Use different keys for development/staging/production**
5. ✅ **Restrict API key permissions to minimum required**
6. ✅ **Monitor API key usage for unexpected activity**
7. ✅ **Store production secrets in your hosting platform's environment management**

---

## Verification Checklist

After setting up your environment:

- [ ] `.env.local` file created
- [ ] All required keys added (Gemini, DeepSeek, Clerk, Database, Trigger)
- [ ] Recommended keys added (Anthropic, Groq, OpenRouter, Nvidia)
- [ ] Development server starts without errors
- [ ] Database connection works (`npm run db:studio`)
- [ ] Test AI generation works (create project, start discovery)
- [ ] No secrets committed to Git (`git status` shows no `.env.local`)

---

## Troubleshooting

### "Provider unavailable" errors

**Cause:** Missing or invalid API key

**Solution:**
1. Verify the key is in `.env.local`
2. Check the key format matches the expected pattern
3. Restart dev server to pick up new env vars

### Database connection errors

**Cause:** Wrong connection string or compute sleeping

**Solution:**
1. Verify you're using the correct URL (pooled vs direct)
2. Check `connect_timeout=15` is present
3. Wait a few seconds for Neon compute to wake

### Clerk authentication not working

**Cause:** Mismatched keys or webhook not configured

**Solution:**
1. Ensure publishable and secret keys are from the same Clerk application
2. Verify webhook is configured and pointing to your app
3. Check webhook signing secret matches

---

## Related Documentation

- **AI Provider Setup:** `docs/AI_PROVIDER_SETUP.md` - Detailed provider account creation steps
- **Unified Rotation:** `docs/UNIFIED_ROTATION_OPTIMIZATION.md` - AI architecture deep-dive
- **Architecture Context:** `project-kit/context/architecture-context.md` - System architecture
- **Feature Specs:** `project-kit/feature-specs/` - Implementation details per feature

---

## Support

For issues or questions:
1. Check this guide and related documentation
2. Verify all required environment variables are set
3. Check application logs for specific error messages
4. Ensure you're using the latest versions of all services
