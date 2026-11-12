/** CID-10 oficial (DATASUS, versão 2008) servido em /data/cid10.json e carregado sob demanda. */
export type Cid10Item = [code: string, description: string];

let cache: Promise<Cid10Item[]> | null = null;

export function loadCid10(): Promise<Cid10Item[]> {
  if (!cache) {
    cache = fetch("/data/cid10.json")
      .then((r) => {
        if (!r.ok) throw new Error(`CID-10 indisponível (${r.status})`);
        return r.json() as Promise<{ itens: Cid10Item[] }>;
      })
      .then((d) => d.itens)
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export function normalizeCidText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Busca por código (ex.: "g43", "G43.9", "f411") ou por palavras da descrição, sem acento. */
export function searchCid10(items: Cid10Item[], query: string, limit = 20): Cid10Item[] {
  const q = normalizeCidText(query);
  if (q.length < 2) return [];
  const codeQuery = q.replace(/[.\s]/g, "");
  const looksLikeCode = /^[a-z]\d{0,3}$/.test(codeQuery);
  const words = q.split(/\s+/).filter(Boolean);
  const codeHits: Cid10Item[] = [];
  const textHits: Cid10Item[] = [];
  for (const item of items) {
    const code = item[0].toLowerCase().replace(".", "");
    if (looksLikeCode && code.startsWith(codeQuery)) {
      codeHits.push(item);
    } else if (!looksLikeCode || codeQuery.length === 1) {
      const desc = normalizeCidText(item[1]);
      if (words.every((w) => desc.includes(w))) textHits.push(item);
    }
    if (codeHits.length >= limit) break;
  }
  return [...codeHits, ...textHits].slice(0, limit);
}

export function formatCid(item: Cid10Item): string {
  return `${item[0]} - ${item[1]}`;
}
