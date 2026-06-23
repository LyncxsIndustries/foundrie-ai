import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionCheckpoint, discardSession } from "./checkpoint";
import { db } from "../db";
import { ProjectStatus, DiagramStatus, ExecutionPlanStatus } from "../generated/prisma/enums";

vi.mock("../db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    conversation: {
      update: vi.fn(),
    },
    diagram: {
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    executionPlan: {
      deleteMany: vi.fn(),
    },
  },
}));

describe("getSessionCheckpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no unfinished session if project is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValueOnce(null);
    const result = await getSessionCheckpoint("proj_1");
    expect(result.hasUnfinishedSession).toBe(false);
  });

  it("returns unfinished discovery if messages exist", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValueOnce({
      id: "proj_1",
      status: ProjectStatus.DISCOVERY,
      updatedAt: new Date("2026-06-23T20:20:00Z"),
      conversation: { messages: [{ role: "user", content: "hello" }] },
      diagrams: [],
      executionPlans: [],
    } as any);

    const result = await getSessionCheckpoint("proj_1");
    expect(result.hasUnfinishedSession).toBe(true);
    expect(result.resumeUrl).toBe("/projects/proj_1/discovery");
    expect(result.checkpointSummary).toContain("Unfinished discovery chat");
  });

  it("returns unfinished architecture if execution plan is proposed", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValueOnce({
      id: "proj_1",
      status: ProjectStatus.ARCHITECTURE,
      updatedAt: new Date("2026-06-23T20:20:00Z"),
      conversation: { messages: [] },
      diagrams: [],
      executionPlans: [{ id: "ep_1", status: ExecutionPlanStatus.PROPOSED }],
    } as any);

    const result = await getSessionCheckpoint("proj_1");
    expect(result.hasUnfinishedSession).toBe(true);
    expect(result.resumeUrl).toBe("/projects/proj_1/architecture");
    expect(result.checkpointSummary).toContain("Unapproved architecture proposal");
  });

  it("returns unfinished diagrams if diagrams are generating", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValueOnce({
      id: "proj_1",
      status: ProjectStatus.DIAGRAM_GENERATION,
      updatedAt: new Date("2026-06-23T20:20:00Z"),
      conversation: { messages: [] },
      diagrams: [{ id: "d_1", status: DiagramStatus.GENERATING }],
      executionPlans: [],
    } as any);

    const result = await getSessionCheckpoint("proj_1");
    expect(result.hasUnfinishedSession).toBe(true);
    expect(result.resumeUrl).toBe("/projects/proj_1/diagrams");
    expect(result.checkpointSummary).toContain("Diagram generation in progress");
  });
});

describe("discardSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears conversation messages if in DISCOVERY", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValueOnce({
      id: "proj_1",
      status: ProjectStatus.DISCOVERY,
      executionPlans: [],
    } as any);

    await discardSession("proj_1");
    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { projectId: "proj_1" },
      data: { messages: [] },
    });
  });

  it("deletes pending diagrams if in DIAGRAM_GENERATION", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValueOnce({
      id: "proj_1",
      status: ProjectStatus.DIAGRAM_GENERATION,
      executionPlans: [],
    } as any);
    vi.mocked(db.diagram.count).mockResolvedValueOnce(0);

    await discardSession("proj_1");
    expect(db.diagram.deleteMany).toHaveBeenCalled();
    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: "proj_1" },
      data: { status: ProjectStatus.ARCHITECTURE },
    });
  });
});
