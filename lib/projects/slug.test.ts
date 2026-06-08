import { describe, it, expect } from "vitest";

import { slugify, buildProjectSlug } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("My New Project")).toBe("my-new-project");
  });

  it("collapses non-alphanumeric runs to single hyphens", () => {
    expect(slugify("Foo --- Bar___Baz!!!")).toBe("foo-bar-baz");
  });

  it("strips diacritics to ASCII", () => {
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  ...Hello...  ")).toBe("hello");
  });

  it("falls back to a default when nothing usable remains", () => {
    expect(slugify("")).toBe("untitled-project");
    expect(slugify("!!!@@@###")).toBe("untitled-project");
  });

  it("caps the base length and trims a re-exposed trailing hyphen", () => {
    const long = "a".repeat(70);
    expect(slugify(long)).toBe("a".repeat(60));
    // 60th char is a hyphen before slicing -> must not end with a hyphen.
    const withHyphenAtBoundary = `${"a".repeat(59)}-extra`;
    expect(slugify(withHyphenAtBoundary).endsWith("-")).toBe(false);
  });
});

describe("buildProjectSlug", () => {
  it("appends a lowercase 6-char suffix from the id", () => {
    expect(buildProjectSlug("My Project", "clxyz000ABCDEF")).toBe(
      "my-project-abcdef",
    );
  });

  it("distinguishes same-named projects by id suffix", () => {
    const a = buildProjectSlug("Same Name", "clxxxxxx111111");
    const b = buildProjectSlug("Same Name", "clxxxxxx222222");
    expect(a).not.toBe(b);
    expect(a).toBe("same-name-111111");
    expect(b).toBe("same-name-222222");
  });

  it("uses the default base for an empty name", () => {
    expect(buildProjectSlug("", "clxxxxxxabcdef")).toBe(
      "untitled-project-abcdef",
    );
  });
});
