import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const MAX_FILE_BYTES = 2_000_000;
const TEXT_EXTENSIONS = new Set([
  "",
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".prisma",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

const SECRET_RULES = [
  {
    id: "private-key",
    pattern: new RegExp(
      "-----BEGIN " + "(?:RSA |EC |OPENSSH |)" + "PRIVATE KEY-----",
    ),
  },
  {
    id: "aws-access-key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/,
  },
  {
    id: "api-secret-assignment",
    pattern:
      /(?:^|\s)(?:process\.env\.)?[A-Z][A-Z0-9_]*(?:API_KEY|SECRET_KEY|WEBHOOK_SECRET|CLIENT_SECRET|PRIVATE_KEY|DATABASE_URL|DIRECT_URL|BLOB_READ_WRITE_TOKEN|PASSWORD|AUTH_TOKEN)[A-Z0-9_]*\s*=\s*["']?([^"'\s#;]+)/,
    valueGroup: 1,
  },
];

const files = gitFiles();
const findings = [];

for (const file of files) {
  const absolutePath = path.join(ROOT, file);
  let stat;
  try {
    stat = statSync(absolutePath);
  } catch {
    continue;
  }

  if (!stat.isFile() || stat.size > MAX_FILE_BYTES || !isTextCandidate(file)) {
    continue;
  }

  const content = readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const rule of SECRET_RULES) {
      // Skip sensitive patterns in documentation and example files
      if (
        (rule.id === "api-secret-assignment" || rule.id === "private-key") &&
        isDocumentationFile(file)
      ) {
        continue;
      }

      const match = line.match(rule.pattern);
      if (!match) continue;

      const value = rule.valueGroup ? match[rule.valueGroup] : match[0];
      if (isPlaceholderValue(value, line)) continue;

      findings.push({
        file,
        line: index + 1,
        rule: rule.id,
      });
    }
  }
}

if (findings.length > 0) {
  process.stderr.write("Secret scan failed:\n");
  for (const finding of findings) {
    process.stderr.write(`- ${finding.file}:${finding.line} [${finding.rule}]\n`);
  }
  process.exit(1);
}

process.stdout.write("Secret scan passed.\n");

function gitFiles() {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: ROOT, encoding: "utf8" },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr || "Unable to list repository files.\n");
    process.exit(result.status || 1);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function isTextCandidate(file) {
  const basename = path.basename(file);
  const extension = path.extname(file);
  return (
    TEXT_EXTENSIONS.has(extension) ||
    basename === ".env.example" ||
    basename === ".gitignore"
  );
}

function isPlaceholderValue(value, line) {
  const normalized = value.toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "key" ||
    normalized === "secret" ||
    normalized === "password" ||
    normalized.includes("localhost") ||
    normalized.includes("user:pass") ||
    normalized.includes("user:password") ||
    normalized.includes("xxxx") ||
    normalized.includes("placeholder") ||
    normalized.includes("example") ||
    normalized.includes("your_") ||
    normalized.includes("<") ||
    normalized === "..." ||
    line.includes("\\n...")
  );
}

function isDocumentationFile(file) {
  return (
    file.endsWith(".md") ||
    file.startsWith(".agents/skills/") ||
    file.endsWith(".env.example") ||
    file === ".env.example"
  );
}
