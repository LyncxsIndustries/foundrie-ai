import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import {
  ProjectAuthError,
  requireProjectOwner,
} from "@/lib/auth/project-access";
import { db } from "@/lib/db";
import { ExecutionPlanStatus } from "@/lib/generated/prisma/client";
import {
  computeImpactAnalysis,
  applyScopeChange,
  recordRejectedScopeChange,
  type ImpactAnalysisReport,
  type ScopeChangeType,
} from "@/lib/scope/impact-analysis";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const user = await requireAuth();
    await requireProjectOwner(projectId, user.id);

    const body = await readJsonObject(request);
    const action = readAction(body);

    if (action === "COMPUTE") {
      const changeDescription = readRequiredString(body, "changeDescription");

      const report = await computeImpactAnalysis(
        projectId,
        changeDescription,
        user.plan,
      );
      return NextResponse.json(report);
    }
    
    if (action === "APPROVE") {
      const changeDescription = readRequiredString(body, "changeDescription");
      const report = readImpactAnalysisReport(body.report);
      
      const executionPlan = await db.executionPlan.create({
        data: {
          projectId,
          taskType: "SCOPE_CHANGE",
          status: ExecutionPlanStatus.APPROVED,
          content: JSON.stringify(report),
          revisionNotes: changeDescription,
          approvedAt: new Date(),
        },
      });

      await applyScopeChange(projectId, executionPlan.id, user.id);
      return NextResponse.json({ success: true, executionPlanId: executionPlan.id });
    }

    if (action === "REJECT") {
      const changeDescription = readRequiredString(body, "changeDescription");
      const report = readImpactAnalysisReport(body.report);
      
      const executionPlan = await db.executionPlan.create({
        data: {
          projectId,
          taskType: "SCOPE_CHANGE",
          status: ExecutionPlanStatus.REJECTED,
          content: JSON.stringify(report),
          revisionNotes: changeDescription,
        },
      });

      await recordRejectedScopeChange(projectId, executionPlan.id, user.id);
      return NextResponse.json({ success: true, executionPlanId: executionPlan.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ProjectAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    logScopeChangeRouteError(error, projectId);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

class RequestValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

type JsonRecord = Record<string, unknown>;

async function readJsonObject(request: NextRequest): Promise<JsonRecord> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new RequestValidationError("Request body must be valid JSON");
  }

  if (!isRecord(body)) {
    throw new RequestValidationError("Request body must be a JSON object");
  }
  return body;
}

function readAction(body: JsonRecord): "COMPUTE" | "APPROVE" | "REJECT" {
  const action = body.action;
  if (action === "COMPUTE" || action === "APPROVE" || action === "REJECT") {
    return action;
  }
  throw new RequestValidationError("Invalid action");
}

function readRequiredString(body: JsonRecord, key: string) {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RequestValidationError(`${key} is required`);
  }
  return value;
}

function readImpactAnalysisReport(value: unknown): ImpactAnalysisReport {
  if (!isImpactAnalysisReport(value)) {
    throw new RequestValidationError("report must be a valid impact analysis report");
  }
  return value;
}

function isImpactAnalysisReport(value: unknown): value is ImpactAnalysisReport {
  if (!isRecord(value)) return false;

  return (
    isScopeChangeType(value.changeType) &&
    isStringArray(value.affectedCompletedFeatures) &&
    isStringArray(value.affectedInProgressFeatures) &&
    isStringArray(value.affectedPendingFeatures) &&
    isNewFeatureArray(value.newFeaturesNeeded) &&
    isStringArray(value.diagramsNeedingUpdates) &&
    typeof value.timelineDeltaDays === "number" &&
    typeof value.costDeltaUsd === "number" &&
    typeof value.impactSummary === "string"
  );
}

function isScopeChangeType(value: unknown): value is ScopeChangeType {
  return value === "ADDITION" || value === "REMOVAL" || value === "REDESIGN";
}

function isNewFeatureArray(
  value: unknown,
): value is ImpactAnalysisReport["newFeaturesNeeded"] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.description === "string",
    )
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function logScopeChangeRouteError(error: unknown, projectId: string) {
  const message = error instanceof Error ? error.message : "Unknown route error";
  const record = {
    level: "error",
    timestamp: new Date().toISOString(),
    component: "scope-change.route",
    event: "scope_change_route_error",
    projectId,
    error: message,
  };

  process.stdout.write(`${JSON.stringify(record)}\n`);
}
