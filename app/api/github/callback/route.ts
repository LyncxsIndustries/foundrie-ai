import { NextRequest, NextResponse } from "next/server";

/**
 * GitHub App callback route (alias for /api/github/install)
 * Redirects to the main install handler
 */
export async function GET(req: NextRequest) {
  // Extract all query params from callback
  const searchParams = req.nextUrl.searchParams;
  
  // Build the install URL with all params preserved
  const installUrl = new URL("/api/github/install", req.url);
  searchParams.forEach((value, key) => {
    installUrl.searchParams.set(key, value);
  });
  
  // Redirect to the actual install handler
  return NextResponse.redirect(installUrl);
}
