import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiagramCanvas } from "./DiagramCanvas";
import * as LiveblocksReactFlow from "@liveblocks/react-flow";

vi.mock("@liveblocks/react-flow");

describe("DiagramCanvas", () => {
  beforeEach(() => {
    vi.spyOn(LiveblocksReactFlow, "useLiveblocksFlow").mockReturnValue({
      nodes: [],
      edges: [],
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      onDelete: vi.fn(),
      isLoading: false,
    } as any);
  });

  it("renders loading state", () => {
    vi.spyOn(LiveblocksReactFlow, "useLiveblocksFlow").mockReturnValue({
      nodes: [],
      edges: [],
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      onDelete: vi.fn(),
      isLoading: true,
    } as any);

    render(<DiagramCanvas />);
    expect(screen.getByText("Loading canvas...")).toBeInTheDocument();
  });

  it("renders React Flow canvas when loaded", () => {
    render(<DiagramCanvas />);
    const canvas = document.querySelector(".react-flow");
    expect(canvas).toBeInTheDocument();
  });
});
