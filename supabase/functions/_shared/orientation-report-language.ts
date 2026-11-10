/**
 * Applied only to newly generated reports; historical documents stay immutable.
 * Protegido contra corte de palavras terminadas em 'ão' (como coagulação, atenção, condição).
 */
export function normalizeReportAddress(text: string): string {
  let res = text
    .replace(/(?<!\p{L})(?:o\s+senhor\s*\/\s*a\s+senhora|a\s+senhora\s*\/\s*o\s+senhor)(?!\p{L})/giu, "você")
    .replace(/(?<!\p{L})senhor\s*(?:\(a\)|\/a)(?!\p{L})/giu, "você")
    .replace(/(?<!\p{L})senhor(?:a)?(?!\p{L})/giu, "você")
    .replace(/(?<!\p{L})(?:o\s+você\s*\/\s*a\s+você|a\s+você\s*\/\s*o\s+você)(?!\p{L})/giu, "você")
    .replace(/(?<!\p{L})você\s*\/\s*você(?!\p{L})/giu, "você")
    .replace(/(?<!\p{L})[oa]\s+você(?!\p{L})/giu, "você");

  // Safeguard: separa qualquer palavra indevidamente colada em 'você' (ex.: coagulaçãvocê -> coagulação você)
  res = res.replace(/(\p{L})(você)(?!\p{L})/giu, "$1 $2");
  return res;
}
