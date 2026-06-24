import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/prompts/system";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Plan } from "@/lib/ai/tier";
import { slugify } from "@/lib/projects/slug";

export type ScopeChangeType = "ADDITION" | "REMOVAL" | "REDESIGN";

export interface ImpactAnalysisReport {
  changeType: ScopeChangeType;
  affectedCompletedFeatures: string[];
  affectedInProgressFeatures: string[];
  affectedPendingFeatures: string[];
  newFeaturesNeeded: { title: string; description: string }[];
  diagramsNeedingUpdates: string[];
  timelineDeltaDays: number;
  costDeltaUsd: number;
  impactSummary: string;
}

const MANDATORY_SPEC_GATES = `- **CRITICAL CONTRACT SYNCHRONIZATION GATE**: When this implementation changes or corrects any project contract - database schema fields/relations, route signatures, authorization helper signatures, AI task names or \`callAI\`/\`callAIStream\` request/response shapes, status enums, storage paths, ZIP structure, generated file contents, package versions, environment variables, or ownership/file boundaries - update this feature spec, every later feature spec that depends on the contract, all relevant context files, root \`AGENTS.md\`, and \`project-kit/context/progress-tracker.md\` before tests/build/review.
- **CRITICAL**: Any file or directory that should not be committed to GitHub (for example \`.agents\`, \`.github\`, API keys, or local logs) MUST be explicitly added to \`.gitignore\` within the feature spec that introduces it.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (for example structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, and the \`security:all\` gate) is also baked into generated projects.`;

export async function computeImpactAnalysis(
  projectId: string,
  changeDescription: string,
  plan: Plan
): Promise<ImpactAnalysisReport> {
  const [project, featureSpecs, diagrams, contextFiles] = await Promise.all([
    db.project.findUnique({ where: { id: projectId } }),
    db.featureSpec.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    }),
    db.diagram.findMany({ where: { projectId } }),
    db.contextFile.findMany({ where: { projectId } }),
  ]);

  if (!project) throw new Error("Project not found");

  const systemPrompt = buildSystemPrompt({
    instructions: `You are an expert software architect analyzing the impact of a scope change on an existing project plan.
    You are given a scope change request. You must determine:
    1. Whether this is an ADDITION, REMOVAL, or REDESIGN.
    2. Which existing completed feature specs need to be revised.
    3. Which in-progress feature specs need to be revised. (Assume none are in-progress if not specified, or use the tracker if provided).
    4. Which pending feature specs need to be revised.
    5. What new features need to be created.
    6. Which diagrams need to be updated.
    7. Estimated timeline delta in days.
    8. Estimated cost delta in USD.
    9. A brief summary of the impact.`,
  });

  const tracker = contextFiles.find(f => f.fileType === "PROGRESS_TRACKER")?.content || "";

  const prompt = `
  Project Name: ${project.name}
  Scope Change Request:
  ${changeDescription}

  Current Progress Tracker:
  ${tracker}

  Current Feature Specs (Slugs):
  ${featureSpecs.map((f) => f.slug).join("\n")}

  Current Diagrams (Names and IDs):
  ${diagrams.map((d) => `${d.name} (${d.id})`).join("\n")}

  Output ONLY a JSON object matching this schema, without any markdown formatting or extra text:
  {
    "changeType": "ADDITION",
    "affectedCompletedFeatures": ["slug-1"],
    "affectedInProgressFeatures": [],
    "affectedPendingFeatures": ["slug-2"],
    "newFeaturesNeeded": [{ "title": "...", "description": "..." }],
    "diagramsNeedingUpdates": ["diagram-id"],
    "timelineDeltaDays": 2,
    "costDeltaUsd": 500,
    "impactSummary": "..."
  }
  `;

  const res = await callAI("scope_change_impact_analysis", {
    systemPrompt,
    userPrompt: prompt,
    plan,
  });

  if (res.status !== "ok") {
    throw new Error(
      `Scope change impact analysis queued or failed: ${res.lastError || "provider chain exhausted"}`
    );
  }

  const rawJson = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
  const report = JSON.parse(rawJson) as ImpactAnalysisReport;

  return report;
}

export async function applyScopeChange(
  projectId: string,
  executionPlanId: string,
  requesterId: string
) {
  const executionPlan = await db.executionPlan.findUnique({
    where: { id: executionPlanId },
  });

  if (!executionPlan || executionPlan.taskType !== "SCOPE_CHANGE" || executionPlan.status !== "APPROVED") {
    throw new Error("Invalid or unapproved execution plan for scope change.");
  }

  const report = JSON.parse(executionPlan.content) as ImpactAnalysisReport;
  const appliedAt = new Date();

  await db.$transaction(async (tx) => {
    const diagrams = report.diagramsNeedingUpdates.length
      ? await tx.diagram.findMany({
          where: { projectId, id: { in: report.diagramsNeedingUpdates } },
        })
      : [];

    for (const diagram of diagrams) {
      await tx.diagramVersion.create({
        data: {
          diagramId: diagram.id,
          version: diagram.version,
          reactFlowData: diagram.reactFlowData ?? Prisma.DbNull,
          pngStorageUrl: diagram.pngStorageUrl,
          errorMessage: diagram.errorMessage,
        },
      });

      await tx.diagram.update({
        where: { id: diagram.id },
        data: {
          version: diagram.version + 1,
          status: "QUEUED",
          errorMessage: scopeChangeDiagramMessage(report, executionPlanId),
          startedAt: null,
          completedAt: null,
        },
      });
    }

    const specs = await tx.featureSpec.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
    const specsBySlug = new Map(specs.map((spec) => [spec.slug, spec]));
    let nextOrder =
      specs.reduce((max, spec) => Math.max(max, spec.order), 0) + 1;
    let createdSpecCount = 0;

    const reviseSlugs = new Set([
      ...report.affectedCompletedFeatures,
      ...report.affectedInProgressFeatures,
      ...report.affectedPendingFeatures,
    ]);

    for (const slug of reviseSlugs) {
      const spec = specsBySlug.get(slug);
      if (!spec) continue;

      const note = buildSpecRevisionNote({
        report,
        executionPlanId,
        appliedAt,
        disposition: dispositionForFeature(report, slug),
      });

      if (!spec.content.includes(`ExecutionPlan: ${executionPlanId}`)) {
        await tx.featureSpec.update({
          where: { id: spec.id },
          data: { content: `${spec.content.trim()}\n\n${note}` },
        });
      }
    }

    if (report.changeType === "REMOVAL") {
      for (const slug of report.affectedCompletedFeatures) {
        const spec = specsBySlug.get(slug);
        if (!spec) continue;

        const title = `Remove ${spec.title}`;
        const removalSlug = slugify(title);
        const existing = specsBySlug.get(removalSlug);
        if (existing) continue;

        await tx.featureSpec.create({
          data: {
            projectId,
            order: nextOrder,
            title,
            slug: removalSlug,
            content: buildRemovalSpec({
              order: nextOrder,
              originalSpecTitle: spec.title,
              originalSpecSlug: spec.slug,
              executionPlanId,
              report,
            }),
          },
        });
        specsBySlug.set(removalSlug, {
          ...spec,
          id: removalSlug,
          order: nextOrder,
          title,
          slug: removalSlug,
          content: "",
        });
        nextOrder += 1;
        createdSpecCount += 1;
      }
    }

    for (const feature of report.newFeaturesNeeded) {
      const title = feature.title.trim();
      if (!title) continue;

      const slug = slugify(title);
      if (specsBySlug.has(slug)) continue;

      await tx.featureSpec.create({
        data: {
          projectId,
          order: nextOrder,
          title,
          slug,
          content: buildAddedFeatureSpec({
            order: nextOrder,
            feature,
            executionPlanId,
            report,
          }),
        },
      });
      specsBySlug.set(slug, {
        id: slug,
        projectId,
        order: nextOrder,
        title,
        slug,
        content: "",
        createdAt: appliedAt,
        updatedAt: appliedAt,
      });
      nextOrder += 1;
      createdSpecCount += 1;
    }

    if (createdSpecCount > 0) {
      await tx.project.update({
        where: { id: projectId },
        data: { featureSpecCount: specs.length + createdSpecCount },
      });
    }

    await tx.executionPlan.update({
      where: { id: executionPlanId },
      data: {
        status: "EXECUTED",
        executedAt: new Date(),
      },
    });

    const tracker = await tx.contextFile.findUnique({
      where: { projectId_fileType: { projectId, fileType: "PROGRESS_TRACKER" } },
    });

    if (tracker) {
      const updatedTrackerContent = appendUniqueSection(
        tracker.content,
        `scope-change-${executionPlanId}`,
        buildProgressTrackerScopeChangeNote({
          report,
          executionPlanId,
          requesterId,
          appliedAt,
          diagramsUpdated: diagrams,
        })
      );
      await tx.contextFile.update({
        where: { id: tracker.id },
        data: { content: updatedTrackerContent },
      });
    }

    const changelogEntry = buildChangeLogEntry({
      report,
      executionPlanId,
      requesterId,
      appliedAt,
    });
    const changeLog = await tx.researchDocument.findFirst({
      where: {
        projectId,
        sourceType: "PROJECT_MANAGEMENT_EXPORT",
        title: "CHANGE_LOG.md",
      },
    });

    if (changeLog) {
      await tx.researchDocument.update({
        where: { id: changeLog.id },
        data: {
          content: appendUniqueSection(
            changeLog.content,
            `scope-change-${executionPlanId}`,
            changelogEntry
          ),
        },
      });
    } else {
      await tx.researchDocument.create({
        data: {
          projectId,
          sourceType: "PROJECT_MANAGEMENT_EXPORT",
          title: "CHANGE_LOG.md",
          content: `# Change Log\n\n${changelogEntry}`,
        },
      });
    }

    const adrContent = buildScopeChangeAdr({
      status: "APPROVED",
      changeDescription: executionPlan.revisionNotes || "",
      report,
      executionPlanId,
      requesterId,
      recordedAt: appliedAt,
    });
    await tx.researchDocument.create({
      data: {
        projectId,
        sourceType: "SCOPE_CHANGE_ADR",
        title: scopeChangeAdrTitle(executionPlanId, appliedAt),
        content: adrContent,
      },
    });
  });

  return { success: true };
}

export async function recordRejectedScopeChange(
  projectId: string,
  executionPlanId: string,
  requesterId: string
) {
  const executionPlan = await db.executionPlan.findUnique({
    where: { id: executionPlanId },
  });

  if (!executionPlan || executionPlan.taskType !== "SCOPE_CHANGE" || executionPlan.status !== "REJECTED") {
    throw new Error("Invalid or unrejected execution plan for scope change.");
  }

  const report = JSON.parse(executionPlan.content) as ImpactAnalysisReport;
  const recordedAt = new Date();

  await db.researchDocument.create({
    data: {
      projectId,
      sourceType: "SCOPE_CHANGE_ADR",
      title: scopeChangeAdrTitle(executionPlanId, recordedAt),
      content: buildScopeChangeAdr({
        status: "REJECTED",
        changeDescription: executionPlan.revisionNotes || "",
        report,
        executionPlanId,
        requesterId,
        recordedAt,
      }),
    },
  });

  return { success: true };
}

function scopeChangeDiagramMessage(
  report: ImpactAnalysisReport,
  executionPlanId: string
) {
  return `Scope change ${executionPlanId} approved; diagram queued for regeneration. ${report.impactSummary}`;
}

function dispositionForFeature(report: ImpactAnalysisReport, slug: string) {
  if (report.changeType !== "REMOVAL") return "REVISED - re-review required";
  if (report.affectedCompletedFeatures.includes(slug)) {
    return "REMOVAL spec generated - re-review required";
  }
  if (report.affectedInProgressFeatures.includes(slug)) {
    return "PAUSED - user choice required";
  }
  return "CANCELLED - removed before implementation";
}

function buildSpecRevisionNote({
  report,
  executionPlanId,
  appliedAt,
  disposition,
}: {
  report: ImpactAnalysisReport;
  executionPlanId: string;
  appliedAt: Date;
  disposition: string;
}) {
  return [
    "> [!WARNING]",
    `> Scope change approved on ${appliedAt.toISOString()}.`,
    `> ExecutionPlan: ${executionPlanId}.`,
    `> Status: ${disposition}.`,
    `> Impact: ${report.impactSummary}`,
  ].join("\n");
}

function buildRemovalSpec({
  order,
  originalSpecTitle,
  originalSpecSlug,
  executionPlanId,
  report,
}: {
  order: number;
  originalSpecTitle: string;
  originalSpecSlug: string;
  executionPlanId: string;
  report: ImpactAnalysisReport;
}) {
  return `# Feature ${String(order).padStart(2, "0")} - Remove ${originalSpecTitle}

## Type

REMOVAL (removes Feature: ${originalSpecSlug})

## What This Delivers

Removes the completed feature affected by approved scope change ${executionPlanId}.

## Dependencies

- Scope change execution plan ${executionPlanId} must be approved.

## Files Owned

- To be derived by the downstream implementation agent from the original feature ownership and residual-reference search.

## Files

RUN: \`rg "${originalSpecSlug}|${originalSpecTitle}" .\` - find feature references before deletion.
MODIFY: affected source, tests, docs, diagrams, and generated package files identified by the removal audit.

## Implementation Notes

${MANDATORY_SPEC_GATES}

- Impact summary: ${report.impactSummary}
- Delete owned implementation files, remove route/component/database references, clean generated artifacts, and update tests.
- Do not leave dead code or stale documentation references behind.

## Out of Scope

- Adding replacement functionality not described by scope change ${executionPlanId}.

## Future Modifications

- None planned.

## Acceptance Criteria

- [ ] Original feature behavior is removed.
- [ ] Residual-reference search is clean or every remaining reference is documented as historical.
- [ ] Tests and build pass after removal.
- [ ] Progress tracker records the removal as complete.
`;
}

function buildAddedFeatureSpec({
  order,
  feature,
  executionPlanId,
  report,
}: {
  order: number;
  feature: { title: string; description: string };
  executionPlanId: string;
  report: ImpactAnalysisReport;
}) {
  return `# Feature ${String(order).padStart(2, "0")} - ${feature.title}

## Type

NEW FEATURE

## What This Delivers

${feature.description}

## Dependencies

- Scope change execution plan ${executionPlanId} must be approved.

## Files Owned

- To be assigned during re-review from the updated Feature DAG and diagram set.

## Files

MODIFY: files assigned during post-scope-change spec review.

## Implementation Notes

${MANDATORY_SPEC_GATES}

- Generated from approved scope change ${executionPlanId}.
- Impact summary: ${report.impactSummary}
- Re-review diagrams and update file ownership before implementation.

## Out of Scope

- Work not included in the approved scope-change impact report.

## Future Modifications

- None planned.

## Acceptance Criteria

- [ ] The updated diagrams and generated spec are reviewed before implementation.
- [ ] Files Owned is finalized before coding starts.
- [ ] Tests and build pass after implementation.
`;
}

function buildProgressTrackerScopeChangeNote({
  report,
  executionPlanId,
  requesterId,
  appliedAt,
  diagramsUpdated,
}: {
  report: ImpactAnalysisReport;
  executionPlanId: string;
  requesterId: string;
  appliedAt: Date;
  diagramsUpdated: Array<{ id: string; name: string; version: number }>;
}) {
  return `<!-- scope-change-${executionPlanId} -->
## Scope Change Applied - ${appliedAt.toISOString()}

- **ExecutionPlan**: ${executionPlanId}
- **Requester**: ${requesterId}
- **Type**: ${report.changeType}
- **Impact**: ${report.impactSummary}
- **Timeline Delta**: ${report.timelineDeltaDays} days
- **Cost Delta**: $${report.costDeltaUsd}
- **Re-review Required**: ${[
    ...report.affectedCompletedFeatures,
    ...report.affectedInProgressFeatures,
    ...report.affectedPendingFeatures,
  ].join(", ") || "None"}
- **New Features Needed**: ${report.newFeaturesNeeded.map((f) => f.title).join(", ") || "None"}
- **Diagram Version Updates**: ${diagramsUpdated
    .map((d) => `${d.name} (${d.id}) v${d.version} -> v${d.version + 1}`)
    .join(", ") || "None"}
`;
}

function buildChangeLogEntry({
  report,
  executionPlanId,
  requesterId,
  appliedAt,
}: {
  report: ImpactAnalysisReport;
  executionPlanId: string;
  requesterId: string;
  appliedAt: Date;
}) {
  return `<!-- scope-change-${executionPlanId} -->
## [${appliedAt.toISOString().slice(0, 10)}] - Scope Change ${executionPlanId}

- **Requester**: ${requesterId}
- **Type**: ${report.changeType}
- **Impact Summary**: ${report.impactSummary}
- **Feature Delta**: revised ${[
    ...report.affectedCompletedFeatures,
    ...report.affectedInProgressFeatures,
    ...report.affectedPendingFeatures,
  ].length}; new ${report.newFeaturesNeeded.length}
- **Timeline Delta**: ${report.timelineDeltaDays} days
- **Cost Delta**: $${report.costDeltaUsd}
`;
}

function buildScopeChangeAdr({
  status,
  changeDescription,
  report,
  executionPlanId,
  requesterId,
  recordedAt,
}: {
  status: "APPROVED" | "REJECTED";
  changeDescription: string;
  report: ImpactAnalysisReport;
  executionPlanId: string;
  requesterId: string;
  recordedAt: Date;
}) {
  return `# ADR - Scope Change ${executionPlanId}

## Date

${recordedAt.toISOString()}

## Status

${status}

## Requester

${requesterId}

## Context

${changeDescription}

Impact analysis:

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`

## Decision

${status === "APPROVED" ? "Proceed with the scope change and regenerate/flag affected planning artifacts." : "Reject the scope change and preserve the current project plan."}

## Consequences

- Timeline delta: ${report.timelineDeltaDays} days.
- Cost delta: $${report.costDeltaUsd}.
- Revised specs require re-review before downstream implementation.
`;
}

function scopeChangeAdrTitle(executionPlanId: string, date: Date) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `ADR-${stamp}-scope-change-${executionPlanId}.md`;
}

function appendUniqueSection(content: string, marker: string, section: string) {
  if (content.includes(`<!-- ${marker} -->`)) return content;
  return `${content.trim()}\n\n${section.trim()}\n`;
}
