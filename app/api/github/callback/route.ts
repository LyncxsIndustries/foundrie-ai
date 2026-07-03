import { NextRequest, NextResponse } from "next/server";

/**
 * GitHub App callback route (alias for /api/github/install)
 * Redirects to the main install handler
 */
export async function GET(req: NextRequest) {
  // Build the install URL with all params preserved
  const installUrl = new URL("/api/github/install", req.url);
  installUrl.search = req.nextUrl.search;
  
  // Redirect to the actual install handler
  return NextResponse.redirect(installUrl);
}
