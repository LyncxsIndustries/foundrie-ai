import { describe, it, expect } from "vitest";
import { DIAGRAM_CATEGORIES, CATEGORY_ORDER, type DiagramCategory } from "./categories";

describe("Diagram Categories", () => {
  it("exports all 5 categories", () => {
    expect(Object.keys(DIAGRAM_CATEGORIES)).toHaveLength(5);
    expect(DIAGRAM_CATEGORIES).toHaveProperty("structural");
    expect(DIAGRAM_CATEGORIES).toHaveProperty("behavioral");
    expect(DIAGRAM_CATEGORIES).toHaveProperty("architectural");
    expect(DIAGRAM_CATEGORIES).toHaveProperty("data");
    expect(DIAGRAM_CATEGORIES).toHaveProperty("infrastructure");
  });

  it("each category has required metadata", () => {
    Object.values(DIAGRAM_CATEGORIES).forEach((cat) => {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("label");
      expect(cat).toHaveProperty("description");
      expect(cat).toHaveProperty("icon");
      expect(cat.label).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    });
  });

  it("CATEGORY_ORDER contains all categories", () => {
    expect(CATEGORY_ORDER).toHaveLength(5);
    const orderSet = new Set(CATEGORY_ORDER);
    const catSet = new Set(Object.keys(DIAGRAM_CATEGORIES));
    expect(orderSet).toEqual(catSet);
  });

  it("category ids match their keys", () => {
    Object.entries(DIAGRAM_CATEGORIES).forEach(([key, cat]) => {
      expect(cat.id).toBe(key);
    });
  });
});
