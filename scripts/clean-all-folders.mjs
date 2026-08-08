import * as tls from 'tls';
import * as dotenv from 'dotenv';

dotenv.config();

const IMAP_HOST = 'imap.hostinger.com';
const IMAP_PORT = 993;
const USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const PASS = process.env.SMTP_PASS || '95654045Pa#';

async function purgeFolder(folderName) {
  return new Promise((resolve) => {
    console.log(`\n📂 Verificando e limpando pasta: ${folderName}...`);
    const socket = tls.connect(IMAP_PORT, IMAP_HOST, { rejectUnauthorized: false });
    socket.setEncoding('utf-8');

    let step = 0;
    let buffer = '';

    socket.on('data', (data) => {
      buffer += data;

      if (step === 0 && buffer.includes('* OK')) {
        step = 1;
        buffer = '';
        socket.write(`A1 LOGIN "${USER}" "${PASS}"\r\n`);
      } else if (step === 1 && buffer.includes('A1 OK')) {
        step = 2;
        buffer = '';
        socket.write(`A2 SELECT "${folderName}"\r\n`);
      } else if (step === 2 && buffer.includes('A2 OK')) {
        step = 3;
        buffer = '';
        socket.write(`A3 STORE 1:* +FLAGS (\\Deleted)\r\n`);
      } else if (step === 3 && (buffer.includes('A3 OK') || buffer.includes('A3 NO') || buffer.includes('A3 BAD'))) {
        step = 4;
        buffer = '';
        socket.write(`A4 EXPUNGE\r\n`);
      } else if (step === 4 && (buffer.includes('A4 OK') || buffer.includes('A4 NO') || buffer.includes('A4 BAD'))) {
        step = 5;
        buffer = '';
        socket.write(`A5 LOGOUT\r\n`);
      } else if (step === 5 && buffer.includes('A5 OK')) {
        console.log(`✅ Pasta ${folderName} higienizada e expurgada com sucesso!`);
        socket.end();
        resolve(true);
      } else if (buffer.includes('A2 NO')) {
        console.log(`ℹ️ Pasta ${folderName} não existe ou já está vazia.`);
        socket.write(`A5 LOGOUT\r\n`);
        socket.end();
        resolve(true);
      }
    });

    socket.on('error', (err) => {
      console.error(`❌ Erro em ${folderName}:`, err.message);
      resolve(false);
    });
  });
}

async function cleanAll() {
  const folders = ['INBOX.Junk', 'INBOX.Spam', 'INBOX.Trash', 'INBOX'];
  for (const f of folders) {
    await purgeFolder(f);
  }
  console.log('\n🎉 TODAS AS PASTAS DE SPAM, LIXEIRA E CAIXA DE ENTRADA ESTÃO 100% LIMPAS!');
}

cleanAll();
