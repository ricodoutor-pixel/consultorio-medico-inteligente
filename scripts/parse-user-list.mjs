import * as fs from 'fs';
import * as path from 'path';

const transcriptPath = `C:\\Users\\ricod\\.gemini\\antigravity\\brain\\f80a569b-8eec-4609-9c48-09637e2e828b\\.system_generated\\logs\\transcript_full.jsonl`;

async function parseList() {
  console.log("📖 Lendo transcript_full.jsonl para extrair a lista completa de prescritores...");
  const content = fs.readFileSync(transcriptPath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);

  let lastUserText = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(lines[i]);
      if (obj.type === 'USER_INPUT' || obj.source === 'USER_EXPLICIT') {
        const text = typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content);
        if (text.includes('Ari da Silva Avelar') || text.includes('Especialidade:')) {
          lastUserText = text;
          break;
        }
      }
    } catch (e) {}
  }

  if (!lastUserText) {
    console.error("❌ Não foi possível encontrar o texto da lista no transcript_full.jsonl");
    process.exit(1);
  }

  console.log("🔍 Processando o texto da lista completa...");

  let raw = lastUserText.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  const textLines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  const prescribers = [];
  let current = {};

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];

    if (line.startsWith('Especialidade:')) {
      current.especialidade = line.replace('Especialidade:', '').trim();
    } else if (line.startsWith('Cidade:')) {
      current.cidade = line.replace('Cidade:', '').trim();
    } else if (line.startsWith('Estado:')) {
      current.estado = line.replace('Estado:', '').trim();
    } else if (line.startsWith('Email:')) {
      current.email = line.replace('Email:', '').trim();
    } else if (line.startsWith('Telefone:')) {
      const rawPhone = line.replace('Telefone:', '').trim();
      current.telefone_raw = rawPhone;

      const parts = rawPhone.split(/[\/\,\;]/);
      const phonesClean = [];
      for (const p of parts) {
        let digits = p.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 11) {
          digits = '55' + digits;
        }
        if (digits.length >= 10) {
          phonesClean.push(digits);
        }
      }
      current.phone = phonesClean[0] || '';
      current.all_phones = phonesClean;

      if (current.nome && (current.email || current.phone)) {
        prescribers.push({ ...current });
      }
      current = {};
    } else {
      if (!line.includes('Nome do Prescritor') && 
          !line.includes('Encontre um médico') && 
          !line.includes('HOME') && 
          !line.includes('CADASTRO') && 
          !line.includes('CONTATO') &&
          !line.includes('Nome de Registro:')) {
        if (!current.nome) {
          current.nome = line;
        }
      }
    }
  }

  const uniqueMap = new Map();
  for (const p of prescribers) {
    const key = p.email ? p.email.toLowerCase() : p.phone;
    if (key && !uniqueMap.has(key)) {
      uniqueMap.set(key, p);
    }
  }

  const resultList = Array.from(uniqueMap.values());

  console.log(`✅ Total de prescritores extraídos com sucesso: ${resultList.length}`);

  const targetFile = path.join(process.cwd(), 'scripts', 'prescritores_master_list.json');
  fs.writeFileSync(targetFile, JSON.stringify(resultList, null, 2), 'utf-8');
  console.log(`💾 Lista salva em: ${targetFile}`);
}

parseList();
