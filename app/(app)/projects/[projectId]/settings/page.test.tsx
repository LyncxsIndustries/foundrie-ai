import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import SettingsPage from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/lib/auth/get-auth-user", () => ({
  getAuthUser: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/components/project/ProjectSettings", () => ({
  ProjectSettings: ({ project }: any) => (
    <div data-testid="project-settings">Settings for {project.name}</div>
  ),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings when project exists", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.project.findFirst).mockResolvedValue({
      id: "proj-1",
      name: "Test Project",
      description: "Test description",
      status: "DISCOVERY",
      lastZipUrl: null,
      lastZipFileName: null,
      lastZipGeneratedAt: null,
      updatedAt: new Date(),
    });

    const params = Promise.resolve({ projectId: "proj-1" });
    const element = await SettingsPage({ params });
    render(element);

    expect(screen.getByTestId("project-settings")).toHaveTextContent(
      "Settings for Test Project"
    );
  });

  it("returns 404 when project not found", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.project.findFirst).mockResolvedValue(null);

    const params = Promise.resolve({ projectId: "proj-1" });
    await SettingsPage({ params });

    expect(notFound).toHaveBeenCalled();
  });

  it("queries project with owner scope", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.project.findFirst).mockResolvedValue({
      id: "proj-1",
      name: "Test Project",
      description: null,
      status: "DISCOVERY",
      lastZipUrl: null,
      lastZipFileName: null,
      lastZipGeneratedAt: null,
      updatedAt: new Date(),
    });

    const params = Promise.resolve({ projectId: "proj-1" });
    await SettingsPage({ params });

    expect(db.project.findFirst).toHaveBeenCalledWith({
      where: { id: "proj-1", userId: "user-1" },
      select: expect.objectContaining({
        id: true,
        name: true,
        description: true,
      }),
    });
  });
});
