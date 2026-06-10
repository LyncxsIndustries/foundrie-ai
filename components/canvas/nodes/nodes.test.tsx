import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { ClassNode } from "./ClassNode";
import { C4Node } from "./C4Node";
import { SequenceNode } from "./SequenceNode";
import { ERNode } from "./ERNode";
import { InfrastructureNode } from "./InfrastructureNode";

const createNodeProps = (data: any) => ({
  id: "test-1",
  type: "test",
  data,
  selected: false,
  dragging: false,
  isConnectable: true,
  zIndex: 0,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  xPos: 0,
  yPos: 0,
});

describe("Node Components", () => {
  describe("ClassNode", () => {
    it("renders class with label", () => {
      const props = createNodeProps({ label: "User" });
      render(
        <ReactFlowProvider>
          <ClassNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("User")).toBeInTheDocument();
    });

    it("renders class with attributes and methods", () => {
      const props = createNodeProps({
        label: "User",
        attributes: ["id: string", "name: string"],
        methods: ["save(): void"],
      });
      render(
        <ReactFlowProvider>
          <ClassNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("id: string")).toBeInTheDocument();
      expect(screen.getByText("save(): void")).toBeInTheDocument();
    });

    it("renders stereotype label", () => {
      const props = createNodeProps({ label: "IRepository", stereotype: "interface" });
      render(
        <ReactFlowProvider>
          <ClassNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("<<interface>>")).toBeInTheDocument();
    });
  });

  describe("C4Node", () => {
    it("renders person node", () => {
      const props = createNodeProps({ label: "User", type: "person" });
      render(
        <ReactFlowProvider>
          <C4Node {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("User")).toBeInTheDocument();
    });

    it("renders node with description and technology", () => {
      const props = createNodeProps({
        label: "API",
        type: "system",
        description: "Backend API",
        technology: "Node.js",
      });
      render(
        <ReactFlowProvider>
          <C4Node {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("Backend API")).toBeInTheDocument();
      expect(screen.getByText("Node.js")).toBeInTheDocument();
    });
  });

  describe("SequenceNode", () => {
    it("renders lifeline node", () => {
      const props = createNodeProps({ label: "User", type: "lifeline" });
      render(
        <ReactFlowProvider>
          <SequenceNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("User")).toBeInTheDocument();
    });

    it("renders fragment with type", () => {
      const props = createNodeProps({
        label: "Alternative",
        type: "fragment",
        fragmentType: "alt",
      });
      render(
        <ReactFlowProvider>
          <SequenceNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("ALT")).toBeInTheDocument();
      expect(screen.getByText("Alternative")).toBeInTheDocument();
    });
  });

  describe("ERNode", () => {
    it("renders entity with attributes", () => {
      const props = createNodeProps({
        label: "User",
        type: "entity",
        attributes: ["id", "name"],
        primaryKey: "id",
      });
      render(
        <ReactFlowProvider>
          <ERNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText(/id/)).toBeInTheDocument();
    });

    it("renders weak entity", () => {
      const props = createNodeProps({ label: "Dependent", type: "weak-entity" });
      render(
        <ReactFlowProvider>
          <ERNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("Dependent")).toBeInTheDocument();
    });
  });

  describe("InfrastructureNode", () => {
    it("renders microservice node", () => {
      const props = createNodeProps({
        label: "Auth Service",
        type: "microservice",
        technology: "Go",
      });
      render(
        <ReactFlowProvider>
          <InfrastructureNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
      expect(screen.getByText("Go")).toBeInTheDocument();
    });

    it("renders instance count", () => {
      const props = createNodeProps({
        label: "API",
        type: "microservice",
        instances: 3,
      });
      render(
        <ReactFlowProvider>
          <InfrastructureNode {...props} />
        </ReactFlowProvider>
      );
      expect(screen.getByText("×3")).toBeInTheDocument();
    });

    it("uses inlined base64 SVG icon", () => {
      const props = createNodeProps({ label: "Cache", type: "cache" });
      const { container } = render(
        <ReactFlowProvider>
          <InfrastructureNode {...props} />
        </ReactFlowProvider>
      );
      const img = container.querySelector("img");
      expect(img?.src).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });
});
