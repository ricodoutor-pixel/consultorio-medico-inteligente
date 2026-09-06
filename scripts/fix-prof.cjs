const fs = require('fs');
let content = fs.readFileSync('src/data/professionals.ts', 'utf8');

const replacement = `import drJoseGeraldoImg from "@/assets/dr-jose-geraldo.jpg";
import cfmJoseGeraldo from "@/assets/cfm_prints/dr-jose-geraldo.png";

export type Professional = {
  id: string;
  name: string;
  category: string;
  bio: string;
  experience: string;
  tags: string[];
  price: string;
  priceValue: number;
  whatsapp: string;
  rating: number;
  consults: number;
  avatar: string;
  imageUrl: string;
  paymentLink: string;
  services: { name: string; price: string; desc: string }[];
  slots: string[];
  reviews: { name: string; rating: number; text: string }[];
  online?: boolean;
  /** ID real na tabela doctors (quando o profissional vem do banco). */
  dbId?: string;
  /** Valor da Consulta Premium definido pelo profissional. */
  premiumPrice?: number;
  crm?: string;
  hospital?: string;
  flags?: string[];
  plan_tier?: string;
}

export const COUNCIL_CONFIG: Record<string, {`;

content = content.replace(/import drJoseGeraldoImg from "@\/assets\/dr-jose-geraldo\.jpg";\s+avatar: string;.*?export const COUNCIL_CONFIG: Record<string, {/s, replacement);

fs.writeFileSync('src/data/professionals.ts', content, 'utf8');
console.log('Fixed professionals.ts');
