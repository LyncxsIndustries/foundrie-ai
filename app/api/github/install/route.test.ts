import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user_1" }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { GET } from "./route";

describe("GitHub Install Route", () => {
  it("should update user and redirect on valid installation_id", async () => {
    const req = new NextRequest(
      "http://localhost/api/github/install?installation_id=123&setup_action=install"
    );
    const res = await GET(req);

    expect(res.status).toBe(307); // Redirect status
    expect(res.headers.get("location")).toContain("/dashboard?github=installed");
  });

  it("should redirect with error on missing installation_id", async () => {
    const req = new NextRequest("http://localhost/api/github/install");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=missing_installation");
  });
});
