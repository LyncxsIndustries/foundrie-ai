import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { logEvent } from "@/lib/ai/log";
import { db } from "@/lib/db";

// Next.js App Router exposes raw body via req.text(), so we don't need bodyParser config
export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    logEvent("error", {
      event: "ai_outcome",
      task: "github_webhook",
      modelKey: "github",
      status: "queued",
      attempts: 1,
      durationMs: 0,
    });
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const webhooks = new Webhooks({ secret });

  // Webhook event handlers
  webhooks.on("installation.created", async ({ payload }) => {
    logEvent("info", {
      event: "ai_outcome",
      task: "github_webhook_event",
      modelKey: "installation.created",
      status: "ok",
      attempts: 1,
      durationMs: 0,
    });
    // Note: To map a newly created installation to a user without the callback flow
    // requires custom state passing or user identification. Our primary mapping
    // is done in the install/route.ts callback.
  });

  webhooks.on("installation.deleted", async ({ payload }) => {
    logEvent("info", {
      event: "ai_outcome",
      task: "github_webhook_event",
      modelKey: "installation.deleted",
      status: "ok",
      attempts: 1,
      durationMs: 0,
    });
    // Clear the installation ID for any user that had it
    await db.user.updateMany({
      where: { githubInstallationId: payload.installation.id },
      data: { githubInstallationId: null },
    });
  });

  webhooks.on("installation.suspend", async ({ payload }) => {
    logEvent("info", {
      event: "ai_outcome",
      task: "github_webhook_event",
      modelKey: "installation.suspend",
      status: "ok",
      attempts: 1,
      durationMs: 0,
    });
  });

  webhooks.on("installation.unsuspend", async ({ payload }) => {
    logEvent("info", {
      event: "ai_outcome",
      task: "github_webhook_event",
      modelKey: "installation.unsuspend",
      status: "ok",
      attempts: 1,
      durationMs: 0,
    });
  });

  webhooks.on("installation_repositories.added", async ({ payload }) => {
    logEvent("info", {
      event: "ai_outcome",
      task: "github_webhook_event",
      modelKey: "installation_repositories.added",
      status: "ok",
      attempts: 1,
      durationMs: 0,
    });
  });

  webhooks.on("installation_repositories.removed", async ({ payload }) => {
    logEvent("info", {
      event: "ai_outcome",
      task: "github_webhook_event",
      modelKey: "installation_repositories.removed",
      status: "ok",
      attempts: 1,
      durationMs: 0,
    });
  });

  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");
  const id = req.headers.get("x-github-delivery");

  if (!signature || !event || !id) {
    return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
  }

  try {
    await webhooks.verifyAndReceive({
      id,
      name: event as any,
      payload: body,
      signature,
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logEvent("warn", {
      event: "ai_outcome",
      task: "github_webhook_verify",
      modelKey: "github",
      status: "queued",
      attempts: 1,
      durationMs: 0,
    });
    return NextResponse.json({ error: "Invalid signature or payload" }, { status: 401 });
  }
}
