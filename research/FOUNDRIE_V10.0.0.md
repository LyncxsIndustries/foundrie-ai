# FOUNDRIE AI — Research & Operating Specification
## Version 10.0.0

**Version**: 10.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v11.0.0
**Previous Version**: 9.0.0
**Base**: All v1.0.0 through v9.0.0 content remains in force. This version only documents what changes.
**Purpose**: Upgrade Figma integration from one-way import (v4.0.0) to bidirectional sync; specify the large file handling pipeline; define the 6-step file security pipeline for uploaded files; and introduce Foundrie's intelligent suggestion engine — the hidden requirements catalog, three-level Socratic model, and proactive architecture warning system.
**Source Research**: FOUNDRIE-RUWA-PATCH.md §§8.2, 8.3, 8.4, 10

---

## CHANGELOG — v10.0.0

### Breaking Changes
- **Figma integration (v4.0.0 §12)**: Upgraded from one-way import to **bidirectional sync**. Foundrie now writes design tokens back to Figma as Figma Variables. RUWA can capture screenshots and compare them pixel-by-pixel against Figma frames.

### New [NEW]
- Figma → Foundrie (import): unchanged from v4.0.0 but now sets up the bidirectional sync bridge.
- Foundrie → Figma (export): design token set written back to Figma as Figma Variables after Feature 01 (Design System).
- RUWA → Figma (screenshot verification): Playwright screenshot compared against Figma frame via Figma rendering API; fidelity report generated.
- Large file handling pipeline: client-side chunking, Rust Axum streaming ingestion, per-type content extraction, RUWA's chunked reading strategy.
- File security pipeline: 6-step pipeline (type validation, antivirus scan, metadata stripping, content inspection, sandbox execution enforcement, storage isolation).
- Malicious URL detection in uploaded documents and user messages.
- Hidden requirements catalog: 200+ entries across 6 categories (auth, database, payments, email/notifications, API, performance, security). Foundrie checks every project against this catalog before finalizing specs.
- Three-level Socratic model: Foundrie classifies incoming project descriptions as Level 1 (Vague), Level 2 (Partially Specified), or Level 3 (Over-Specified) and responds accordingly.
- Proactive architecture warnings: N+1 query risk, missing index, circular dependency, missing error handling — generated automatically during spec writing.
- Research-backed recommendations rule: Foundrie never suggests "best practice" without citing a specific source (case study, benchmark, or documented failure mode).
- Generation invariants 69–77 added.

### Changes to Existing Content
- **Figma Integration (v4.0.0 §12)**: Section superseded by bidirectional spec in Section 1 below.
- **Discovery Protocol (v6.0.0 §2, Phase 1)**: Level classification added — Foundrie classifies the opening project description before asking Phase 1 questions.

### Deprecated
- One-way Figma import (v4.0.0 §12) superseded. Bidirectional is the new default.

---

## TABLE OF CONTENTS (v10.0.0 additions only)

1. [Figma Bidirectional Integration](#1-figma-bidirectional-integration)
2. [Large File Handling Pipeline](#2-large-file-handling-pipeline)
3. [File Security Pipeline (6 Steps)](#3-file-security-pipeline)
4. [Malicious URL Detection](#4-malicious-url-detection)
5. [Intelligent Suggestions — Hidden Requirements Catalog](#5-hidden-requirements-catalog)
6. [The Three-Level Socratic Model](#6-the-three-level-socratic-model)
7. [Proactive Architecture Warnings](#7-proactive-architecture-warnings)
8. [Research-Backed Recommendation Rule](#8-research-backed-recommendation-rule)
9. [New Generation Invariants (69–77)](#9-new-generation-invariants)

---

## 1. FIGMA BIDIRECTIONAL INTEGRATION

### Direction 1: Figma → Foundrie (Import — unchanged from v4.0.0)
- Engineer connects Figma account via OAuth.
- Foundrie lists all Figma files the engineer has access to.
- Engineer selects frames/pages to import.
- Foundrie reads the Figma API for: fills (colors), text styles (typography), auto-layout (spacing), component names, prototyping connections (flow).
- Foundrie generates `research/visual-analysis.md`.

### Direction 2: Foundrie → Figma (Export — NEW)
After Foundrie generates the design token set from the import:
- Foundrie writes those tokens back to Figma as **Figma Variables** (Figma 2024+ feature).
- The design system stays in sync between Figma and the codebase.
- When the engineer changes a color in Figma → re-imports to Foundrie → Foundrie regenerates `context/ui-context.md` → RUWA updates the Tailwind config automatically.

```typescript
// Foundrie writes design tokens back to Figma
const figmaAPI = new FigmaAPI(accessToken);

await figmaAPI.updateVariables(fileId, {
  collections: [{
    name: "Brand Tokens",
    modes: [{ name: "Default" }],
    variables: tokenSet.colors.map(token => ({
      name: token.name,
      resolvedType: "COLOR",
      valuesByMode: { [modeId]: token.value }
    }))
  }]
});
```

### Direction 3: RUWA → Figma (Screenshot Verification — NEW)
After RUWA implements a UI feature:
- RUWA captures a screenshot via Playwright.
- RUWA sends the screenshot to Foundrie.
- Foundrie compares it against the corresponding Figma frame via Figma's rendering API.
- Foundrie generates a fidelity report:

```
UI FIDELITY REPORT — Feature 01: Design System
Figma Frame:     Header Component v2
Screenshot:      [attached]
Fidelity Score:  94%

Mismatches detected:
  1. Button border-radius: Figma=8px, Implementation=6px
  2. Font weight (subtitle): Figma=500, Implementation=400
  3. Icon size: Figma=20px, Implementation=24px

Recommendation: RUWA to apply 3 corrections before approval.
```

This report is surfaced to the human during feature approval. RUWA applies corrections automatically if approved.

---

## 2. LARGE FILE HANDLING PIPELINE

Foundrie accepts large files — 100K-line codebases, 200-page PDFs, entire Figma exports, APK references, meeting audio recordings.

### Client-Side Chunking (TypeScript)

```typescript
// File split into 5MB chunks before upload
// If connection drops mid-upload: resume from last completed chunk
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

async function uploadInChunks(file: File, sessionId: string) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await uploadChunk(chunk, { sessionId, chunkIndex: i, totalChunks });
  }
}

// Maximum file size: 500MB per file
// Maximum total per session: 2GB
```

### Rust Axum Streaming Ingestion

Files are never fully loaded into memory — streamed to Vercel Blob.

```rust
// Rust Axum streaming endpoint — no RAM buffering
async fn ingest_file_stream(
    mut multipart: Multipart,
) -> Result<Json<IngestResult>> {
    while let Some(field) = multipart.next_field().await? {
        let blob_client = get_blob_client();
        let mut writer = blob_client.put_stream(&blob_path).await?;
        while let Some(chunk) = field.chunk().await? {
            writer.write_all(&chunk).await?;  // stream through, never buffer whole file
        }
        writer.finish().await?;
    }
    Ok(Json(IngestResult { blob_url, file_size }))
}
```

### Per-File-Type Content Extraction

| Extension | Extraction Method | Output |
|---|---|---|
| `.pdf` | pdfium-render (Rust) | Text chunks for RAG |
| `.docx`, `.xlsx` | Apache POI via Python subprocess | Text extraction |
| `.zip` | Extract in-memory, inspect contents | Contents list (no execution) |
| `.png`, `.jpg`, `.webp` | Claude vision API | Visual analysis |
| `.apk`, `.ipa` | Static analysis: manifest + strings | No execution |
| `.mp3`, `.mp4` | Whisper transcription | Text for RAG |
| `.csv`, `.json`, `.yaml` | Direct text ingestion, Polars for structure | Structured data |
| `.ts`, `.rs`, `.py`, `.go` | Code-aware chunking (respect function/class boundaries) | Code chunks |
| Binary (other) | Raw text extraction attempt → reject if fails | Error log |

### RUWA's Large File Strategy

RUWA never loads an entire large file into context. It uses:
- ChromaDB semantic search to find relevant sections.
- Context7 for library-specific docs (no need to upload SDKs).
- Chunked reading with pagination for files > 100KB.

---

## 3. FILE SECURITY PIPELINE (6 STEPS)

Every uploaded file passes through all 6 steps before any content is extracted or used in a Foundrie session.

```
STEP 1: FILE TYPE VALIDATION
  Reject if: MIME type does not match extension
  Reject if: file magic bytes don't match declared type
  Reject if: extension in blocklist (.exe, .dll, .bat, .cmd, .sh with exec bit)

STEP 2: ANTIVIRUS SCAN (ClamAV via Docker sidecar)
  Every file scanned before content extraction.
  Positive hit → file deleted, user warned, event logged as AUDIT level.

STEP 3: METADATA STRIPPING
  PDFs: strip JavaScript, forms, embedded scripts (PyMuPDF)
  Images: strip EXIF metadata (location, device info)
  Office files: strip macros (python-docx, openpyxl)

STEP 4: CONTENT INSPECTION
  Extracted text scanned for:
    - Embedded prompt injection patterns
    - Exfiltration-attempt URLs (data: URIs, webhook URLs)
    - Malicious instruction patterns targeting the AI

STEP 5: SANDBOX EXECUTION ENFORCEMENT
  No file is ever executed by Foundrie or RUWA.
  .apk, .ipa, .exe: read for strings/manifest only.
  JavaScript in PDFs or Office files: never interpreted.

STEP 6: STORAGE ISOLATION
  All uploaded files stored in isolated Vercel Blob containers.
  Access requires session token + file-specific HMAC.
  Files are not publicly accessible by URL.
  Files deleted 30 days after session end (configurable in settings).
```

This pipeline runs in the Rust execution layer (v2.0.0) for steps 1–2 and 5–6, and in the Python layer for steps 3–4.

---

## 4. MALICIOUS URL DETECTION

Any URL found in uploaded documents or user messages is checked before Foundrie uses it.

```python
# URL safety checker — runs on all URLs in uploaded content
from urllib.parse import urlparse

PHISHING_PATTERNS = [
    r'https?://[a-z0-9-]+\.(ru|cn|tk|pw|cc)/redirect',
    r'data:text/html',
    r'javascript:',
    r'vbscript:',
]

async def check_url_safety(url: str) -> SafetyResult:
    # Check against Google Safe Browsing API
    safe_browsing = await google_safe_browsing.check(url)
    if safe_browsing.is_unsafe:
        return SafetyResult(safe=False, reason=safe_browsing.reason)
    # Check against internal blocklist
    for pattern in PHISHING_PATTERNS:
        if re.search(pattern, url):
            return SafetyResult(safe=False, reason="Known malicious pattern")
    return SafetyResult(safe=True)
```

---

## 5. HIDDEN REQUIREMENTS CATALOG

Foundrie checks every project against a catalog of commonly-missed requirements before finalizing feature specs. The full catalog has 200+ entries. Key excerpts:

### Authentication & Authorization
- ✓ User can log in — but: can they **reset their password**?
- ✓ Users have accounts — but: can they **delete their account**? (GDPR requirement)
- ✓ Users can access resources — but: does every query **scope to the user's own data**?
- ✓ Admin users exist — but: is there an **audit log of admin actions**?
- ✓ Auth works — but: what happens when a **session token is stolen**?

### Database
- ✓ Data is stored — but: what is the **data retention policy**?
- ✓ List endpoint exists — but: is it **paginated**? (What happens at 100K rows?)
- ✓ Writes happen — but: are concurrent writes safe? (**optimistic vs pessimistic locking**)
- ✓ Deletes happen — but: is it **soft delete or hard delete**?
- ✓ User data exists — but: what happens when the user **deletes their account**?

### Payments
- ✓ Payment is charged — but: what happens if the **Stripe webhook fails**?
- ✓ Subscription created — but: what happens when it **expires or fails to renew**?
- ✓ Price is set — but: what about **currency, tax handling, EU VAT**?
- ✓ Charge succeeds — but: what's the **refund flow**?

### Email / Notifications
- ✓ Email is sent — but: what if the **email bounces**?
- ✓ Notification triggered — but: can users **turn them off**? (CAN-SPAM, GDPR)
- ✓ Welcome email exists — but: is there an **unsubscribe link**?

### API
- ✓ Endpoint exists — but: is it **rate limited**?
- ✓ Request is processed — but: is there a **timeout**?
- ✓ Response sent — but: are error responses **consistent in structure**?
- ✓ API works — but: is there **versioning**? What happens when response shape changes?

### Performance
- ✓ App works for 10 users — but: what happens with **10,000 simultaneous users**?
- ✓ Query works — but: is there an **index on the WHERE clause columns**?
- ✓ Images are served — but: are they **WebP-optimized with CDN**?

### Security
- ✓ Form accepts input — but: is it **validated on the server** (not just client)?
- ✓ File upload works — but: is the file **scanned before being served**?
- ✓ API key is used — but: is it in an **env var or in the code**?

### How Foundrie Surfaces Hidden Requirements

```
Discovery turn example:

Engineer: "Users can post content to a feed."

Foundrie: "Before I spec this, I need answers to a few questions
           that will significantly change the architecture:

1. Can users see each other's posts, or only their own?
   (Determines whether we need privacy settings.)

2. Can users be blocked? Can accounts be reported for abuse?
   (Requires a moderation table and admin workflow — often forgotten.)

3. What's the expected scale? 100 posts/day or 100,000?
   (At 100: simple INSERT + SELECT.
    At 100,000: we need feed denormalization — fan-out-on-write
    vs fan-out-on-read is a database architecture decision.)

I'll hold off on the feed spec until we answer these."
```

---

## 6. THE THREE-LEVEL SOCRATIC MODEL

Foundrie classifies the opening project description before asking Phase 1 questions.

### Level 1 — Vague (Most Common at Session Start)

```
"I need an app where people can book appointments."

Foundrie's response: Socratic elicitation.
Never generates specs from a Level 1 description.
Asks targeted questions to surface actors, flows, constraints, scale.
```

### Level 2 — Partially Specified (After Initial Elicitation)

```
"I need a booking system where providers list their availability,
 users book slots, and payments go through Stripe."

Foundrie's response: Surface specific edge cases.
"When a booking is cancelled 24h+ in advance, does the provider keep the fee?"
"What happens if the Stripe webhook fails and the booking is confirmed but unpaid?"
"Can a provider block specific users?"
```

### Level 3 — Over-Specified (Technical Founders, Sometimes)

```
"I want a microservices architecture with Kubernetes, a separate auth service,
 a separate notification service, gRPC between all, a Redis cluster, and Kafka."

Foundrie's response: Push back with evidence. Propose the simpler path.
"This is appropriate for teams of 20+ and 100K+ users.
 You have 1 engineer and 100 expected users. Here's what this costs
 vs. a simpler architecture that achieves the same goals and scales when needed."

If engineer insists on the complex path:
  Foundrie documents the decision in an ADR and proceeds.
  Foundrie respects engineer's judgment — it just ensures informed choice.
```

---

## 7. PROACTIVE ARCHITECTURE WARNINGS

During Phase 7 (Feature Spec Generation), Foundrie continuously monitors for antipatterns and warns before specs are written:

```
⚠️ N+1 QUERY RISK DETECTED
   Feature 07 queries the projects list, then for each project queries
   the member count separately. This will create N+1 database calls.
   I'm adding a JOIN to the Implementation Notes to prevent this.

⚠️ MISSING INDEX DETECTED
   Feature 09 (Search) queries posts by content and created_at.
   The ERD doesn't show an index on these columns. I'm adding
   index creation to Feature 03 (Database Schema) spec.

⚠️ CIRCULAR DEPENDENCY RISK
   Feature 12 depends on Feature 11, but Feature 11's Out of Scope
   says "No notification sending." Feature 12 requires notifications.
   This must be resolved before I write these specs.
   Options: extend Feature 11's scope, or insert a new Feature 11b.

⚠️ MISSING ERROR HANDLING SPEC
   You have a Stripe integration (Feature 10) but no spec for failed
   payments. I'm recommending a Feature 10b: Payment Failure Handling.
   Without it, RUWA implements the happy path only — and payment
   failures are 3–5% of all payment attempts in production.
```

All warnings are shown to the human during Phase 7 before spec approval. The engineer can dismiss a warning (recorded in an ADR) or accept the recommendation.

---

## 8. RESEARCH-BACKED RECOMMENDATION RULE

Every suggestion Foundrie makes during discovery must be backed by at least one of:
1. A production case study (e.g., Discord's switch from Go to Rust for message persistence — their published blog post).
2. A benchmark (e.g., Axum 6.8M req/s vs FastAPI 24,800 req/s — TechEmpower Round 23).
3. A known failure mode (e.g., Facebook's early auth lack of ownership scoping — the 2018 data breach).
4. A widely documented best practice with a cited source (e.g., cursor pagination — Prisma and PostgreSQL docs).

**Foundrie never says "best practice" without a source.** The engineer can ask "why" and always receive a specific reference. This is the behavior documented in v5.0.0 §2's ADR rationale requirement — applied to every recommendation, not just final decisions.

---

## 9. NEW GENERATION INVARIANTS (69–77)

These are **additions** to invariants 1–68. All prior invariants remain in force.

69. Figma integration is always bidirectional for projects with a design system feature spec. After Feature 01 completes, design tokens are written back to Figma as Figma Variables.
70. RUWA captures a screenshot after every UI feature implementation. The screenshot is compared against the corresponding Figma frame. A fidelity report is generated before the human approves the feature.
71. All uploaded files pass through all 6 steps of the file security pipeline before any content is extracted. Files that fail any step are rejected, deleted, and the event is logged at AUDIT level.
72. Foundrie checks every project against the hidden requirements catalog before finalizing feature specs. At minimum one hidden requirement must be surfaced per major feature area (auth, data, payments, API, performance, security).
73. Foundrie classifies every opening project description as Level 1, 2, or 3 (Socratic model) before Phase 1 begins. Level 1 descriptions never advance to spec generation without completing elicitation first.
74. Every proactive architecture warning generated during Phase 7 is shown to the human before spec approval. Dismissed warnings are recorded in an ADR.
75. Foundrie never recommends a technology choice without citing a specific source: benchmark, case study, or documented failure mode. The source is included in the recommendation's wording.
76. Malicious URL detection runs on all URLs in uploaded files and user messages. Blocked URLs are logged at AUDIT level and never passed to the AI or used in specs.
77. N+1 query risks, missing indexes, circular spec dependencies, and missing error handling specs are detected automatically during Phase 7. RUWA is never handed specs with these antipatterns unaddressed.

---

*Foundrie AI v10.0.0 — Figma bidirectional sync, large file pipeline, 6-step file security, hidden requirements catalog, three-level Socratic model, proactive architecture warnings, and research-backed recommendation rule*
*See FOUNDRIE_V11_0_0.md for commercialization: scale architecture, MongoDB training data isolation, data breach response, pricing tiers (Free/Pro/Team/Enterprise), and Stripe subscription integration*
