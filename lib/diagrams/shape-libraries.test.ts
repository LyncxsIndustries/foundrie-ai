import { describe, it, expect } from "vitest";
import { SHAPE_LIBRARIES, getDiagramTypesByCategory, getShapeLibrary } from "./shape-libraries";

describe("Shape Libraries", () => {
  it("exports all 12 diagram types", () => {
    expect(Object.keys(SHAPE_LIBRARIES)).toHaveLength(12);
    const expectedTypes = [
      "system-context",
      "container",
      "component",
      "erd",
      "sequence",
      "dfd",
      "state-machine",
      "deployment",
      "api-map",
      "feature-dag",
      "agent-architecture",
      "security-architecture",
    ];
    expectedTypes.forEach((type) => {
      expect(SHAPE_LIBRARIES).toHaveProperty(type);
    });
  });

  it("each diagram type has required metadata", () => {
    Object.values(SHAPE_LIBRARIES).forEach((lib) => {
      expect(lib).toHaveProperty("id");
      expect(lib).toHaveProperty("label");
      expect(lib).toHaveProperty("category");
      expect(lib).toHaveProperty("trigger");
      expect(lib).toHaveProperty("fileFormat");
      expect(lib).toHaveProperty("nodes");
      expect(lib).toHaveProperty("edges");
      expect(lib.label).toBeTruthy();
      expect(lib.trigger).toBeTruthy();
      expect(Array.isArray(lib.fileFormat)).toBe(true);
      expect(Array.isArray(lib.nodes)).toBe(true);
      expect(Array.isArray(lib.edges)).toBe(true);
    });
  });

  it("each shape definition has required fields", () => {
    Object.values(SHAPE_LIBRARIES).forEach((lib) => {
      lib.nodes.forEach((node) => {
        expect(node).toHaveProperty("id");
        expect(node).toHaveProperty("label");
        expect(node).toHaveProperty("icon");
        expect(node).toHaveProperty("description");
      });
      lib.edges.forEach((edge) => {
        expect(edge).toHaveProperty("id");
        expect(edge).toHaveProperty("label");
        expect(edge).toHaveProperty("icon");
        expect(edge).toHaveProperty("description");
      });
    });
  });

  it("getDiagramTypesByCategory filters correctly", () => {
    const architectural = getDiagramTypesByCategory("architectural");
    expect(architectural.length).toBeGreaterThan(0);
    architectural.forEach((type) => {
      expect(type.category).toBe("architectural");
    });

    const data = getDiagramTypesByCategory("data");
    expect(data.length).toBe(2); // ERD and DFD
    data.forEach((type) => {
      expect(type.category).toBe("data");
    });
  });

  it("getShapeLibrary returns correct library", () => {
    const erdLib = getShapeLibrary("erd");
    expect(erdLib.id).toBe("erd");
    expect(erdLib.category).toBe("data");
    expect(erdLib.nodes.length).toBeGreaterThan(0);
    expect(erdLib.edges.length).toBeGreaterThan(0);
  });

  it("all categories have at least one diagram type", () => {
    const categories = ["structural", "behavioral", "architectural", "data", "infrastructure"] as const;
    categories.forEach((cat) => {
      const types = getDiagramTypesByCategory(cat);
      expect(types.length).toBeGreaterThan(0);
    });
  });

  it("diagram type ids match their keys", () => {
    Object.entries(SHAPE_LIBRARIES).forEach(([key, lib]) => {
      expect(lib.id).toBe(key);
    });
  });
});
