---
name: security-audit
description: "Comprehensive security auditing workflow covering web application testing, API security, penetration testing, vulnerability scanning, and security hardening."
category: workflow-bundle
risk: restricted
source: personal
date_added: "2026-02-27"
---

# Security Auditing Workflow Bundle

## Overview

Comprehensive security auditing workflow for web applications, APIs, and infrastructure. This bundle orchestrates skills for penetration testing, vulnerability assessment, security scanning, and remediation.

**`risk: restricted`:** This skill must **not** be treated as `safe`. Active attack scenarios, exploit execution, and Metasploit use are **blocked** unless a written Rules of Engagement (ROE) is approved (see Blocking Precondition below). Source: [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final) §3 (planning / rules of engagement).

## Blocking Precondition (before Phase 1)

Do **not** start reconnaissance, scanning, or exploitation until written authorization and ROE exist, covering:

1. Exact targets (hosts, apps, APIs, CIDRs)
2. Time bounds (start/end windows)
3. Permitted and prohibited actions
4. Rate limits
5. Stop conditions / emergency halt
6. Explicit human approval before any **external** target engagement

Sources: [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final); [OWASP Testing Guide — Introduction](https://owasp.org/www-project-web-security-testing-guide/).

## When to Use This Workflow

Use this workflow when:
- Performing security audits on web applications
- Testing API security
- Conducting penetration tests (ROE required)
- Scanning for vulnerabilities
- Hardening application security
- Compliance security assessments

## Workflow Phases

### Phase 1: Reconnaissance

**Citation:** [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final) §4.1 (discovery); [OWASP WSTG — Information Gathering](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/).

#### Skills to Invoke
- `webapp-testing` — browser/app interaction toolkit (provisioned alias for scanning/recon workflows)
- `code-review` — static review of exposed surfaces / configs
- `webapp-testing` — also covers OWASP-oriented UI checks (alias target for former `top-web-vulnerabilities`)

> Lock aliases: `scanning-tools` → `webapp-testing`; `shodan-reconnaissance` → `webapp-testing` (manual OSINT only within ROE; no unprovisioned Shodan skill); `top-web-vulnerabilities` → `code-review` + OWASP Top 10 checklist below.

#### Actions
1. Identify target scope (must match ROE)
2. Gather intelligence
3. Map attack surface
4. Identify technologies
5. Document findings

#### Copy-Paste Prompts

```text
Use @webapp-testing to perform initial reconnaissance within the approved ROE scope
```

```text
Use @webapp-testing to inventory exposed services listed in the ROE (no out-of-scope scanning)
```

### Phase 2: Vulnerability Scanning

**Citation:** [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final) §4.2 (vulnerability analysis); [OWASP Top 10](https://owasp.org/www-project-top-ten/) and [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/).

#### Skills to Invoke
- `code-review` — vulnerability analysis / SAST-oriented review
- `security-audit` — this workflow’s dependency/SAST checklist (maps former `security-scanning-security-*`)

#### Actions
1. Run automated scanners (only tools allowed by ROE)
2. Perform static analysis
3. Scan dependencies (`npm run security:all` in Foundrie)
4. Identify misconfigurations
5. Document vulnerabilities

#### Copy-Paste Prompts

```text
Use @code-review to scan for OWASP Top 10 vulnerability classes in application code
```

```text
Run npm run security:all and use @code-review to triage dependency advisories
```

### Phase 3: Web Application Testing

**Citation:** [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/); [OWASP Top 10](https://owasp.org/www-project-top-ten/).

#### Skills to Invoke
- `webapp-testing` — interactive application testing
- `code-review` — injection / auth / access-control review assistance

#### Actions
1. Test for injection flaws
2. Test authentication mechanisms
3. Test session management
4. Test access controls
5. Test input validation
6. Test security headers

#### Copy-Paste Prompts

```text
Ensure written authorization, approved ROE, and human approval exist before testing external targets. Use @webapp-testing to test for SQL injection vulnerabilities on in-scope endpoints.
```

```text
Ensure written authorization, approved ROE, and human approval exist before testing external targets. Use @webapp-testing to test for cross-site scripting on in-scope forms.
```

```text
Use @code-review to review authentication and session handling against OWASP guidance
```

### Phase 4: API Security Testing

**Citation:** [OWASP API Security Top 10](https://owasp.org/www-project-api-security/).

#### Skills to Invoke
- `webapp-testing` — API request/response validation
- `code-review` — API authZ / schema review

#### Actions
1. Enumerate API endpoints
2. Test authentication/authorization
3. Test rate limiting
4. Test input validation
5. Test error handling
6. Document API vulnerabilities

#### Copy-Paste Prompts

```text
Use @webapp-testing to fuzz in-scope API endpoints within ROE rate limits
```

### Phase 5: Penetration Testing

**Citation:** [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final) §5 (exploitation) — only after ROE approval.

#### Skills to Invoke
- `code-review` — planning / impact notes
- `webapp-testing` — controlled proof reproduction

**Blocked without ROE + human approval:** Metasploit, active exploit packs, destructive payloads.

#### Actions
1. Plan penetration test against ROE
2. Execute **authorized** attack scenarios only
3. Reproduce vulnerabilities with minimal PoC (no weaponization beyond need)
4. Document proof of concept with secret/PII redaction
5. Assess impact

#### Copy-Paste Prompts

```text
Use @code-review to plan a penetration test against the written ROE
```

```text
Use @webapp-testing to execute only ROE-permitted validation steps (no Metasploit unless explicitly approved)
```

### Phase 6: Security Hardening

**Citation:** [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/); [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) (control families relevant to app hardening).

#### Skills to Invoke
- `code-review` — hardening recommendations
- `webapp-testing` — verify controls after changes

#### Actions
1. Implement security controls
2. Configure security headers
3. Set up authentication
4. Implement authorization
5. Configure logging
6. Apply patches

#### Copy-Paste Prompts

```text
Use @code-review to harden application security against ASVS/OWASP findings
```

### Phase 7: Reporting

**Citation:** [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final) §7 (reporting); [OWASP](https://owasp.org/) severity/remediation practices.

#### Skills to Invoke
- `code-review` — structured finding write-ups

#### Actions
1. Document findings
2. Assess risk levels
3. Provide remediation steps
4. Create executive summary
5. Generate technical report

## Security Testing Checklist

### OWASP Top 10
Source: https://owasp.org/www-project-top-ten/

- [ ] Injection (SQL, NoSQL, OS, LDAP)
- [ ] Broken Authentication
- [ ] Sensitive Data Exposure
- [ ] XML External Entities (XXE)
- [ ] Broken Access Control
- [ ] Security Misconfiguration
- [ ] Cross-Site Scripting (XSS)
- [ ] Insecure Deserialization
- [ ] Using Components with Known Vulnerabilities
- [ ] Insufficient Logging & Monitoring

### API Security
Source: https://owasp.org/www-project-api-security/

- [ ] Authentication mechanisms
- [ ] Authorization checks
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error handling
- [ ] Security headers

## Quality Gates

- [ ] All planned tests executed
- [ ] Vulnerabilities documented
- [ ] Proof of concepts captured
- [ ] Risk assessments completed
- [ ] Remediation steps provided
- [ ] Report generated
- [ ] **Evidence handling (blocking):** secrets/PII redacted from PoCs and reports
- [ ] **Evidence handling (blocking):** evidence stored in a defined access-controlled storage system with a designated owner
- [ ] **Evidence handling (blocking):** retention duration defined and enforced
- [ ] **Evidence handling (blocking):** secure deletion verified and evidence of deletion retained after retention expires

Sources: [NIST SP 800-115](https://csrc.nist.gov/publications/detail/sp/800-115/final) (handling sensitive findings); [OWASP](https://owasp.org/) reporting practices.

## Related Workflow Bundles

- `development` - Secure development practices
- `wordpress` - WordPress security
- `cloud-devops` - Cloud security
- `testing-qa` - Security testing
