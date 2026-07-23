#!/usr/bin/env node

/**
 * Enhanced Contract Synchronization & Spec-to-Code Audit Script
 * 
 * CRITICAL GATE: Verifies contract synchronization AND audits current feature
 * against spec to prevent AI hallucination and ensure implementation fidelity.
 * 
 * Per AGENTS.md Hard Rule 0:
 * - All contract changes must be synchronized across specs, context, AGENTS.md
 * - Generated code must match spec requirements exactly
 * - No implementation deviation without spec update
 * 
 * This gate MUST pass before: npm test, npm build, git push
 * 
 * SCOPE: Only checks the CURRENT feature spec (from progress-tracker.md).
 * Previous specs are assumed to have passed this check already.
 * Future specs are not checked (they're not implemented yet).
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Framework names that should NOT be treated as file paths
const FRAMEWORK_NAMES = new Set([
  'Next.js',
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Tailwind',
  'Prisma',
  'PostgreSQL',
  'MongoDB',
  'Express',
  'Vue',
  'Angular',
  '/vercel/next.js',
  '/facebook/react',
  '/microsoft/typescript',
  'Vercel',
  'AWS',
  'Azure',
  'GCP'
]);

// External icon libraries (whitelisted)
const EXTERNAL_ICONS = new Set([
  'Upload', 'ArrowDown', 'Send', 'Paperclip', 'ImageIcon', 'FileText', 'File',
  'Bot', 'CheckCircle', 'Clock', 'Circle', 'XCircle', 'Plus', 'FolderOpen',
  'Download', 'MessageCircle', 'Network', 'Image', 'Loader2', 'CheckCircle2',
  'AlertCircle', 'Users', 'Search', 'Filter', 'ChevronDown', 'Edit', 'Trash',
  'Eye', 'MoreVertical', 'X', 'Check', 'Info', 'Warning', 'Error', 'Pause',
  'Play', 'FileIcon', 'VideoIcon', 'PaperclipIcon', 'SendIcon'
]);

// Built-in TypeScript/Browser types (whitelisted)
const BUILTIN_TYPES = new Set([
  'HTMLElement', 'HTMLDivElement', 'HTMLButtonElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'HTMLFormElement', 'HTMLAnchorElement', 'HTMLImageElement',
  'NodeJS', 'Buffer', 'Promise', 'Array', 'Map', 'Set', 'Date', 'Error',
  'ReadableStream', 'WritableStream', 'Blob', 'File', 'FormData', 'Headers',
  'Request', 'Response', 'URL', 'URLSearchParams', 'AbortController',
  'EventTarget', 'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent',
  'React', 'ReactNode', 'ReactElement', 'JSX', 'FC', 'ComponentProps',
  'ReactMarkdown', 'MessageRole', 'AttachmentType', 'MediaCategory'
]);

// Common library components (whitelisted)
const LIBRARY_COMPONENTS = new Set([
  'ReactMarkdown', 'Skeleton', 'ScrollArea', 'Tabs', 'TabsList', 'TabsContent',
  'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'Alert', 'Badge'
]);

interface SpecRequirement {
  file: string;
  requirement: string;
  line: number;
  type: 'file' | 'component' | 'route' | 'model' | 'enum';
}

interface AuditResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  requirements: {
    total: number;
    verified: number;
    missing: number;
  };
}

let globalErrors: string[] = [];
let globalWarnings: string[] = [];

function log(message: string, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function error(message: string) {
  globalErrors.push(message);
  log(`✗ ${message}`, RED);
}

function warning(message: string) {
  globalWarnings.push(message);
  log(`⚠ ${message}`, YELLOW);
}

function success(message: string) {
  log(`✓ ${message}`, GREEN);
}

function info(message: string) {
  log(`ℹ ${message}`, BLUE);
}

/**
 * Get current feature number from git branch or progress tracker
 */
function getCurrentFeature(): number | null {
  // Try Vercel environment variable
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    const branchMatch = process.env.VERCEL_GIT_COMMIT_REF.match(/feature\/(\d+)-/);
    if (branchMatch) {
      return parseInt(branchMatch[1], 10);
    }
  }

  // Try GitHub Actions environment variable
  if (process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME) {
    const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';
    const branchMatch = branch.match(/feature\/(\d+)-/);
    if (branchMatch) {
      return parseInt(branchMatch[1], 10);
    }
  }
  // First, try to get feature number from git branch name
  try {
    const { execFileSync } = require('child_process');
    const branchName = execFileSync('git', ['branch', '--show-current'], { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    
    // Pattern: feature/NN-slug or feature/NNN-slug
    const branchMatch = branchName.match(/feature\/(\d+)-/);
    if (branchMatch) {
      return parseInt(branchMatch[1], 10);
    }
  } catch (err) {
    // Git command failed, fall back to progress tracker
  }

  // Fall back to progress tracker
  const trackerPath = path.join(process.cwd(), 'project-kit/context/progress-tracker.md');
  
  if (!fs.existsSync(trackerPath)) {
    error('progress-tracker.md not found');
    return null;
  }

  const content = fs.readFileSync(trackerPath, 'utf8');
  
  // Look for "In Progress" section
  const inProgressMatch = content.match(/## In Progress(?:(?!\n## )[\s\S])*?Feature (\d+)/);
  if (inProgressMatch) {
    return parseInt(inProgressMatch[1], 10);
  }

  // Look for "Current Goal" section
  const currentGoalMatch = content.match(/## Current Goal(?:(?!\n## )[\s\S])*?Feature (\d+)/);
  if (currentGoalMatch) {
    return parseInt(currentGoalMatch[1], 10);
  }

  return null;
}

/**
 * Check if line is in an excluded section (Out of Scope, Future Modifications)
 */
function isInExcludedSection(lines: string[], lineIndex: number): boolean {
  // Look backwards from current line to find the most recent section header
  for (let i = lineIndex; i >= 0; i--) {
    const line = lines[i].trim();
    
    // Check if we hit an excluded section
    if (line.includes('## Out of Scope') || 
        line.includes('## Future Modifications') ||
        line.includes('## Future Implementation')) {
      return true;
    }
    
    // Check if we hit a different section (stops the exclusion)
    if (line.startsWith('##') && 
        !line.includes('Out of Scope') && 
        !line.includes('Future Modifications') &&
        !line.includes('Future Implementation')) {
      return false;
    }
  }
  
  return false;
}

/**
 * Extract requirements from the current spec file
 */
function extractSpecRequirements(specPath: string): SpecRequirement[] {
  const content = fs.readFileSync(specPath, 'utf8');
  const requirements: SpecRequirement[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip excluded sections
    if (isInExcludedSection(lines, i)) {
      continue;
    }

    // Extract file paths mentioned in specs
    // Pattern: `path/to/file.ts` but skip framework names
    const filePatternBacktick = /`([a-zA-Z0-9\/_\-\.@]+\.(ts|tsx|js|jsx|css|prisma|json))`/g;
    
    let match;
    while ((match = filePatternBacktick.exec(line)) !== null) {
      const filePath = match[1];
      
      // Skip if it's a framework name
      if (FRAMEWORK_NAMES.has(filePath)) {
        continue;
      }
      
      requirements.push({
        file: filePath,
        requirement: `File must exist: ${filePath}`,
        line: i + 1,
        type: 'file',
      });
    }

    // Extract component names (but skip external icons and library components)
    const componentPattern = /<([A-Z][a-zA-Z0-9]+)|export\s+(function|const)\s+([A-Z][a-zA-Z0-9]+)/g;
    while ((match = componentPattern.exec(line)) !== null) {
      const componentName = match[1] || match[3];
      
      if (!componentName || componentName.length <= 1) continue;
      if (EXTERNAL_ICONS.has(componentName)) continue;
      if (LIBRARY_COMPONENTS.has(componentName)) continue;
      
      requirements.push({
        file: '',
        requirement: `Component or function must exist: ${componentName}`,
        line: i + 1,
        type: 'component',
      });
    }

    // Extract route patterns
    // Skip lines that are file operation descriptions (CREATE:, MODIFY:, DELETE:)
    // Skip lines with backticked route.ts paths (already handled as file requirements)
    if (!line.trim().match(/^(CREATE|MODIFY|DELETE|UPDATE):/) && !line.includes('`') && !line.includes('route.ts')) {
      const routePattern = /(GET|POST|PUT|DELETE|PATCH)?\s*(\/api\/[a-zA-Z0-9\/_\-\[\]]+)/g;
      while ((match = routePattern.exec(line)) !== null) {
        requirements.push({
          file: `app${match[2]}/route.ts`,
          requirement: `Route must exist: ${match[1] || 'handler'} ${match[2]}`,
          line: i + 1,
          type: 'route',
        });
      }
    }

    // Extract Prisma models
    const modelPattern = /model\s+([A-Z][a-zA-Z0-9]+)|db\.([a-z][a-zA-Z0-9]+)\./g;
    while ((match = modelPattern.exec(line)) !== null) {
      const modelName = match[1] || match[2];
      requirements.push({
        file: 'prisma/schema.prisma',
        requirement: `Prisma model must exist: ${modelName}`,
        line: i + 1,
        type: 'model',
      });
    }

    // Extract enums
    const enumPattern = /enum\s+([A-Z][a-zA-Z0-9]+)/g;
    while ((match = enumPattern.exec(line)) !== null) {
      requirements.push({
        file: 'prisma/schema.prisma',
        requirement: `Enum must exist: ${match[1]}`,
        line: i + 1,
        type: 'enum',
      });
    }
  }

  return requirements;
}

/**
 * Verify a file requirement exists
 * Handles Next.js dynamic route segments like [projectId]
 */
function verifyFileRequirement(req: SpecRequirement): boolean {
  const filePath = path.join(process.cwd(), req.file);
  
  // Direct check first
  if (fs.existsSync(filePath)) {
    return true;
  }
  
  // For routes with dynamic segments like [projectId], use glob to find matches
  if (req.file.includes('[') && req.file.includes(']')) {
    try {
      // Convert [param] to glob pattern *
      const globPattern = req.file.replace(/\[[^\]]+\]/g, '*');
      const matches = glob.sync(globPattern, {
        cwd: process.cwd(),
        absolute: false,
      });
      return matches.length > 0;
    } catch (err) {
      return false;
    }
  }
  
  return false;
}

/**
 * Search codebase for a component/function
 */
function searchCodebase(pattern: string): boolean {
  // Skip built-in types
  if (BUILTIN_TYPES.has(pattern)) {
    return true;
  }
  
  try {
    const searchPaths = [
      'app/**/*.{ts,tsx,js,jsx}',
      'components/**/*.{ts,tsx,js,jsx}',
      'lib/**/*.{ts,tsx,js,jsx}',
      'trigger/**/*.{ts,tsx,js,jsx}',
    ];

    for (const searchPath of searchPaths) {
      const files = glob.sync(searchPath, {
        cwd: process.cwd(),
        absolute: true,
      });

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Search for: export function Name, export const Name, function Name, const Name
        const regex = new RegExp(`(export\\s+)?(function|const|class|interface|type)\\s+${pattern}\\b`);

        if (regex.test(content)) {
          return true;
        }
      }
    }
  } catch (err) {
    // Silently fail - will be caught as missing
  }

  return false;
}

/**
 * Verify Prisma schema contains model/enum
 */
function verifyPrismaEntity(name: string, type: 'model' | 'enum'): boolean {
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    return false;
  }

  const content = fs.readFileSync(schemaPath, 'utf8');
  const pattern = new RegExp(`${type}\\s+${name}\\s*\\{`, 'i');
  return pattern.test(content);
}

/**
 * Audit the current feature spec against codebase
 */
function auditCurrentSpec(specPath: string): AuditResult {
  const specName = path.basename(specPath, '.md');
  log(`\n📋 Auditing current spec: ${specName}`, BLUE);

  const requirements = extractSpecRequirements(specPath);
  const errors: string[] = [];
  const warnings: string[] = [];
  let verified = 0;
  let missing = 0;

  info(`   Found ${requirements.length} requirements to verify`);

  for (const req of requirements) {
    let isVerified = false;

    switch (req.type) {
      case 'file':
      case 'route':
        isVerified = verifyFileRequirement(req);
        if (!isVerified) {
          errors.push(`${req.requirement} (line ${req.line})`);
          missing++;
        } else {
          verified++;
        }
        break;

      case 'component':
        const componentName = req.requirement.match(/:\s+(.+)$/)?.[1] || '';
        isVerified = searchCodebase(componentName);
        if (!isVerified) {
          warnings.push(`${req.requirement} (line ${req.line}) - not found in codebase`);
          missing++;
        } else {
          verified++;
        }
        break;

      case 'model':
        const modelName = req.requirement.match(/:\s+(.+)$/)?.[1] || '';
        isVerified = verifyPrismaEntity(modelName, 'model');
        if (!isVerified) {
          errors.push(`${req.requirement} (line ${req.line})`);
          missing++;
        } else {
          verified++;
        }
        break;

      case 'enum':
        const enumName = req.requirement.match(/:\s+(.+)$/)?.[1] || '';
        isVerified = verifyPrismaEntity(enumName, 'enum');
        if (!isVerified) {
          errors.push(`${req.requirement} (line ${req.line})`);
          missing++;
        } else {
          verified++;
        }
        break;
    }
  }

  const passed = errors.length === 0;
  
  if (passed) {
    success(`   ✓ Spec audit passed: ${verified}/${requirements.length} requirements verified`);
  } else {
    error(`   ✗ Spec audit failed: ${missing} missing requirements`);
  }

  return {
    passed,
    errors,
    warnings,
    requirements: {
      total: requirements.length,
      verified,
      missing,
    },
  };
}

/**
 * Check contract synchronization
 */
function checkContractSync() {
  log('\n🔒 CONTRACT SYNCHRONIZATION CHECK', YELLOW);

  const agentsPath = path.join(process.cwd(), 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    error('AGENTS.md not found');
    return;
  }

  const content = fs.readFileSync(agentsPath, 'utf8');
  
  // Check for Hard Rule 0
  if (!content.includes('Contract synchronization is a hard gate')) {
    error('AGENTS.md missing contract synchronization in Hard Rule 0');
  } else {
    success('AGENTS.md contains contract synchronization rule');
  }

  // Check verification gates
  const hasVerificationGates = content.includes('npm run sync:check') && 
                                content.includes('npm run security:all') && 
                                content.includes('npm run test') && 
                                content.includes('npm run build');
  
  if (!hasVerificationGates) {
    error('AGENTS.md Hard Rule 0 missing verification gate requirements');
  } else {
    success('AGENTS.md Hard Rule 0 includes all verification gates');
  }
}

/**
 * Check Prisma schema sync
 */
function checkPrismaSync() {
  log('\n🗄️  PRISMA SCHEMA CHECK', YELLOW);

  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    warning('Prisma schema not found - skipping');
    return;
  }

  success('Prisma schema exists');
  
  const clientPath = path.join(process.cwd(), 'lib/generated/prisma');
  if (!fs.existsSync(clientPath)) {
    error('Prisma client not generated - run: npm run db:generate');
  } else {
    success('Prisma client is generated');
  }
}

/**
 * Check required files
 */
function checkRequiredFiles() {
  log('\n📋 REQUIRED FILES CHECK', YELLOW);
  
  const requiredFiles = [
    'AGENTS.md',
    'ARTKINS_STYLE_GUIDE.md',
    'project-kit/context/architecture-context.md',
    'project-kit/context/progress-tracker.md',
    'project-kit/context/code-standards.md',
    '.gitignore',
    '.env.example',
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      success(`Found: ${file}`);
    } else {
      error(`Missing: ${file}`);
    }
  }
}

/**
 * Print audit summary
 */
function printAuditSummary(result: AuditResult, errorsOnly = false) {
  log('\n' + '='.repeat(70));
  log('AUDIT SUMMARY', YELLOW);
  log('='.repeat(70));

  info(`\n📊 Current Feature Spec Audit:`);
  info(`   Total requirements: ${result.requirements.total}`);
  info(`   Verified: ${result.requirements.verified}`);
  info(`   Missing: ${result.requirements.missing}`);

  if (globalErrors.length === 0) {
    if (globalWarnings.length > 0 && !errorsOnly) {
      log(`\n⚠ ${globalWarnings.length} WARNING(S):`, YELLOW);
      globalWarnings.forEach((warn, i) => log(`  ${i + 1}. ${warn}`, YELLOW));
      log('\nWarnings are informational and do not block the gate.', YELLOW);
    }

    success('\n✓ ALL CHECKS PASSED');
    success('Contract synchronization and current spec audit verified');
    log('\nYou may proceed with:');
    log('  npm run security:all');
    log('  npm run test');
    log('  npm run build');
    log('  git push\n');
    process.exit(0);
  } else {
    if (globalErrors.length > 0) {
      log(`\n✗ ${globalErrors.length} ERROR(S) FOUND:`, RED);
      globalErrors.forEach((err, i) => log(`  ${i + 1}. ${err}`, RED));
    }

    if (globalWarnings.length > 0 && !errorsOnly) {
      log(`\n⚠ ${globalWarnings.length} WARNING(S):`, YELLOW);
      globalWarnings.forEach((warn, i) => log(`  ${i + 1}. ${warn}`, YELLOW));
    } else if (globalWarnings.length > 0 && errorsOnly) {
      log(`\n⚠ ${globalWarnings.length} warning(s) suppressed (errors-only mode)`, YELLOW);
    }

    log('\n🚫 VERIFICATION GATE FAILED', RED);
    log('\nREQUIRED ACTIONS:', YELLOW);
    log('1. Fix all missing files and implementations');
    log('2. Update the current feature spec if implementation changed');
    log('3. Update dependent future specs if contracts changed');
    log('4. Update context files (architecture, code-standards, etc.)');
    log('5. Update AGENTS.md if rules changed');
    log('6. Update progress-tracker.md session notes');
    log('7. Run: npm run db:generate (if schema changed)');
    log('8. Re-run: npm run sync:check\n');

    process.exit(1);
  }
}

/**
 * Main entry point
 */
function main() {
  // Parse CLI flags
  const errorsOnly = process.argv.includes('--errors-only');
  
  log('\n🔒 ENHANCED CONTRACT SYNCHRONIZATION & CURRENT SPEC AUDIT\n', YELLOW);
  log('This is a HARD GATE per AGENTS.md Hard Rule 0');
  log('Verifying contract synchronization and current feature implementation');
  
  if (errorsOnly) {
    log('Running in ERRORS-ONLY mode (warnings suppressed)\n', YELLOW);
  } else {
    log('\n');
  }

  // Get current feature number
  const currentFeature = getCurrentFeature();
  if (currentFeature === null) {
    error('Could not determine current feature from progress-tracker.md');
    process.exit(1);
  }

  info(`Current feature: ${currentFeature}\n`);

  // Find current feature spec file
  const specNumber = currentFeature.toString().padStart(2, '0');
  const specsPath = path.join(process.cwd(), 'project-kit/feature-specs');
  const specFiles = glob.sync(`${specNumber}-*.md`, { cwd: specsPath, absolute: true });

  if (specFiles.length === 0) {
    error(`Feature spec ${specNumber}-*.md not found`);
    process.exit(1);
  }

  const currentSpecPath = specFiles[0];
  info(`Checking spec: ${path.basename(currentSpecPath)}\n`);

  // Run all checks
  checkContractSync();
  checkPrismaSync();
  checkRequiredFiles();
  
  // Audit ONLY the current spec
  const auditResult = auditCurrentSpec(currentSpecPath);
  
  // Add spec errors/warnings to global
  auditResult.errors.forEach(err => error(err));
  auditResult.warnings.forEach(warn => warning(warn));

  // Print summary
  printAuditSummary(auditResult, errorsOnly);
}

// Run verification
main();
