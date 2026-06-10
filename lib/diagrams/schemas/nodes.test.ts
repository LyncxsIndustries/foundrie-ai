import { describe, it, expect } from "vitest";
import {
  ClassNodeDataSchema,
  C4NodeDataSchema,
  SequenceNodeDataSchema,
  ERNodeDataSchema,
  InfrastructureNodeDataSchema,
} from "./nodes";

describe("Node Data Schemas", () => {
  describe("ClassNodeDataSchema", () => {
    it("validates minimal class node data", () => {
      const result = ClassNodeDataSchema.safeParse({ label: "User" });
      expect(result.success).toBe(true);
    });

    it("validates class node with attributes and methods", () => {
      const data = {
        label: "User",
        attributes: ["id: string", "name: string"],
        methods: ["save(): void"],
        stereotype: "class" as const,
      };
      const result = ClassNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates interface stereotype", () => {
      const data = { label: "IRepository", stereotype: "interface" as const };
      const result = ClassNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("C4NodeDataSchema", () => {
    it("validates person node", () => {
      const data = { label: "User", type: "person" as const };
      const result = C4NodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates system node with technology", () => {
      const data = {
        label: "API",
        type: "system" as const,
        technology: "Node.js",
        description: "Backend API",
      };
      const result = C4NodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid type", () => {
      const data = { label: "Test", type: "invalid" };
      const result = C4NodeDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("SequenceNodeDataSchema", () => {
    it("validates lifeline node", () => {
      const data = { label: "User", type: "lifeline" as const };
      const result = SequenceNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates fragment with type", () => {
      const data = {
        label: "Alternative flow",
        type: "fragment" as const,
        fragmentType: "alt" as const,
      };
      const result = SequenceNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("ERNodeDataSchema", () => {
    it("validates entity with attributes", () => {
      const data = {
        label: "User",
        type: "entity" as const,
        attributes: ["id", "name", "email"],
        primaryKey: "id",
      };
      const result = ERNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates weak entity", () => {
      const data = { label: "Dependent", type: "weak-entity" as const };
      const result = ERNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("InfrastructureNodeDataSchema", () => {
    it("validates microservice node", () => {
      const data = {
        label: "Auth Service",
        type: "microservice" as const,
        technology: "Go",
      };
      const result = InfrastructureNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates node with instances", () => {
      const data = {
        label: "API Server",
        type: "microservice" as const,
        instances: 3,
      };
      const result = InfrastructureNodeDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid infrastructure type", () => {
      const data = { label: "Test", type: "invalid" };
      const result = InfrastructureNodeDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
