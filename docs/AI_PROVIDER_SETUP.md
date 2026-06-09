# AI Provider API Key Setup Guide

This guide walks you through obtaining API keys for all AI providers used by Foundrie AI. The rotation engine gracefully degrades when providers are unavailable, so you can start with a minimal setup and add more providers over time.

## Quick Start (Minimum Required)

For a fully functional free-tier setup, configure at least:
- **Google Gemini** (free tier, generous limits)
- **DeepSeek** (free tier, strong reasoning)

## Provider Setup Instructions

### 1. Anthropic (Claude) - HIGHLY RECOMMENDED

**Why:** Claude Sonnet 4 is Foundrie's primary model for PRO/ENTERPRISE tiers and produces the highest quality architecture proposals and feature specs.

**Free Tier:** $5 free credit for new accounts

**Setup:**
1. Visit https://console.anthropic.com
2. Create an account or sign in
3. Navigate to "API Keys" in the left sidebar
4. Click "Create Key"
5. Give it a name (e.g., "Foundrie Development")
6. Copy the key (starts with `sk-ant-`)
7. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

**Rate Limits:**
- Free tier: ~50,000 tokens/minute
- Pay-as-you-go: 100,000 tokens/minute

---

### 2. Google Gemini - REQUIRED

**Why:** Gemini Pro/Flash provide excellent long-context analysis and are used extensively in discovery, research synthesis, and visual analysis.

**Free Tier:** Yes, generous daily limits

**Setup:**
1. Visit https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Get API key" or "Create API key"
4. Select your project or create a new one
5. Copy the key (starts with `AIza`)
6. Add to `.env.local`:
   ```
   GEMINI_API_KEY=AIzaYour-Key-Here
   ```

**Rate Limits:**
- Free tier: 15 requests/minute, 1,500 requests/day
- Paid tier: 1,000 requests/minute

---

### 3. DeepSeek - REQUIRED

**Why:** DeepSeek R1 is the free-tier primary model and provides strong reasoning capabilities. DeepSeek V3 excels at structured writing tasks.

**Free Tier:** Yes, with rate limits

**Setup:**
1. Visit https://platform.deepseek.com
2. Click "Sign Up" or "Log In"
3. Complete email verification
4. Navigate to "API Keys" in the dashboard
5. Click "Create API Key"
6. Name it (e.g., "Foundrie Dev")
7. Copy the key (starts with `sk-`)
8. Add to `.env.local`:
   ```
   DEEPSEEK_API_KEY=sk-your-key-here
   ```

**Rate Limits:**
- Free tier: 10 requests/minute
- Paid tier: Higher limits available

---

### 4. Groq - RECOMMENDED

**Why:** Groq provides ultra-fast inference for Llama and Gemma models, perfect for real-time chat and quick responses.

**Free Tier:** Yes, with generous limits

**Setup:**
1. Visit https://console.groq.com
2. Sign up with email or OAuth
3. Verify your email
4. Navigate to "API Keys" section
5. Click "Create API Key"
6. Name it (e.g., "Foundrie")
7. Copy the key (starts with `gsk_`)
8. Add to `.env.local`:
   ```
   GROQ_API_KEY=gsk_your-key-here
   ```

**Rate Limits:**
- Free tier: 30 requests/minute, 14,400 requests/day
- Paid tier: 400 requests/minute

---

### 5. OpenRouter - RECOMMENDED

**Why:** OpenRouter provides unified access to 200+ models with a single API key, including free-tier fallbacks for many premium models.

**Free Tier:** Many models available free with rate limits

**Setup:**
1. Visit https://openrouter.ai
2. Click "Sign Up" (supports OAuth)
3. Verify your email
4. Navigate to "Keys" in the dashboard
5. Click "Create Key"
6. Name it (e.g., "Foundrie Development")
7. Copy the key (starts with `sk-or-`)
8. Add to `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-your-key-here
   ```

**Rate Limits:**
- Varies by model
- Free models: 10-20 requests/minute
- Paid models: Higher limits

---

### 6. Nvidia NIM - RECOMMENDED

**Why:** Nvidia provides high-performance inference for large models like Llama 3.1 405B with excellent quality-to-speed ratio.

**Free Tier:** Yes, with rate limits

**Setup:**
1. Visit https://build.nvidia.com/explore/discover
2. Click "Sign In" or "Create Account"
3. Complete account creation
4. Navigate to any model page (e.g., "Llama 3.1 405B")
5. Click "Get API Key" button in the top right corner
6. Click "Generate API Key"
7. Copy the key (starts with `nvapi-`)
8. Add to `.env.local`:
   ```
   NVIDIA_API_KEY=nvapi-your-key-here
   ```

**Rate Limits:**
- Free tier: 1,000 requests/day
- Paid tier: Contact Nvidia for enterprise limits

---

## Configuration

### Setup Steps

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys** to `.env.local` (see provider instructions above)

3. **Verify configuration:**
   - The rotation engine automatically checks provider availability
   - Unavailable providers (missing keys) are skipped gracefully
   - Check application logs for provider availability status

### Environment File Security

**CRITICAL:** Never commit `.env.local` to version control!

The `.gitignore` file already excludes:
- `.env.local`
- `.env*.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`

Always use `.env.local` for local development and configure production secrets through your hosting platform's environment variable management.

---

## Recommended Setups

### Free Tier Setup (Minimum)
```bash
GEMINI_API_KEY=...          # Required
DEEPSEEK_API_KEY=...        # Required
GROQ_API_KEY=...            # Recommended for fast chat
OPENROUTER_API_KEY=...      # Recommended for fallback diversity
```

**Cost:** $0/month
**Capabilities:** Full discovery, architecture, specs, and generation with rate limits

---

### Pro Setup (Optimal Quality)
```bash
ANTHROPIC_API_KEY=...       # Primary model for paid tiers
GEMINI_API_KEY=...          # Long context and visual analysis
DEEPSEEK_API_KEY=...        # Reasoning and structured writing
GROQ_API_KEY=...            # Fast inference
OPENROUTER_API_KEY=...      # Unified fallback access
NVIDIA_API_KEY=...          # High-performance inference
```

**Cost:** Pay-as-you-go based on usage (typically $5-50/month for active development)
**Capabilities:** Highest quality outputs with maximum availability and minimal rate limiting

---

## Unified Rotation Architecture

Foundrie uses a **unified rotation strategy** to prevent rate limit exhaustion:

**How it works:**
1. ALL tasks route through a single `unified-rotation` chain
2. The engine tries providers in order: Claude → Gemini → DeepSeek → Nvidia → Groq → OpenRouter
3. When a provider hits rate limits, the engine automatically falls back to the next available provider
4. This ensures Foundrie never exhausts all providers for any single task

**Benefits:**
- Prevents "Error: Could not fetch response" in discovery chat
- Distributes load across all available providers
- Maximizes system availability and resilience
- No specialized model bottlenecks

**Tier-based entry points:**
- **FREE tier:** Starts at DeepSeek R1 (position 3)
- **PRO/ENTERPRISE tier:** Starts at Claude Sonnet 4 (position 1)

---

## Testing Your Setup

After adding API keys, test provider availability:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Check the logs** for provider initialization messages

3. **Test in discovery chat:**
   - Create a new project
   - Start a discovery session
   - The system will automatically use available providers

4. **Monitor rate limits:**
   - Application logs show which provider handled each request
   - Failed attempts with rate limit errors automatically trigger fallback

---

## Troubleshooting

### "Error: Could not fetch response"

**Cause:** All providers in the rotation chain are either unavailable (no API key) or rate-limited.

**Solution:**
1. Add more provider API keys to increase fallback options
2. Wait for rate limits to reset (typically 1 minute)
3. Check that keys are valid and not expired

### "Provider X unavailable (skipped)"

**Cause:** No API key configured for that provider, or the key is invalid.

**Solution:**
1. Verify the key is in `.env.local` with the exact variable name
2. Restart the development server to pick up new environment variables
3. Check for typos in the key

### High Rate Limiting

**Cause:** Free tier limits are reached quickly during active development.

**Solution:**
1. Add API keys for more providers to increase rotation diversity
2. Consider upgrading to paid tiers for higher rate limits
3. The unified rotation strategy already minimizes rate limit impact

---

## Cost Estimation

### Free Tier (All Providers)
- **Monthly cost:** $0
- **Typical usage:** 500-2,000 AI calls/day
- **Best for:** Learning, small projects, low-volume development

### Paid Tier (Mixed)
Keep free providers + add paid Claude:
- **Monthly cost:** $10-30
- **Typical usage:** 5,000-15,000 AI calls/day
- **Best for:** Active development, medium projects

### Enterprise (All Paid)
- **Monthly cost:** $50-200+
- **Typical usage:** Unlimited within provider limits
- **Best for:** Production deployments, high-volume usage

---

## Next Steps

1. ✅ Obtain API keys for at least Gemini and DeepSeek
2. ✅ Add keys to `.env.local`
3. ✅ Start the development server
4. ✅ Test discovery chat to verify providers are working
5. ✅ Add more providers over time as needed

For questions or issues, refer to:
- `architecture-context.md` - Model rotation architecture
- `code-standards.md` - AI integration patterns
- Feature spec 05 - AI Rotation Engine implementation details
