# Feature 73 - Test Validation and Deployment

## Type

NEW FEATURE

## What This Delivers

Comprehensive end-to-end test suite validating all V15.0.0 features, CI/CD pipeline configuration, deployment checklist automation, and production smoke tests. Implements the 128 test cases defined in `test-validation-plan.md`, sets up GitHub Actions workflows, configures environment validation, and provides deployment verification scripts. Ensures V15.0.0 is production-ready with zero P0 bugs.

## Dependencies

- ALL Features 53-63 must be complete for comprehensive E2E testing.
- Feature 01 (Design System) provides test infrastructure (Vitest, React Testing Library).

## Context To Read First

- `context/test-validation-plan.md` (all 128 test cases)
- `context/build-plan.md` (Phase 14: Integration Testing & Validation, Phase 15: Deployment)
- `context/progress-tracker.md`

## Context7 Docs To Check

- Playwright for E2E testing
- GitHub Actions for CI/CD
- Vercel CLI for deployment automation

```bash
npx ctx7 library playwright "E2E testing best practices"
npx ctx7 library github-actions "Workflow syntax and caching"
npx ctx7 library vercel-cli "Deploy with environment variables"
```

## Files Owned

- `tests/e2e/dynamic-phases.spec.ts`
- `tests/e2e/media-upload.spec.ts`
- `tests/e2e/premium-ui.spec.ts`
- `tests/e2e/session-management.spec.ts`
- `tests/e2e/zip-export.spec.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `scripts/validate-env.ts`
- `scripts/smoke-test.ts`
- `scripts/pre-deploy.ts`
- `playwright.config.ts`

## Files

CREATE: `tests/e2e/dynamic-phases.spec.ts` - test phase detection and transitions
CREATE: `tests/e2e/media-upload.spec.ts` - test Cloudinary uploads and organization
CREATE: `tests/e2e/premium-ui.spec.ts` - test animations, glass morphism, responsive design
CREATE: `tests/e2e/session-management.spec.ts` - test pause/resume/discard workflow
CREATE: `tests/e2e/zip-export.spec.ts` - test complete ZIP generation with media
CREATE: `playwright.config.ts` - Playwright configuration
CREATE: `.github/workflows/ci.yml` - CI pipeline (test, lint, build on PR)
CREATE: `.github/workflows/deploy-staging.yml` - staging deployment on merge to develop
CREATE: `.github/workflows/deploy-production.yml` - production deployment on merge to main
CREATE: `scripts/validate-env.ts` - validate required environment variables
CREATE: `scripts/smoke-test.ts` - production smoke tests (read-only)
CREATE: `scripts/pre-deploy.ts` - pre-deployment checklist automation
MODIFY: `package.json` - add test scripts and Playwright dependency
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Install Playwright: `npm install -D @playwright/test@1.50.0 --save-exact`
- **CRITICAL**: E2E tests must use test database (not production data).
- **CRITICAL**: Smoke tests in production must be read-only (no data mutations).
- **CRITICAL**: GitHub Actions secrets must be configured before CI/CD works.

### E2E Test: Dynamic Phase Detection

```typescript
// tests/e2e/dynamic-phases.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dynamic Phase Detection', () => {
  test('SIMPLE project auto-advances through 3-4 phases', async ({ page }) => {
    // Create SIMPLE project from template
    await page.goto('/projects/new');
    await page.click('text=Portfolio Site');
    await page.fill('input[name="name"]', 'Test Portfolio');
    await page.click('button:has-text("Create Project")');

    // Wait for discovery chat
    await expect(page.locator('h1')).toContainText('Discovery');

    // Send first message
    await page.fill('textarea[placeholder*="message"]', 'Build a dark theme portfolio showcasing my projects');
    await page.click('button:has-text("Send")');

    // Verify AI classifies as SIMPLE
    await expect(page.locator('text=/Phase \\d of (3|4)/')).toBeVisible();

    // Answer 5-8 questions with clear responses
    for (let i = 0; i < 8; i++) {
      await page.waitForSelector('.ai-message', { timeout: 10000 });
      await page.fill('textarea', `Clear answer to question ${i + 1}`);
      await page.click('button:has-text("Send")');
    }

    // Verify auto-advance to architecture phase
    await expect(page.locator('text=/Phase (3|4) of (3|4)/')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Architecture')).toBeVisible();
  });

  test('COMPLEX project holds at low confidence', async ({ page }) => {
    // Create COMPLEX project
    await page.goto('/projects/new');
    await page.fill('input[name="name"]', 'Multi-tenant Platform');
    await page.fill('textarea[name="description"]', 'Real-time collaboration with conflict resolution');
    await page.click('button:has-text("Start from Scratch")');

    // Send vague response to Scope & Constraints
    await page.goto('/projects/[id]/discovery'); // Navigate to created project
    // ... navigate to scope phase ...
    await page.fill('textarea', 'We need to scale');
    await page.click('button:has-text("Send")');

    // Verify AI holds with clarification request
    await expect(page.locator('text=/need more details/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/confidence/i')).toContainText(/[0-5][0-9]%/); // < 60%
  });
});
```

### E2E Test: Media Upload

```typescript
// tests/e2e/media-upload.spec.ts

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Media Upload and Management', () => {
  test('uploads image to Cloudinary and displays thumbnail', async ({ page }) => {
    await page.goto('/projects/[id]/discovery');

    // Upload image via file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.jpg'));

    // Wait for upload progress
    await expect(page.locator('text=/\\d+%/')).toBeVisible();

    // Wait for completion
    await expect(page.locator('.file-card')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('img[alt*="test-image"]')).toBeVisible();
  });

  test('categorizes files and filters correctly', async ({ page }) => {
    await page.goto('/projects/[id]/research');

    // Change file category
    await page.click('.file-card:first-child');
    await page.selectOption('select[name="category"]', 'wireframes');
    await page.click('button:has-text("Save")');

    // Filter by category
    await page.selectOption('select[name="categoryFilter"]', 'wireframes');
    
    // Verify filtered results
    const visibleCards = await page.locator('.file-card').count();
    expect(visibleCards).toBeGreaterThanOrEqual(1);
  });

  test('bulk deletes files with confirmation', async ({ page }) => {
    await page.goto('/projects/[id]/research');

    // Select multiple files
    await page.click('button:has-text("Bulk Select")');
    await page.click('.file-card:nth-child(1) input[type="checkbox"]');
    await page.click('.file-card:nth-child(2) input[type="checkbox"]');

    // Delete
    await page.click('button:has-text("Delete Selected")');
    
    // Confirm
    await expect(page.locator('text=/delete 2 files/i')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Verify deletion
    await expect(page.locator('text=/deleted successfully/i')).toBeVisible();
  });
});
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: foundrie_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma client
        run: npm run db:generate
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/foundrie_test
      
      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/foundrie_test
      
      - name: Run unit tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/foundrie_test
      
      - name: Run lint
        run: npm run lint
      
      - name: Run build
        run: npm run build
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/foundrie_test
          NEXT_PUBLIC_APP_URL: http://localhost:3000
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Validation Script

```typescript
// scripts/validate-env.ts

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'GEMINI_API_KEY',
  'TRIGGER_SECRET_KEY',
  'BLOB_READ_WRITE_TOKEN',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_APP_URL',
];

const OPTIONAL_ENV_VARS = [
  'OPENROUTER_API_KEY',
  'GROQ_API_KEY',
  'DEEPSEEK_API_KEY',
  'ANTHROPIC_API_KEY',
  'TAVILY_API_KEY',
];

function validateEnv(): boolean {
  let isValid = true;
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
      isValid = false;
    }
  }

  // Check optional vars
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Report
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(v => console.warn(`  - ${v}`));
  }

  if (isValid) {
    console.log('✅ All required environment variables are set');
  }

  return isValid;
}

if (!validateEnv()) {
  process.exit(1);
}
```

### Smoke Test Script

```typescript
// scripts/smoke-test.ts

async function runSmokeTests(baseUrl: string): Promise<boolean> {
  console.log(`Running smoke tests against ${baseUrl}...`);

  const tests = [
    {
      name: 'Home page loads',
      test: async () => {
        const res = await fetch(`${baseUrl}/`);
        return res.status === 200;
      },
    },
    {
      name: 'API health check',
      test: async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        return res.status === 200;
      },
    },
    {
      name: 'Dashboard loads (auth required)',
      test: async () => {
        const res = await fetch(`${baseUrl}/dashboard`);
        // 200 (if public) or 307 (redirect to login)
        return [200, 307].includes(res.status);
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.error(`❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
runSmokeTests(baseUrl).then(success => {
  process.exit(success ? 0 : 1);
});
```

### Playwright Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "validate-env": "tsx scripts/validate-env.ts",
    "smoke-test": "tsx scripts/smoke-test.ts",
    "pre-deploy": "tsx scripts/pre-deploy.ts"
  }
}
```

## Out of Scope

- Load testing (performance benchmarks under high traffic)
- Security penetration testing (use external security audit)
- Visual regression testing (screenshot comparison)
- Chaos engineering (fault injection testing)

## Future Modifications

- Future features may add load testing with k6 or Artillery
- Future features may add visual regression testing with Percy or Chromatic
- Future features may add automated security scanning with Snyk

## Quality Gates

- Run `npm run test` and ensure it passes (all 128 test cases from test-validation-plan.md)
- Run `npm run test:e2e` and ensure it passes (all 5 E2E test files)
- Run `npm run lint` and ensure it passes
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Run `npm run validate-env` in staging and production
- Run `npm run smoke-test` after deployment

## Acceptance Criteria

- [ ] 128 test cases implemented (unit, integration, E2E)
- [ ] E2E tests cover: dynamic phases, media upload, premium UI, session management, ZIP export
- [ ] Playwright configured with Chrome, Firefox, Safari, Mobile Chrome
- [ ] CI pipeline configured (test, lint, build on every PR)
- [ ] Staging deployment pipeline configured (auto-deploy on merge to develop)
- [ ] Production deployment pipeline configured (auto-deploy on merge to main)
- [ ] Environment validation script checks all required vars
- [ ] Smoke test script validates critical endpoints (read-only)
- [ ] Pre-deploy script runs all quality gates
- [ ] GitHub Actions secrets configured (API keys, database URLs)
- [ ] Test database separate from production
- [ ] E2E tests use test data (no production mutations)
- [ ] Smoke tests in production are read-only
- [ ] All tests pass with zero failures
- [ ] Code coverage ≥ 80% for critical modules
- [ ] Performance benchmarks met (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)