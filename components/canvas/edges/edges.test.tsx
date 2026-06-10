import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { UMLEdge } from "./UMLEdge";
import { SequenceEdge } from "./SequenceEdge";
import { EREdge } from "./EREdge";
import { C4Edge } from "./C4Edge";

const baseEdgeProps = {
  id: "test-edge",
  source: "node-1",
  target: "node-2",
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: "right" as const,
  targetPosition: "left" as const,
};

describe("Edge Components", () => {
  describe("UMLEdge", () => {
    it("renders association edge", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <UMLEdge {...baseEdgeProps} data={{ type: "association", label: "uses" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });

    it("renders aggregation edge with marker", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <UMLEdge {...baseEdgeProps} data={{ type: "aggregation" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("marker#uml-aggregation")).toBeTruthy();
    });

    it("renders composition edge with marker", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <UMLEdge {...baseEdgeProps} data={{ type: "composition" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("marker#uml-composition")).toBeTruthy();
    });

    it("renders inheritance edge with marker", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <UMLEdge {...baseEdgeProps} data={{ type: "inheritance" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("marker#uml-inheritance")).toBeTruthy();
    });

    it("renders dependency edge with dashed line", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <UMLEdge {...baseEdgeProps} data={{ type: "dependency" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });

    it("returns null for invalid data", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <UMLEdge {...baseEdgeProps} data={{ type: "invalid" } as any} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeFalsy();
    });
  });

  describe("SequenceEdge", () => {
    it("renders sync message edge", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <SequenceEdge {...baseEdgeProps} data={{ type: "sync", message: "getData()" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });

    it("renders async message edge", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <SequenceEdge {...baseEdgeProps} data={{ type: "async", message: "notify()" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });

    it("renders return message with dashed line", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <SequenceEdge {...baseEdgeProps} data={{ type: "return" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });
  });

  describe("EREdge", () => {
    it("renders ER relationship edge", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <EREdge {...baseEdgeProps} data={{ cardinality: "one-to-many", label: "owns" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });

    it("renders markers for cardinalities", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <EREdge
              {...baseEdgeProps}
              data={{
                cardinality: "many-to-many",
                sourceCardinality: "many",
                targetCardinality: "many",
              }}
            />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("marker#er-many")).toBeTruthy();
    });
  });

  describe("C4Edge", () => {
    it("renders C4 relationship edge", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <C4Edge {...baseEdgeProps} data={{ label: "reads from" }} />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });

    it("renders with description", () => {
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <C4Edge
              {...baseEdgeProps}
              data={{
                label: "sends events",
                description: "Publishes domain events",
              }}
            />
          </svg>
        </ReactFlowProvider>
      );
      expect(container.querySelector("path")).toBeTruthy();
    });
  });
});
