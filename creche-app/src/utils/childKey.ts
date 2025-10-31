/**
 * Utility functions for generating unique, deterministic child identifiers
 * Used to prevent duplicate child profiles per parent
 */

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    // Remove accents/diacritics
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Remove all non-alphanumeric characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, "")
    // Collapse multiple spaces/hyphens into single hyphen
    .replace(/[\s-]+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

export function childDocId(parentId: string, name: string, dob: string): string {
  const normalized = normalizeName(name);
  return `${parentId}__${normalized}__${dob}`;
}
