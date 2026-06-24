import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Clerk auth required to link installation to user
  const user = await requireAuth();

  const installationIdStr = req.nextUrl.searchParams.get("installation_id");
  const setupAction = req.nextUrl.searchParams.get("setup_action");

  if (!installationIdStr) {
    return NextResponse.redirect(
      new URL("/?error=missing_installation", req.url),
    );
  }

  const installationId = parseInt(installationIdStr, 10);
  if (isNaN(installationId)) {
    return NextResponse.redirect(
      new URL("/?error=invalid_installation", req.url),
    );
  }

  // Store the installation_id on the user
  await db.user.update({
    where: { id: user.id },
    data: { githubInstallationId: installationId },
  });

  // Redirect back to dashboard or project with success state
  // We can just go to the dashboard for now, or if we passed a state param, back to the project.
  return NextResponse.redirect(new URL("/dashboard?github=installed", req.url));
}
