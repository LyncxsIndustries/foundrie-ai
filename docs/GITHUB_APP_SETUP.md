# GitHub App Setup Guide

This guide walks you through creating and configuring a GitHub App for Foundrie AI's repository integration feature (Feature 51).

## Overview

Foundrie uses a GitHub App to:
- Allow users to connect their GitHub repositories to projects
- Enable reverse architecture analysis from existing codebases
- Track repository events via webhooks
- Generate initial project context from repository structure

## Prerequisites

- A GitHub account (personal or organization)
- Admin access to create GitHub Apps
- Your Foundrie deployment URL (for webhooks and OAuth callback)

## Step 1: Create a New GitHub App

1. Go to GitHub Settings:
   - **Personal account:** https://github.com/settings/apps
   - **Organization:** https://github.com/organizations/YOUR_ORG/settings/apps

2. Click **"New GitHub App"**

3. Fill in the basic information:
   - **GitHub App name:** `Foundrie AI` (or your preferred name)
   - **Description:** `Pre-IDE architectural workspace for project planning`
   - **Homepage URL:** Your Foundrie deployment URL (e.g., `https://foundrie.yourcompany.com`)

## Step 2: Configure Permissions

### Repository Permissions

Set the following repository permissions:

| Permission | Access | Reason |
|------------|--------|--------|
| **Contents** | Read-only | Read repository files and structure |
| **Metadata** | Read-only | Access repository metadata (automatically selected) |
| **Webhooks** | Read & Write | Optional: for future repository event tracking |

### Organization Permissions

No organization permissions are required for basic functionality.

### User Permissions

No user permissions are required.

## Step 3: Subscribe to Events

If you want to track repository changes (optional for Feature 51):

- ☑ **Installation** - Track when the app is installed/uninstalled
- ☑ **Installation repositories** - Track repository access changes

## Step 4: Configure OAuth Settings

### Where can this GitHub App be installed?

Choose based on your needs:
- **Any account:** Users can install on personal or organization repos
- **Only on this account:** Restrict to your account/organization only

### Callback URL

Set the OAuth callback URL to:

```text
https://your-foundrie-domain.com/api/github/callback
```

Replace `your-foundrie-domain.com` with your actual deployment domain.

### Request user authorization (OAuth) during installation

☑ **Enable this checkbox** - Required for OAuth flow

### Setup URL (optional)

Leave blank unless you want a custom post-installation flow.

## Step 5: Set Webhook Configuration

### Webhook URL

```text
https://your-foundrie-domain.com/api/webhooks/github
```

### Webhook Secret

Generate a secure random string and save it as `GITHUB_WEBHOOK_SECRET` in your environment variables:

```bash
# Generate a secure secret (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### SSL verification

☑ **Enable SSL verification** (recommended for production)

## Step 6: Save Configuration

Click **"Create GitHub App"**

## Step 7: Generate Credentials

After creation, you'll be redirected to your app's settings page.

### 1. Get your App ID

You'll see **App ID** at the top of the page. Save this as `GITHUB_APP_ID`.

### 2. Generate a Client Secret

1. Scroll to **"Client secrets"**
2. Click **"Generate a new client secret"**
3. Copy the secret immediately (you won't be able to see it again)
4. Save as `GITHUB_CLIENT_SECRET`

### 3. Note your Client ID

Find **Client ID** in the "General" section. Save as `GITHUB_CLIENT_ID`.

### 4. Generate a Private Key

1. Scroll to **"Private keys"**
2. Click **"Generate a private key"**
3. A `.pem` file will download
4. Save the entire contents (including `-----BEGIN RSA PRIVATE KEY-----` header and footer) as `GITHUB_PRIVATE_KEY`

**Important:** Keep this private key secure and never commit it to version control.

## Step 8: Update Environment Variables

Add these variables to your `.env.local` file:

```bash
# GitHub App Configuration
GITHUB_APP_ID="123456"
GITHUB_CLIENT_ID="Iv1.abc123def456"
GITHUB_CLIENT_SECRET="your_client_secret_here"
GITHUB_PRIVATE_KEY="<PASTE_YOUR_PRIVATE_KEY_HERE>"
GITHUB_WEBHOOK_SECRET="your_webhook_secret_here"
```

**For multi-line private key in `.env`:**

You can format it in one line with `\n`:

```bash
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n<YOUR_KEY_CONTENT>\n-----END RSA PRIVATE KEY-----"
```

Or use the actual PEM file format:

```bash
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<YOUR_MULTILINE_KEY_CONTENT>
-----END RSA PRIVATE KEY-----"
```

**Security Note:** Store the private key in a secure secret manager (e.g., AWS Secrets Manager, HashiCorp Vault, or Vercel Environment Variables) rather than committing it to `.env.local`. Never commit private keys to version control.

## Step 9: Install the App

### For Testing

1. Go to your app's settings page
2. Click **"Install App"** in the left sidebar
3. Select the account/organization
4. Choose **"All repositories"** or **"Only select repositories"**
5. Click **"Install"**

### For Users

Share your app's public installation URL:

```text
https://github.com/apps/YOUR_APP_NAME/installations/new
```

Users will be redirected to OAuth authorization, then to your callback URL.

## Verification

Test your integration:

1. Start your Foundrie development server:
   ```bash
   npm run dev
   ```

2. Navigate to a project's settings in Foundrie

3. Look for the "Connect GitHub Repository" option

4. Click it and follow the OAuth flow

5. You should be redirected back to Foundrie with repository access

## Troubleshooting

### "The redirect_uri MUST match the registered callback URL"

- Verify your callback URL in GitHub App settings exactly matches your deployment domain
- Ensure you're using the correct protocol (http vs https)
- Check for trailing slashes

### "Bad credentials" or authentication errors

- Verify `GITHUB_PRIVATE_KEY` is properly formatted with newlines
- Ensure `GITHUB_APP_ID` matches your app's ID exactly
- Check that the private key hasn't been rotated or deleted

### Webhook delivery failures

- Check your webhook URL is publicly accessible
- Verify `GITHUB_WEBHOOK_SECRET` matches what you set in GitHub
- Check webhook delivery attempts in GitHub App settings → Advanced → Recent Deliveries

### Installation issues

- Verify the app has the correct permissions for the repositories
- Check that the user installing has admin access to the repository
- Review the app's installation settings (any account vs specific account)

## Security Best Practices

1. **Rotate credentials regularly:** Generate new client secrets and private keys periodically
2. **Use webhook secrets:** Always verify webhook signatures using `GITHUB_WEBHOOK_SECRET`
3. **Limit permissions:** Only request the minimum permissions needed
4. **Store credentials securely:** Use environment variables, never commit to version control
5. **Monitor access:** Regularly review installation logs and webhook deliveries
6. **Revoke unused keys:** Delete old private keys and client secrets after rotation

## Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [GitHub Apps Best Practices](https://docs.github.com/en/apps/creating-github-apps/setting-up-a-github-app/best-practices-for-creating-a-github-app)
- [Authenticating with GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app)

## Support

If you encounter issues not covered in this guide, check:
- Foundrie's GitHub repository issues
- GitHub App webhook delivery logs
- Foundrie's application logs for detailed error messages
