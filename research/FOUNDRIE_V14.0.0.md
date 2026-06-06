# FOUNDRIE AI — Research & Operating Specification
## Version 14.0.0

**Version**: 14.0.0
**Release Date**: 2026-05-21
**Status**: Current
**Previous Version**: 13.0.0
**Base**: All v1.0.0 through v13.0.0 content remains in force. This version only documents what changes.
**Purpose**: Integrate the PassionBits creator platform model as a reference architecture for Lynxcs Industries' creator-economy positioning; formalize the Foundrie quality assurance gate with three-category checklists (documents, code, research outputs) that every deliverable must clear before reaching any client; specify the seven-section project handoff protocol (superseding and expanding the stub from v4.0.0 §9); and establish the internal project retrospective framework that feeds directly back into Foundrie and Ruwa's improvement cycle (v4.0.0 §2).
**Source Research**: FOUNDRIE-RUWA-PATCH v2 §§10, 11

---

## CHANGELOG — v14.0.0

### New [NEW]

#### PassionBits Creator Platform Model (Ruwa Reference Architecture)
- The PassionBits model formally documented as a reference architecture for creator-economy positioning: follower count removed as the primary quality signal; portfolio and execution capability used instead.
- Four structural problems of the traditional creator economy addressed: follower gatekeeping, ignored cold outreach, payment insecurity, and agency bottlenecks.
- Four core value propositions of the PassionBits model specified: zero follower requirements (skill-first access), direct marketplace for active brand projects, secured payments tied to milestone completion, direct creator-to-brand communication.
- Relevance to Lynxcs Industries' three-mode application: for creator clients (professionalizing their back-office), for brand clients (advising on skill-first procurement strategy), and for Foundrie's role in generating professional documentation.
- Creator Economy Document Stack: the six-document professional kit (Rate Card, Collaboration Proposal Template, Creator Agreement Template, NDA Template, Invoice Template, Portfolio Brief) that transforms a skilled creator into a professional business entity.
- Ruwa's role in creator-economy work: benchmarking market rates across creator niches, tracking platform policy changes, monitoring the competitive landscape, and positioning Portfolio Briefs against niche benchmarks.

#### Quality Assurance Gate (Formalized)
- Quality gate elevated from an implicit concept (v12.0.0 §9 harness layer reference) to an explicit, three-category checklist that every Foundrie deliverable must pass before client delivery.
- Category 1 — Document Quality Gate: seven checks (placeholder population, internal consistency, legal coherence, formatting, version accuracy, brand alignment, actionability).
- Category 2 — Code / Technical Output Quality Gate: six checks (logging implemented per v12.0.0, dependencies audited per v13.0.0, README complete, env vars documented, no hardcoded secrets, CI pipeline passing).
- Category 3 — Research / Intelligence Output Quality Gate (Ruwa): four checks (sources cited and accessible, data points dated, recommendations actionable not abstract, conflicting information acknowledged).
- Quality gate failure protocol: a deliverable that fails any gate check is returned to the generation phase with specific failure reasons — it is never delivered to a client with known quality failures unresolved.
- Foundrie generates a quality gate checklist report as part of every ZIP's `docs/` directory: `docs/QUALITY-GATE.md`.

#### Project Handoff Protocol (Seven Sections — Full Specification)
- The client handoff package specification from v4.0.0 §9 (which listed required items as a checklist) is superseded by a fully specified seven-section handoff packet with content requirements per section.
- Section 1: Project Summary — one-page overview of what was built or created, for whom, and what problem it solves.
- Section 2: Deliverables Index — complete, numbered list of all files and assets delivered, each with a one-sentence description.
- Section 3: Access & Credentials Transfer — all logins, API keys, service accounts, and access details in a structured format, with instructions for secure transfer.
- Section 4: License Confirmation — what rights the client has to the delivered content, for how long, under what conditions, and what they may not do.
- Section 5: Known Limitations — any constraints, edge cases, or things to monitor that are not bugs but require awareness.
- Section 6: Maintenance Notes — what requires periodic attention (dependency audits per v13.0.0, log reviews per v12.0.0, certificate renewals, content updates).
- Section 7: Future Recommendations — what Lynxcs would do next if the engagement continued; presented as numbered recommendations with rationale.
- Foundrie generates the complete seven-section handoff packet as `docs/HANDOFF.md` in the project's final deliverables folder (not in the ZIP — this is a post-project output, not a planning output).
- Handoff delivery method: the engineer reviews the generated `docs/HANDOFF.md`, personalizes any auto-generated content, then delivers it alongside the final deliverables. A Loom walkthrough video (10–15 minutes) is recommended but not enforced as a generation invariant.

#### Internal Project Retrospective Framework
- Retrospective formally defined as a required post-project activity for every completed Lynxcs Industries engagement, regardless of project size.
- Five retrospective questions specified — each maps to a specific Foundrie or Ruwa improvement category.
- Retrospective output storage: the retrospective summary is stored in Ruwa's knowledge base (Mem0 — v12.0.0 §4) and tagged with the project category, client type, and the Foundrie version used. This allows pattern detection across projects.
- Retrospective → Improvement Pipeline: retrospective findings flow into three destinations: (1) updated Foundrie prompt rules (for generation quality gaps), (2) updated Ruwa research protocols (for intelligence gaps), (3) updated client lifecycle checklists (for process gaps).
- Retrospective timing: must be completed within 7 days of project close. Retrospectives older than 7 days have reduced signal value because context decays.
- Generation invariants 103–108 added.

### Changes to Existing Content
- **Client Handoff Package (v4.0.0 §9)**: Superseded by the seven-section specification in Section 4 of this version. The v4.0.0 checklist format is deprecated in favor of the structured seven-section document format.
- **Data Flywheel MAPE Loop (v4.0.0 §2)**: The ANALYZE phase now explicitly includes retrospective findings as a signal source, alongside the implicit signals hierarchy (v4.0.0 §3). Retrospective findings are tagged TIER-0 signals — the highest reliability, because they come from a structured human reflection process rather than behavioral inference.
- **Mem0 Integration (v12.0.0 §5)**: Ruwa's knowledge base now explicitly stores retrospective summaries as Semantic memories (not Episodic) — they represent general truths about project patterns, not specific past events.

### Deprecated
- **v4.0.0 §9 Client Handoff Package (checklist format)**: Superseded by the seven-section specification in Section 4 of this document. The checklist of required items remains valid as a pre-delivery verification tool; the narrative seven-section format is now the required delivery format.

---

## TABLE OF CONTENTS (v14.0.0 additions only)

1. [PassionBits Creator Platform Model](#1-passionbits-model)
2. [The Creator Economy Problem PassionBits Solves](#2-creator-economy-problem)
3. [Relevance to Lynxcs Industries](#3-relevance-to-lynxcs)
4. [The Creator Economy Document Stack](#4-creator-document-stack)
5. [Ruwa's Role in Creator-Economy Work](#5-ruwas-creator-role)
6. [Quality Assurance Gate — Three Categories](#6-quality-assurance-gate)
7. [Category 1: Document Quality Gate](#7-document-quality-gate)
8. [Category 2: Code / Technical Output Quality Gate](#8-code-quality-gate)
9. [Category 3: Research / Intelligence Output Quality Gate](#9-research-quality-gate)
10. [Quality Gate Failure Protocol](#10-quality-gate-failure)
11. [Project Handoff Protocol — Seven Sections](#11-handoff-protocol)
12. [Internal Project Retrospective Framework](#12-retrospective-framework)
13. [Retrospective → Improvement Pipeline](#13-retrospective-pipeline)
14. [New Generation Invariants (103–108)](#14-new-generation-invariants)

---

## 1. PASSIONBITS CREATOR PLATFORM MODEL

PassionBits is a creator-economy platform that inverts the dominant gatekeeping mechanism of the influencer marketing industry. In the traditional model, follower count is used as the primary proxy for creator quality. PassionBits replaces follower count with portfolio and execution capability as the primary qualifier.

This model is documented here not because Foundrie integrates with PassionBits as a platform, but because it represents a reference architecture for how Lynxcs Industries should position itself and its creator-economy clients in the broader market.

---

## 2. THE CREATOR ECONOMY PROBLEM PASSIONBITS SOLVES

The traditional creator economy has four structural dysfunctions:

```
DYSFUNCTION 1: FOLLOWER GATEKEEPING
  New creators with genuine skill cannot access paid brand work.
  Brands use follower count as a quality proxy because it is easy
  to measure — not because it is accurate.
  Result: Skilled creators are locked out. Brands miss cost-effective talent.

DYSFUNCTION 2: IGNORED COLD OUTREACH
  Creators send cold pitches to brands. Most are ignored.
  No structured marketplace exists for active brand projects.
  Result: Creator time is wasted. Brands miss inbound talent discovery.

DYSFUNCTION 3: PAYMENT INSECURITY
  Creators deliver work. Brands pay (or don't) at their discretion.
  No escrow. No milestone-gating. No enforcement mechanism.
  "Ghosting" after delivery is endemic.
  Result: Creators absorb financial risk. Trust is permanently low.

DYSFUNCTION 4: AGENCY BOTTLENECKS
  Influencer marketing agencies intermediate between brands and creators.
  They take 20–40% margins and slow the communication chain.
  Result: Both sides pay more and move slower for no quality improvement.
```

### PassionBits' Four Corrective Value Propositions

| Problem | Solution |
|---------|----------|
| Follower gatekeeping | Zero follower requirements — skill-first access |
| Ignored cold outreach | Direct marketplace for active brand projects |
| Payment insecurity | Secured payments tied to milestone completion |
| Agency bottlenecks | Direct creator-to-brand communication channel |

---

## 3. RELEVANCE TO LYNXCS INDUSTRIES

The PassionBits model informs Lynxcs Industries' work in three modes:

### Mode 1: For Creator Clients

When Lynxcs Industries works with creator clients, the goal is to professionalize their back-office so they can participate in skill-first marketplaces credibly.

A skilled creator who cannot present a professional rate card, a clear Creator Agreement, and a structured invoice is not competitive in a skill-first marketplace — regardless of their content quality. Foundrie generates exactly this professional kit.

**Foundrie's value to a creator client**: transform a talented individual into a professional business entity that can be taken seriously by brands operating through skill-first platforms.

### Mode 2: For Brand Clients

When Lynxcs Industries works with brand clients who are procuring creator content, Lynxcs can advise on skill-first creator evaluation rather than follower-count gatekeeping.

Ruwa benchmarks creator market rates across niches and provides evidence-based guidance on what a skilled creator without a large following should cost versus what a follower-count-inflated creator costs — enabling the brand to make better procurement decisions.

**Ruwa's value to a brand client**: evidence-based creator procurement strategy that delivers better ROI than follower-count proxies.

### Mode 3: For Foundrie's Document Generation Scope

The existence of skill-first platforms expands the types of documents Foundrie generates for creator clients. Foundrie is not just generating client-facing documents; it is generating the professional identity infrastructure that allows a creator to operate as a business.

This professional identity infrastructure is the Creator Economy Document Stack (Section 4).

---

## 4. THE CREATOR ECONOMY DOCUMENT STACK

For any creator client, Lynxcs Industries (via Foundrie) generates a complete "professional kit" — six documents that constitute a creator's professional identity infrastructure:

```
DOCUMENT 1: RATE CARD
  What they charge and for what.
  Positions them clearly to prospective brands.
  (v13.0.0 §12.1 — generation rules apply)

DOCUMENT 2: COLLABORATION PROPOSAL TEMPLATE
  How they pitch brands for specific campaigns.
  Customizable per brand; professional structure pre-built.
  (v13.0.0 §12.2 — generation rules apply)

DOCUMENT 3: CREATOR AGREEMENT TEMPLATE
  How they protect their work and ownership.
  Pre-built with ownership retention, revision billing, exclusivity terms.
  (v13.0.0 §12.4 — generation rules apply)

DOCUMENT 4: NDA TEMPLATE
  How they handle sensitive brand information.
  Pre-built for fast execution before discovery conversations.
  (v13.0.0 §12.5 — generation rules apply)

DOCUMENT 5: INVOICE TEMPLATE
  How they bill professionally with sequential numbering and TDS compliance.
  (v13.0.0 §12.3 — generation rules apply)

DOCUMENT 6: PORTFOLIO BRIEF
  A structured summary of their best work, positioned against niche benchmarks.
  Generated with Ruwa's market research to support each case study
  with relevant audience context, campaign outcomes, and competitive
  positioning data.
```

**What this kit achieves**: A skilled creator with this document stack can approach any brand through any channel — cold outreach, skill-first platform application, or referral — and present a professional, credible, legally protected business identity.

This kit is what platforms like PassionBits, and the brands that use them, are looking for. The portfolio demonstrates skill. The document stack demonstrates professionalism. Together, they eliminate follower count as the gating criterion.

**Foundrie generates the full kit in one session.** The creator provides the context (niche, channels, content types, rates, past work). Ruwa provides the market benchmarks. Foundrie generates all six documents with specific, accurate, non-generic content.

---

## 5. RUWA'S ROLE IN CREATOR-ECONOMY WORK

Ruwa provides four categories of intelligence that elevate Foundrie's creator document generation from template-filling to genuinely informed output:

### Market Rate Benchmarking
- What are comparable creators in the same niche charging for equivalent deliverables?
- What is the industry-standard rate for the specific content type (long-form video, UGC, short-form, written, voice-over)?
- What licensing premium is standard for paid amplification in this category?
- Source: platforms like PassionBits public rate ranges, influencer marketing industry reports, brand survey data.

### Platform Policy Monitoring
- Is the creator's primary platform changing its monetization policies?
- Are new content formats emerging that should be added to the rate card?
- Are existing formats declining in brand demand (affecting rate justification)?
- Alert timeline: Ruwa surfaces platform policy changes within 48 hours of announcement.

### Portfolio Brief Positioning
- For each piece of the creator's portfolio: what is the relevant audience size benchmark for this niche?
- What outcomes are comparable creators reporting for this content type?
- What is the creator's relative position in their niche (top 10%, top 25%)?
- This context elevates a portfolio brief from "here is what I made" to "here is why this work is high value in its market."

### Competitive Landscape
- Who else is actively seeking similar work in this niche?
- What differentiates this creator from alternatives at the same price point?
- What market trends support the creator's niche positioning?

Ruwa's output for creator-economy work is the "Creator Intelligence Brief" — delivered before Foundrie generates any document in the professional kit.

---

## 6. QUALITY ASSURANCE GATE — THREE CATEGORIES

Every deliverable from Lynxcs Industries must pass through a quality gate before it reaches any client, internal reviewer, or external stakeholder.

The quality gate is implemented at two levels:
1. **Foundrie's harness layer** (v12.0.0 §6): the quality gate checklist is a programmatic check run before ZIP delivery.
2. **RUWA's pre-delivery review**: before RUWA reports a feature as complete, it verifies the quality gate checklist for any output it generated.

The gate has three categories because different output types have different failure modes.

---

## 7. CATEGORY 1: DOCUMENT QUALITY GATE

Applied to: Rate Cards, Proposals, Invoices, Creator Agreements, NDAs, Scope Amendments, Handoff Packets, Onboarding Kits, and any Foundrie-generated document.

```
[ ] All placeholder fields populated — no [CLIENT NAME], [AMOUNT], [DATE] remaining
[ ] No conflicting information between sections
    (e.g., amount stated in body ≠ amount in payment details)
[ ] Legal clauses reviewed for jurisdiction consistency
    (all clauses reference the same jurisdiction)
[ ] Formatting is consistent throughout
    (fonts, date formats, currency formats, list punctuation)
[ ] Version number and date are accurate and in the header
[ ] Brand alignment: tone and positioning match Lynxcs Industries' standards
[ ] Actionability: the recipient can act on this document immediately
    without needing to ask for clarification
```

**Failure condition**: Any unchecked item means the document is returned to generation phase. Client does not receive it.

---

## 8. CATEGORY 2: CODE / TECHNICAL OUTPUT QUALITY GATE

Applied to: all code generated by RUWA, all technical scaffolding generated by Foundrie.

```
[ ] Structured logging implemented — no console.log in production paths
    (v12.0.0 invariant 87)
[ ] Dependency audit passes — no critical or high-severity CVEs
    (v13.0.0 invariant 100)
[ ] README is complete with: setup instructions, env var documentation,
    run commands, and known limitations
[ ] Environment variables documented in .env.example with source locations
    (v1.0.0 invariant 2)
[ ] No hardcoded secrets or credentials in any file
    (v3.0.0 invariant 18 — Gitleaks scan must pass)
[ ] CI pipeline passes: lint, type-check, build, test, security scan
    (v3.0.0 invariant 22)
```

**Failure condition**: RUWA does not report a feature as complete until all six items pass. A feature branch that passes implementation but fails the quality gate is not complete.

---

## 9. CATEGORY 3: RESEARCH / INTELLIGENCE OUTPUT QUALITY GATE

Applied to: all Ruwa-generated intelligence briefs, market research, industry reports, portfolio positioning documents, and security alerts.

```
[ ] Sources cited and accessible — every factual claim links to a verifiable source
    that can be accessed by the reader
[ ] Data points are dated — no undated statistics
    ("X% of creators use Instagram" without a year is not usable)
[ ] Recommendations are actionable — not "consider improving your rate card"
    but "update your UGC rate to KES 45,000 based on PassionBits Q2 2026
    benchmarks for lifestyle creators with 50K–100K reach"
[ ] Conflicting information from different sources is acknowledged
    — Ruwa never picks one source and ignores a contradictory source without
    flagging the contradiction to the human
```

**Failure condition**: A research output that fails any gate check is revised before it is used as input to Foundrie document generation. Foundrie never generates a document from research that has not passed Category 3.

---

## 10. QUALITY GATE FAILURE PROTOCOL

When any deliverable fails its quality gate:

```
QUALITY GATE FAILURE PROTOCOL:

1. IDENTIFY: Which specific checklist item(s) failed?
   (The failure must be specific, not "needs more work")

2. CLASSIFY: Is this a generation failure or a data failure?
   Generation failure = Foundrie generated incorrect structure or content
   Data failure = the input data (research, client context) was insufficient

3. ROUTE: Return to the correct upstream step
   Generation failure → Foundrie re-generates with corrected instructions
   Data failure → Ruwa provides additional research → Foundrie re-generates

4. RE-CHECK: The regenerated output passes through the full quality gate again.
   There is no partial-pass shortcut.

5. LOG: Quality gate failures are logged in the project's CHANGE_LOG.md
   under "Quality Gate Events" with: date, output type, failure reason,
   resolution action, and resolved-by timestamp.

Quality gate failures are not failures of the engineer — they are
expected and beneficial. A quality gate that never fires is a gate
that is not being applied honestly.
```

**Generated `docs/QUALITY-GATE.md` in every ZIP:**

```markdown
# Quality Assurance Gate

## Purpose
Every deliverable from this project must pass this gate before
reaching the client. The gate has three categories depending on
the output type.

## Category 1: Document Gate
[Full checklist as per Section 7]

## Category 2: Code / Technical Gate
[Full checklist as per Section 8]

## Category 3: Research / Intelligence Gate
[Full checklist as per Section 9]

## Failure Protocol
[Summary of failure routing as per Section 10]

## Quality Gate Log
| Date | Output | Failed Item | Resolution | Resolved |
|------|--------|-------------|------------|---------|
| — | — | — | — | — |
```

---

## 11. PROJECT HANDOFF PROTOCOL — SEVEN SECTIONS

This supersedes the checklist format from v4.0.0 §9 with a fully specified narrative structure.

Foundrie generates `docs/HANDOFF.md` as a post-project output (not included in the planning ZIP — generated at project close). The engineer personalizes any auto-generated content, then delivers it alongside the final deliverables package.

### Section 1: Project Summary

**Format**: One page maximum. Plain language. No technical jargon unless the client is technical.

**Required content:**
- What was built or created (in one sentence, the deliverable)
- For whom (the client name and their primary use case)
- What problem it solves (from the client's perspective, not the engineer's)
- Current status (live, staged, delivered as assets, etc.)
- The single most important thing the client needs to know to use what was delivered

**Foundrie generation note**: the Project Summary draws from the Collaboration Proposal's Campaign Objective section (v13.0.0 §12.2) but is rewritten in past tense and completion framing. It is never a copy-paste.

### Section 2: Deliverables Index

**Format**: Numbered list. One entry per file, asset, or deliverable. No grouping.

```
DELIVERABLES INDEX

1. [Filename or asset name]
   Type: [Document / Code / Video / Design file / etc.]
   Location: [Where it is stored or how to access it]
   Description: [One sentence — what it is and when to use it]

2. [Next item]
   ...
```

The index is the single source of truth for what was delivered. If an asset is not in the index, it was not delivered. If it was delivered, it is in the index.

### Section 3: Access & Credentials Transfer

**Format**: Structured table. One row per service or access point.

```
ACCESS & CREDENTIALS TRANSFER

| Service | Access Type | Credential | Transferred Via | Date Transferred |
|---------|-------------|------------|-----------------|-----------------|
| [Name]  | [Login/API key/Admin access] | [Where to find it] | [Method] | [Date] |

Security note: API keys and passwords are transferred via [1Password / Bitwarden
/ encrypted email — specify the method]. They are NOT included in this document
in plain text.

Post-transfer action required:
[ ] Client confirms they have accessed and verified each credential
[ ] Lynxcs access is revoked after client confirms (for shared accounts)
```

### Section 4: License Confirmation

**Format**: Plain-language summary of the Creator Agreement's licensing section, adapted to the specific deliverables.

```
LICENSE CONFIRMATION

WHAT THE CLIENT HAS:
  A [exclusive / non-exclusive] license to use the delivered content
  for [specific permitted uses] on [specific platforms or channels]
  for [duration or "in perpetuity"].

WHAT THE CLIENT DOES NOT HAVE:
  - Ownership of the underlying creative work
  - The right to modify and re-sell the content without a new agreement
  - The right to use the content for purposes not listed above
  - [Any other specific restrictions from the Creator Agreement]

LICENSING ADD-ONS IN EFFECT (if any):
  [Paid amplification: licensed for 30 days from delivery]
  [Organic repost: licensed for 3 months from delivery]

QUESTIONS ABOUT LICENSING:
  Contact Lynxcs Industries at [contact] before using the content
  in any way not explicitly listed above.

Reference: Creator Agreement dated [date], Section 3.
```

### Section 5: Known Limitations

**Format**: Bulleted list. Factual. No hedging language. Not an apology — a briefing.

```
KNOWN LIMITATIONS

• [Specific limitation] — [Impact] — [Workaround if any]

Example format:
• The pricing page does not yet support currency switching. All prices
  display in KES only. To add multi-currency support, a new feature
  spec is needed (estimated 2 days with RUWA).

• The mobile navigation has not been tested on Android devices below
  Android 12. Behavior on older Android versions is unknown.

• The Stripe integration is in test mode. To go live: [specific steps].
```

Known limitations are not bugs. They are constraints the client needs to be aware of. Engineers who omit this section leave clients surprised and disappointed when they encounter these constraints in production. A known limitation disclosed at handoff is a professional acknowledgment. The same limitation discovered by the client after handoff is a trust-damaging failure.

### Section 6: Maintenance Notes

**Format**: Categorized action items with timing.

```
MAINTENANCE NOTES

IMMEDIATE (within 30 days of going live):
  [ ] Run first monthly dependency audit (v13.0.0 §3 protocol)
  [ ] Verify error logging is receiving events (v12.0.0 §1)
  [ ] Confirm Stripe webhooks are reaching the production endpoint

MONTHLY:
  [ ] Dependency audit (npm audit / pip-audit)
  [ ] Review error logs for any unaddressed patterns
  [ ] Check Dependabot PRs and merge safe updates

QUARTERLY:
  [ ] Review and update all API keys (rotate for security)
  [ ] Review Clerk plan limits vs current usage
  [ ] Review Neon Postgres storage and tier appropriateness

ANNUALLY:
  [ ] SSL certificate renewal check
  [ ] Full security audit (OWASP checklist)
  [ ] Rate card review and pricing update
```

### Section 7: Future Recommendations

**Format**: Numbered list. Each recommendation includes: what to do, why it matters, and estimated effort.

```
FUTURE RECOMMENDATIONS

These are the next highest-value actions Lynxcs Industries recommends
if the engagement continues. They are listed in priority order.

1. [Recommendation]
   Why: [Business rationale — what problem this solves or opportunity it captures]
   Effort: [Estimated days with RUWA / estimated cost range]
   Urgency: [High / Medium / Low]

2. [Next recommendation]
   ...
```

**Foundrie generation note**: Future Recommendations draw from two sources: (1) features that were explicitly out of scope in the planning session (documented in feature spec "Out of Scope" sections), and (2) opportunities Ruwa identified during active delivery research that were not part of the original scope. Both sources are referenced.

This section transforms the handoff from a relationship-closing document into a relationship-continuing invitation. It demonstrates that Lynxcs Industries was thinking about the client's future, not just the current invoice.

---

## 12. INTERNAL PROJECT RETROSPECTIVE FRAMEWORK

### Purpose and Timing

The internal retrospective is a required post-project activity for every completed Lynxcs Industries engagement. It must be completed within 7 days of project close.

**Why 7 days**: Context decays quickly. A retrospective conducted 30 days after project completion has 50% less useful information than one conducted within a week — team members have moved on, specific decisions are harder to recall, and the signal quality drops.

**Format**: a structured 30-minute session (for small projects) or 60-minute session (for projects > 3 weeks). Output: a written summary (2–3 paragraphs or structured bullet list) stored in Ruwa's knowledge base.

### Five Retrospective Questions

Each question maps to a specific improvement category:

```
QUESTION 1: What did Foundrie generate well? What needed heavy manual correction?
→ MAPS TO: Foundrie prompt and generation rule improvements
→ SIGNALS: Which generation rules need tightening, which spec templates need more detail

QUESTION 2: What research did Ruwa surface that was most valuable?
           What did Ruwa miss that would have been helpful?
→ MAPS TO: Ruwa research protocol improvements
→ SIGNALS: Which research categories to expand, which to improve depth on

QUESTION 3: Where did the client lifecycle have friction?
           (Discovery, Onboarding, Active Delivery, Retainment, or Offboarding)
→ MAPS TO: Client lifecycle checklist improvements (v13.0.0 §§7–11)
→ SIGNALS: Which checklist items prevented friction vs which were insufficient

QUESTION 4: What would we do differently with the logging or security setup?
→ MAPS TO: Technical scaffolding quality improvements (v12.0.0, v13.0.0)
→ SIGNALS: Were the generated security and logging scaffolds right for this project type?

QUESTION 5: What templates or protocols should be updated based on this project?
→ MAPS TO: All of the above — distilled into specific actionable changes
→ SIGNALS: The specific document, checklist, or protocol to update
```

### Retrospective Summary Format

```markdown
# Project Retrospective — [Project Name]

**Date**: [within 7 days of project close]
**Project duration**: [start date → end date]
**Foundrie version used**: [e.g., v14.0.0]
**Project type**: [creator-economy / web app / agentic / etc.]
**Client type**: [new / returning / referral]

## What Worked Well
[2–3 specific things that Foundrie, Ruwa, or the process did well]

## What Needed Improvement
[2–3 specific things that caused friction, required manual correction,
or missed the mark — with root cause analysis]

## Client Lifecycle Friction Points
[Where in the five phases did friction occur, if any]

## Specific Improvement Actions
[Numbered list of specific changes to make to Foundrie rules,
Ruwa protocols, or lifecycle checklists — with the target document
for each change]

## TIER-0 Signals (for Foundrie Data Flywheel)
[Label this session: POSITIVE / NEGATIVE / MIXED based on overall outcomes]
[Specific signal: "Foundrie generated X well on first attempt" or
 "RUWA had Y spec discrepancy — root cause was Z"]
```

---

## 13. RETROSPECTIVE → IMPROVEMENT PIPELINE

Retrospective findings flow into three destinations. This is the human-in-the-loop component of Foundrie's MAPE control loop (v4.0.0 §2).

### Destination 1: Foundrie Prompt and Generation Rule Updates

When Question 1 reveals that Foundrie consistently generates weak output in a specific area (e.g., "Foundrie's Rate Card licensing section always needs manual rewriting"), the fix is:
1. Identify the specific invariant or generation rule that governs that section.
2. Update the invariant in the Foundrie specification (the relevant version's generation invariant section).
3. Verify the update in the next project's generation output.

This is how Foundrie gets better at specific generation tasks without a full model fine-tune. The rules improve even before RLVR training catches up.

### Destination 2: Ruwa Research Protocol Updates

When Question 2 reveals that Ruwa missed a category of research that would have been valuable (e.g., "Ruwa didn't benchmark pricing for the client's niche before the Rate Card was generated"), the fix is:
1. Add the missed research category to the relevant phase's Ruwa research checklist (v13.0.0 §§7–11).
2. Add the research category to Ruwa's Firecrawl monitoring configuration (v12.0.0 §8) if it is an ongoing surveillance need.
3. Add a reminder to the Discovery Brief template that this category is required.

### Destination 3: Client Lifecycle Checklist Updates

When Question 3 reveals friction at a specific lifecycle phase, the fix is:
1. Identify the specific checklist item that was missing or insufficient.
2. Update the relevant phase checklist (v13.0.0 §§7–11).
3. Add a generation rule to ensure Foundrie's generated documents for that phase address the gap.

### Storage in Ruwa's Knowledge Base

```python
# Retrospective summaries stored as Semantic memories in Ruwa's Mem0 instance
# Semantic because they represent general truths about project patterns
# that are relevant to future projects of the same type

from mem0 import Memory
m = Memory()

# Tag with project metadata for pattern detection
m.add(
    f"Project retrospective [{project_type}][{client_type}][v{foundrie_version}]: "
    f"{retrospective_summary}",
    user_id="lynxcs-internal"
)

# Pattern query for future similar projects:
# m.search("creator economy Rate Card generation issues", user_id="lynxcs-internal")
# Returns: all past retrospective findings tagged with creator-economy + Rate Card
```

When Foundrie starts a new session for a similar project type, Ruwa retrieves relevant retrospective memories and surfaces them during the discovery phase: "Based on past creator-economy projects, Foundrie should pay particular attention to [specific gap identified in retrospective]."

This is the mechanism by which Lynxcs Industries gets smarter with every project — not just through model training, but through structured, human-reviewed, institutionalized learning.

---

## 14. NEW GENERATION INVARIANTS (103–108)

These are **additions** to invariants 1–102. All prior invariants remain in force.

103. For every creator-economy client, Foundrie generates the full six-document Creator Economy Document Stack (Rate Card, Collaboration Proposal Template, Creator Agreement Template, NDA Template, Invoice Template, Portfolio Brief) in a single session. Generating individual documents without the full stack is not the default — the full kit is the default.

104. The Portfolio Brief in the Creator Economy Document Stack always includes Ruwa-researched market benchmarks for the creator's niche. A Portfolio Brief generated without market context is a Category 3 quality gate failure.

105. Every Foundrie deliverable passes through the three-category quality gate before delivery: Category 1 (documents), Category 2 (code/technical), Category 3 (research/intelligence). No deliverable is marked complete without gate verification. Quality gate failures are logged in `docs/QUALITY-GATE.md`.

106. Foundrie generates `docs/QUALITY-GATE.md` in every ZIP. RUWA checks this file before reporting any feature as complete. The quality gate log section is updated on every gate event (pass or fail) with date, output type, and outcome.

107. The project handoff document (`docs/HANDOFF.md`) is always a seven-section document following the structure in Section 11. The v4.0.0 checklist format is deprecated for the handoff deliverable (the checklist remains valid as a pre-delivery internal verification tool only).

108. An internal project retrospective must be completed within 7 days of every project close. The retrospective summary is stored in Ruwa's Mem0 knowledge base as a Semantic memory tagged with project type, client type, and Foundrie version. Retrospective findings are labeled as TIER-0 signals in Foundrie's data flywheel (v4.0.0 §3) — the highest signal reliability tier.

---

## FOUNDRIE FULL VERSION SUMMARY

The following table documents all versions and their primary contribution. This is a reading guide for anyone entering the specification mid-stream.

| Version | Primary Contribution |
|---------|---------------------|
| v1.0.0 | Two-tool contract, Socratic discovery (5 phases), AGENTS.md spec, feature spec quality, ZIP structure |
| v2.0.0 | Multi-language architecture (Rust/Python/TypeScript/Go), GSAP mandate, language decision matrix |
| v3.0.0 | Seven-layer security model, CI/CD 22-step pipeline, behavioral regression tests, structured logging scaffolding |
| v4.0.0 | Data flywheel, MAPE loop, onboarding UX, MVP timeline, Tauri desktop, AI-era automation tooling |
| v5.0.0 | Monorepo structure, ADRs, mobile/blockchain/real-time project types, blue-green deployment, RLUF, DSPy |
| v6.0.0 | Diagram-first architecture, 8-phase discovery, full 12-diagram suite, diagram versioning, updated ZIP |
| v7.0.0 | GitHub App integration, access matrix, reference repos, existing-project onboarding, six team topologies |
| v8.0.0 | Multi-user canvas, AI input queue state machine, session roles, autosave, rollback, idempotency |
| v9.0.0 | Repo health monitor, file ownership in DAG, scope change protocol, project management documents |
| v10.0.0 | Figma bidirectional sync, large file pipeline, 6-step file security, hidden requirements catalog, Socratic model |
| v11.0.0 | Scale architecture (1M+ users), MongoDB training data, data breach response, pricing tiers, Stripe integration |
| v12.0.0 | Production logging discipline, context/memory/harness engineering, Mem0/FastMCP/Firecrawl agent stack |
| v13.0.0 | Dependency security scaffolding, five-phase client lifecycle, Foundrie-generated legal documents |
| v14.0.0 | PassionBits model, three-category quality gate, seven-section handoff protocol, retrospective framework |

---

*Foundrie AI v14.0.0 — PassionBits creator platform model, three-category quality assurance gate, seven-section project handoff protocol, and internal retrospective framework with improvement pipeline*
*All research from AGENTIC-SECURITY.md, FOUNDRIE-RUWA-PATCH.md, FOUNDRIE-RUWA-PATCH v2.md, and MULTI-LANGUAGE-ARCHITECTURE-PROGRAMMING.md is now fully implemented across v1.0.0–v14.0.0*
