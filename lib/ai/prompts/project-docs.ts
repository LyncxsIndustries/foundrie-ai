export function getProductionChecklistMdPrompt() {
  return `You are an expert technical lead preparing a project for production.
Generate the PRODUCTION-CHECKLIST.md document for the project.
It must include:
- Security: sandboxing for agentic features, secret management.
- Reliability: circuit breakers, fallback models, load testing.
- Observability: structured logging, OTel, alerts.
- Delivery: semver, canary/blue-green, rollback, behavioral evals ≥ 95%.
Adapt the checklist to the approved project stack. Do not assume Foundrie's own stack unless explicitly approved. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}

export function getQualityGateMdPrompt() {
  return `You are an expert QA and DevOps engineer.
Generate the QUALITY-GATE.md document.
It must include:
- The three-category gate: Document, Code-Technical, and Research.
- Each checklist for the three categories.
- The failure protocol: identify -> classify generation vs data failure -> route -> re-check -> log.
- The Quality Gate Log table.
Adapt to the approved stack. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}

export function getLoggingMdPrompt() {
  return `You are an expert site reliability engineer.
Generate the LOGGING.md document.
It must include:
- The 7-item logging checklist.
- The log-level policy (DEBUG/INFO/WARN/ERROR/FATAL/AUDIT).
- The request-ID and \`trace_id\` requirement.
- The chosen centralized destination (e.g. Datadog/Logtail/CloudWatch/Grafana Loki) based on the architecture context.
- Retention policy.
- The alert rule (ERROR rate > 1% over 5 min).
- A strict rule that forbids \`console.log\` in production paths.
Adapt to the approved stack. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}

export function getSecurityMdPrompt() {
  return `You are an expert AppSec engineer.
Generate the SECURITY.md document.
It must include:
- The dependency-security three-step protocol (audit today, lock versions, monthly cadence).
- The seven-layer security model mapped to the project.
- OWASP mitigations.
- Secrets management.
- SBOM / Dependabot note.
Adapt to the approved stack. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}

export function getPrivacyMdPrompt() {
  return `You are an expert privacy engineer.
Generate the PRIVACY.md document.
It must include:
- Data collection defaults.
- Opt-in policy.
- PII scrubbing patterns.
Adapt to the approved stack. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}

export function getToolingMdPrompt() {
  return `You are an expert developer productivity engineer.
Generate the TOOLING.md document.
It must include:
- The AI-era tooling matrix adapted to the approved stack.
Adapt to the approved stack. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}

export function getContributingMdPrompt() {
  return `You are an expert open-source maintainer.
Generate the CONTRIBUTING.md document.
It must include:
- Conventional Commits.
- The branch/PR/CodeRabbit workflow.
Adapt to the approved stack. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}

export function getAdrMdPrompt() {
  return `You are an expert software architect.
Based on the architecture decisions provided, generate individual Architecture Decision Records (ADRs).
Format the output strictly as a JSON array of objects. 
Each object must have:
- "filename": string (e.g. "ADR-0001-Database.md")
- "content": string (the markdown content of the ADR)
Return ONLY the JSON array. Do not include markdown codeblocks or any other text.`;
}

export function getRedTeamMdPrompt() {
  return `You are an expert AI Red Teamer.
Generate the docs/security/RED-TEAM.md document for an agentic AI project.
It must include:
- Prompt injection defenses.
- Output validation.
- Agentic sandbox escape mitigations.
- Guardrails for tool usage.
Adapt to the approved stack. Cite sources.
Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.`;
}
