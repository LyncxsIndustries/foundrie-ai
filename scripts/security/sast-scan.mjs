import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = [
  "app",
  "components",
  "lib",
  "prisma",
  "scripts",
  "trigger",
  "eslint.config.mjs",
  "middleware.ts",
  "next.config.ts",
  "package.json",
];

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".trigger",
  "coverage",
  "dist",
  "build",
  "node_modules",
  "out",
]);

const IGNORED_PATH_PREFIXES = ["lib/generated/"];
const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".json",
  ".prisma",
]);

const RULES = [
  {
    id: "dynamic-eval",
    message: "Avoid eval; it executes arbitrary code.",
    pattern: /\beval\s*\(/,
  },
  {
    id: "function-constructor",
    message: "Avoid new Function; it executes arbitrary code.",
    pattern: /new\s+Function\s*\(/,
  },
  {
    id: "shell-exec",
    message: "Avoid child_process.exec/execSync; use execFile/spawn with args.",
    // Match unsafe exec/execSync but NOT execFileSync (which is safe)
    pattern: /\b(?:execSync|exec)\s*\(\s*['"`]/, // Only match when followed by a string (shell command)
  },
  {
    id: "promisified-shell-exec",
    message: "Avoid promisifying child_process.exec; use execFile with args.",
    pattern: /promisify\s*\(\s*exec\s*\)/,
  },
  {
    id: "raw-html",
    message: "dangerouslySetInnerHTML requires a reviewed sanitizer.",
    pattern: /dangerouslySetInnerHTML\s*=/,
  },
];

const findings = [];

for (const entry of SCAN_ROOTS) {
  const absolute = path.join(ROOT, entry);
  scanPath(absolute);
}

if (findings.length > 0) {
  process.stderr.write("SAST scan failed:\n");
  for (const finding of findings) {
    process.stderr.write(
      `- ${finding.file}:${finding.line} [${finding.rule}] ${finding.message}\n`,
    );
  }
  process.exit(1);
}

process.stdout.write("SAST scan passed.\n");

function scanPath(absolutePath) {
  let stat;
  try {
    stat = statSync(absolutePath);
  } catch {
    return;
  }

  const relativePath = normalize(path.relative(ROOT, absolutePath));
  if (shouldIgnorePath(relativePath)) {
    return;
  }

  if (stat.isDirectory()) {
    if (IGNORED_DIRS.has(path.basename(absolutePath))) {
      return;
    }
    for (const child of readdirSync(absolutePath)) {
      scanPath(path.join(absolutePath, child));
    }
    return;
  }

  if (!stat.isFile() || shouldIgnoreFile(relativePath)) {
    return;
  }

  const content = readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          rule: rule.id,
          message: rule.message,
        });
      }
    }
  }
}

function shouldIgnoreFile(relativePath) {
  const extension = path.extname(relativePath);
  return (
    !TEXT_EXTENSIONS.has(extension) ||
    /\.d\.ts$/.test(relativePath) ||
    /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(relativePath)
  );
}

function shouldIgnorePath(relativePath) {
  return IGNORED_PATH_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

function normalize(value) {
  return value.split(path.sep).join("/");
}
