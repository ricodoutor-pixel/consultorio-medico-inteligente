/**
 * scripts/test_orientation_items_1_to_4.ts
 * 
 * Executa testes rigorosos dos 4 itens auditados da Orientação Técnica.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeReportAddress } from '../supabase/functions/_shared/orientation-report-language';
import { formatCheckedAtPtBR, type PubMedArticle } from '../supabase/functions/_shared/pubmed-live';
import {
  extractStudyPopulationAndOutcome,
  applyCitationVerification,
  type PmidLookup,
} from '../supabase/functions/_shared/pmid-verify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🧪 [TESTES DE ACEITAÇÃO] Iniciando bateria dos 4 itens auditados...\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [PASSOU] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FALHOU] ${name}`);
    console.error(err);
    failed++;
  }
}

// =========================================================================
// ITEM 1: Recebedor na tela do Pix e retorno do provedor
// =========================================================================
test('Item 1: mp-checkout retorna receiver_name "Planta y Raiz Ltda"', () => {
  const mpCheckoutCode = fs.readFileSync(path.join(ROOT_DIR, 'supabase', 'functions', 'mp-checkout', 'index.ts'), 'utf8');
  assert(mpCheckoutCode.includes('receiver_name: "Planta y Raiz Ltda"'), 'mp-checkout deve retornar receiver_name Planta y Raiz Ltda');
});

test('Item 1: OrientacaoTecnicaAgente exibe "Recebedor: Planta y Raiz Ltda"', () => {
  const otCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'OrientacaoTecnicaAgente.tsx'), 'utf8');
  assert(otCode.includes('Recebedor: <strong>{pixData.receiver_name || "Planta y Raiz Ltda"}</strong>'), 'Tela Pix deve exibir Recebedor: Planta y Raiz Ltda');
  assert(!otCode.includes('Recebedor: Doutor Rico Ltda'), 'Não pode conter Doutor Rico Ltda fixo');
});

test('Item 1: Telemedicina e checkout exibem "Recebedor: Planta y Raiz Ltda"', () => {
  const teleCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Telemedicina.tsx'), 'utf8');
  assert(teleCode.includes('Recebedor: <strong>{consultPix.receiver_name || "Planta y Raiz Ltda"}</strong>'), 'Telemedicina Pix deve exibir Recebedor: Planta y Raiz Ltda');
});

test('Item 1: OrientacaoTecnicaAgente suporta sku de URL (ex: consulta_chat R$ 100, consulta_video R$ 150)', () => {
  const otCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'OrientacaoTecnicaAgente.tsx'), 'utf8');
  assert(otCode.includes('const requestedSku = searchParams.get("sku") || "orientacao_tecnica";'), 'Deve ler sku da URL');
  assert(otCode.includes('<h2>Pagamento Pix — R$ {Number(pixData?.amount || 30).toFixed(2).replace(\'.\', \',\')}</h2>'), 'Título deve formatar o valor real');
});

// =========================================================================
// ITEM 2: Resposta de estudos (data em pt-BR SP, população/desfecho, TAG notice e sem promessa sem lista)
// =========================================================================
test('Item 2: formatCheckedAtPtBR gera data sem T e Z em horário de São Paulo', () => {
  const dateStr = formatCheckedAtPtBR(new Date('2026-11-09T14:19:34.124Z'));
  assert(dateStr.includes('09/11/2026'), 'Deve conter data formatada');
  assert(dateStr.includes('(horário de São Paulo)'), 'Deve conter identificação do fuso de São Paulo');
  assert(!dateStr.includes('T'), 'Não pode conter caractere T ISO');
  assert(!dateStr.includes('Z'), 'Não pode conter caractere Z ISO');
});

test('Item 2: extractStudyPopulationAndOutcome extrai população e desfecho fielmente', () => {
  const article: PubMedArticle = {
    pmid: '21307846',
    title: 'Neural basis of anxiolytic effects of cannabidiol (CBD) in generalized Social Anxiety Disorder',
    authors: 'Crippa JA et al.',
    firstAuthor: 'Crippa JA',
    journal: 'J Psychopharmacol',
    year: 2011,
    url: 'https://pubmed.ncbi.nlm.nih.gov/21307846/',
    doi: null,
    abstract: 'Patients with social anxiety disorder were evaluated with SPECT neuroimaging to measure regional cerebral blood flow and visual analogue mood scale (VAMS) anxiety scores.',
    publicationTypes: ['Randomized Controlled Trial'],
  };
  const popOutcome = extractStudyPopulationAndOutcome(article);
  assert(popOutcome.includes('transtorno de ansiedade social'), 'População deve ser identificada');
  assert(popOutcome.includes('fluxo sanguíneo cerebral regional'), 'Desfecho deve ser identificado');
});

test('Item 2: applyCitationVerification remove frase que promete lista sem lista', () => {
  const sampleArticle: PubMedArticle = {
    pmid: '21307846',
    title: 'Cannabidiol in Social Anxiety Disorder',
    authors: 'Crippa JA',
    firstAuthor: 'Crippa JA',
    journal: 'J Psychopharmacol',
    year: 2011,
    url: 'https://pubmed.ncbi.nlm.nih.gov/21307846/',
    doi: null,
    abstract: 'Patients with social anxiety disorder',
    publicationTypes: ['Randomized Controlled Trial'],
  };
  const lookup: PmidLookup = {
    status: 'ok',
    found: new Map([['21307846', sampleArticle]]),
    missing: [],
  };
  const input = 'Sobre a eficácia do canabidiol, destaco os seguintes ensaios:\n\nEstudo de Crippa et al. PMID 21307846 demonstrou efeito.';
  const q = 'Quais ensaios clínicos randomizados avaliaram canabidiol em transtorno de ansiedade?';
  const out = applyCitationVerification(input, lookup, new Set(), q);

  assert(!out.includes('destaco os seguintes ensaios:'), 'Não pode deixar frase introdutória solta sem itens');
  assert(out.includes('• PMID 21307846'), 'Deve incluir a referência PubMed conferida');
  assert(out.includes('População e desfecho:'), 'Deve incluir linha de população e desfecho');
  assert(out.includes('nenhum destes ensaios clínicos é específico de Transtorno de Ansiedade Generalizada (TAG)'), 'Deve alertar que nenhum é de TAG');
});

// =========================================================================
// ITEM 3: Botão "Gerar relatório" sempre visível no fechamento sem F5
// =========================================================================
test('Item 3: ratingPanelRef em OrientacaoTecnicaAgente inclui bloco Relatório individual permanente com todos os estados', () => {
  const otCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'OrientacaoTecnicaAgente.tsx'), 'utf8');
  assert(otCode.includes('Relatório individual'), 'Deve conter cabeçalho do Relatório individual');
  assert(otCode.includes('Baixar relatório / Baixar PDF'), 'Deve conter botão Baixar relatório / Baixar PDF');
  assert(otCode.includes('Gerando seu relatório…'), 'Deve conter estado de geração com segundos');
  assert(otCode.includes('Gerar relatório'), 'Deve conter botão Gerar relatório');
  assert(otCode.includes('Tentar de novo'), 'Deve conter botão Tentar de novo em caso de erro');
});

// =========================================================================
// ITEM 4: Erro "alteração de coagulaçãvocê" e regexes Unicode
// =========================================================================
test('Item 4: normalizeReportAddress NÃO corta "o" de "coagulação"', () => {
  const res = normalizeReportAddress('Caso ocorra alteração de coagulação você orienta a suspensão?');
  assert.strictEqual(res, 'Caso ocorra alteração de coagulação você orienta a suspensão?');
});

test('Item 4: normalizeReportAddress preserva outras palavras em "ão" antes de "você"', () => {
  assert.strictEqual(normalizeReportAddress('Com muita atenção você avalia o paciente.'), 'Com muita atenção você avalia o paciente.');
  assert.strictEqual(normalizeReportAddress('Sob esta condição você recomenda o ajuste.'), 'Sob esta condição você recomenda o ajuste.');
  assert.strictEqual(normalizeReportAddress('Durante a prescrição você define a dose.'), 'Durante a prescrição você define a dose.');
});

test('Item 4: normalizeReportAddress normaliza "o você/a você" e "o senhor"', () => {
  assert.strictEqual(normalizeReportAddress('Quais alternativas o você/a você recomenda?'), 'Quais alternativas você recomenda?');
  assert.strictEqual(normalizeReportAddress('O senhor recomenda a continuidade?'), 'você recomenda a continuidade?');
  assert.strictEqual(normalizeReportAddress('A senhora orienta o uso?'), 'você orienta o uso?');
});

test('Item 4 safeguard: separa palavras grudadas por acidente em "você"', () => {
  const welded = 'Caso ocorra alteração de coagulaçãvocê orienta';
  const fixed = normalizeReportAddress(welded);
  assert.strictEqual(fixed, 'Caso ocorra alteração de coagulaçã você orienta');
});

console.log(`\n===========================================`);
console.log(`BATERIA DE TESTES CONCLUÍDA: ${passed} PASSARAM, ${failed} FALHARAM`);
console.log(`===========================================`);

if (failed > 0) {
  process.exit(1);
}
