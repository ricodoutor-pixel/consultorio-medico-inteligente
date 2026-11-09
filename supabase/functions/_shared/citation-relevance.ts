/** Conservative topic gate: metadata existence alone is not clinical relevance. */
export function matchesCitationTopic(article: { title: string; abstract: string }, question: string): boolean {
  const content = `${article.title} ${article.abstract}`;
  if (/\bcbd\b|canabidiol|cannabidiol/i.test(question) && !/\bcbd\b|canabidiol|cannabidiol|cannabinoid|canabinoide/i.test(content)) return false;
  if (/ansiedade|anxiety|p[aâ]nico/i.test(question) && !/ansiedade|anxiety|anxious|anxiolytic|panic/i.test(content)) return false;
  return true;
}

export function requestsRandomizedTrial(question: string): boolean {
  return /randomiz|randomis|aleatoriz|\brct\b/i.test(question);
}

export function matchesRequestedEvidence(article: { title: string; abstract: string; publicationTypes?: string[] }, question: string): boolean {
  if (!matchesCitationTopic(article, question)) return false;
  // Do not infer an RCT from a generic "clinical trial" or a review mentioning RCTs.
  return !requestsRandomizedTrial(question) || (article.publicationTypes || []).some(type => /^randomi[sz]ed controlled trial$/i.test(type));
}