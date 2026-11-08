/** Applied only to newly generated reports; historical documents stay immutable. */
export function normalizeReportAddress(text: string): string {
  return text
    .replace(/\b(?:o\s+senhor\s*\/\s*a\s+senhora|a\s+senhora\s*\/\s*o\s+senhor)\b/gi, "você")
    .replace(/\bsenhor\s*(?:\(a\)|\/a)|\bsenhor(?:a)?\b/gi, "você")
    .replace(/\b(?:o\s+você\s*\/\s*a\s+você|a\s+você\s*\/\s*o\s+você)\b/gi, "você")
    .replace(/\bvocê\s*\/\s*você\b/gi, "você")
    .replace(/\b[oa]\s+você\b/gi, "você");
}