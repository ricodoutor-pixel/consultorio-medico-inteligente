// Catálogo oficial de merchandising do Club Planta y Raiz.
// Fonte de verdade server-side dos preços — o cliente nunca envia valores.
// IDs devem casar com `club_<id>` usados no front (src/pages/Club.tsx).
export const CLUB_CATALOG: Record<string, { name: string; price: number }> = {
  club_1: { name: 'Camiseta "Verdinho Explorer"', price: 89.90 },
  club_2: { name: 'Camiseta "Logo Roots Gradient"', price: 94.90 },
  club_3: { name: 'Camiseta "Cachoeira Relax"', price: 99.90 },
  club_4: { name: 'Camiseta "Noite nas Estrelas"', price: 104.90 },
  club_5: { name: 'Boné "Trucker Roots"', price: 79.90 },
  club_6: { name: 'Boné "Dad Hat Verdinho"', price: 74.90 },
  club_7: { name: 'Chapéu Bucket "Tropical Vibe"', price: 84.90 },
  club_8: { name: 'Viseira "Sol e Sal"', price: 69.90 },
  club_9: { name: 'Caneca "Aventura Matinal"', price: 49.90 },
  club_10: { name: 'Caneca Térmica "Gole de Natureza"', price: 129.90 },
};
