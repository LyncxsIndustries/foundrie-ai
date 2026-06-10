import { describe, it, expect } from "vitest";
import {
  UMLEdgeDataSchema,
  SequenceEdgeDataSchema,
  EREdgeDataSchema,
  C4EdgeDataSchema,
} from "./edges";

describe("Edge Schemas", () => {
  describe("UMLEdgeDataSchema", () => {
    it("validates association edge", () => {
      const result = UMLEdgeDataSchema.safeParse({
        type: "association",
        label: "uses",
      });
      expect(result.success).toBe(true);
    });

    it("validates aggregation edge with multiplicity", () => {
      const result = UMLEdgeDataSchema.safeParse({
        type: "aggregation",
        label: "contains",
        multiplicity: "1..*",
      });
      expect(result.success).toBe(true);
    });

    it("validates composition edge", () => {
      const result = UMLEdgeDataSchema.safeParse({
        type: "composition",
      });
      expect(result.success).toBe(true);
    });

    it("validates inheritance edge", () => {
      const result = UMLEdgeDataSchema.safeParse({
        type: "inheritance",
      });
      expect(result.success).toBe(true);
    });

    it("validates dependency edge", () => {
      const result = UMLEdgeDataSchema.safeParse({
        type: "dependency",
        label: "depends on",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid edge type", () => {
      const result = UMLEdgeDataSchema.safeParse({
        type: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("SequenceEdgeDataSchema", () => {
    it("validates sync message", () => {
      const result = SequenceEdgeDataSchema.safeParse({
        type: "sync",
        message: "getData()",
      });
      expect(result.success).toBe(true);
    });

    it("validates async message", () => {
      const result = SequenceEdgeDataSchema.safeParse({
        type: "async",
        message: "notify()",
      });
      expect(result.success).toBe(true);
    });

    it("validates return message", () => {
      const result = SequenceEdgeDataSchema.safeParse({
        type: "return",
        label: "result",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid message type", () => {
      const result = SequenceEdgeDataSchema.safeParse({
        type: "broadcast",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("EREdgeDataSchema", () => {
    it("validates one-to-many relationship", () => {
      const result = EREdgeDataSchema.safeParse({
        cardinality: "one-to-many",
        label: "owns",
      });
      expect(result.success).toBe(true);
    });

    it("validates many-to-many relationship with cardinalities", () => {
      const result = EREdgeDataSchema.safeParse({
        cardinality: "many-to-many",
        sourceCardinality: "zero-or-many",
        targetCardinality: "many",
      });
      expect(result.success).toBe(true);
    });

    it("validates relationship without label", () => {
      const result = EREdgeDataSchema.safeParse({
        cardinality: "one-to-one",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid cardinality", () => {
      const result = EREdgeDataSchema.safeParse({
        cardinality: "some-to-some",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("C4EdgeDataSchema", () => {
    it("validates C4 edge with label only", () => {
      const result = C4EdgeDataSchema.safeParse({
        label: "reads from",
      });
      expect(result.success).toBe(true);
    });

    it("validates C4 edge with description", () => {
      const result = C4EdgeDataSchema.safeParse({
        label: "sends events",
        description: "Publishes domain events to message bus",
      });
      expect(result.success).toBe(true);
    });

    it("validates C4 edge with technology", () => {
      const result = C4EdgeDataSchema.safeParse({
        label: "API call",
        technology: "REST/HTTPS",
      });
      expect(result.success).toBe(true);
    });

    it("validates minimal C4 edge", () => {
      const result = C4EdgeDataSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
