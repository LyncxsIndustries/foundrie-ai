// Project slug generation (Feature 04).
// Slugs are derived from the project name for human-readable URLs. They are not
// required to be globally unique on their own — the Project primary key (cuid)
// owns identity — so we append a short suffix from the project id to keep the
// slug stable and collision-resistant without an extra uniqueness query.

const MAX_SLUG_BASE_LENGTH = 60;
const DEFAULT_SLUG_BASE = "untitled-project";

/**
 * Convert arbitrary text into a URL-safe slug base: lowercased, diacritics
 * stripped, non-alphanumeric runs collapsed to single hyphens, trimmed, and
 * length-capped. Returns {@link DEFAULT_SLUG_BASE} when nothing usable remains.
 */
export function slugify(input: string): string {
  const normalized = input
    .normalize("NFKD")
    // Strip combining marks left by NFKD so accented characters become ASCII.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_BASE_LENGTH)
    // Slicing can re-expose a trailing hyphen; trim again.
    .replace(/-+$/g, "");

  return normalized.length > 0 ? normalized : DEFAULT_SLUG_BASE;
}

/**
 * Build the stored project slug from the project name and its generated id.
 * The id suffix keeps slugs distinct even when two projects share a name,
 * without trusting client input or issuing a uniqueness probe.
 */
export function buildProjectSlug(name: string, id: string): string {
  const base = slugify(name);
  const suffix = id.slice(-6).toLowerCase();
  return `${base}-${suffix}`;
}
