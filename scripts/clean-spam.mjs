import * as tls from 'tls';
import * as dotenv from 'dotenv';

dotenv.config();

const IMAP_HOST = 'imap.hostinger.com';
const IMAP_PORT = 993;
const USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const PASS = process.env.SMTP_PASS || '95654045Pa#';

async function cleanFolders() {
  console.log(`🔌 Conectando via IMAP TLS para limpeza da pasta Spam / Lixo...`);

  return new Promise((resolve, reject) => {
    const socket = tls.connect(IMAP_PORT, IMAP_HOST, { rejectUnauthorized: false }, () => {});

    socket.setEncoding('utf-8');

    let buffer = '';
    const foldersToClean = ['Junk', 'Spam', 'Trash', 'INBOX.Junk', 'INBOX.Spam', 'INBOX.Trash'];
    let currentFolderIndex = 0;

    socket.on('data', (data) => {
      buffer += data;
      console.log('IMAP In:', data.trim());

      if (buffer.includes('* OK') && !buffer.includes('A1 OK')) {
        buffer = '';
        console.log('🔑 Autenticando...');
        socket.write(`A1 LOGIN "${USER}" "${PASS}"\r\n`);
      } else if (buffer.includes('A1 OK')) {
        buffer = '';
        cleanNextFolder();
      } else if (buffer.includes('SELECT_DONE')) {
        buffer = '';
        socket.write(`A3 STORE 1:* +FLAGS (\\Deleted)\r\n`);
      } else if (buffer.includes('A3 OK') || buffer.includes('A3 NO') || buffer.includes('A3 BAD')) {
        buffer = '';
        socket.write(`A4 EXPUNGE\r\n`);
      } else if (buffer.includes('A4 OK') || buffer.includes('A4 NO') || buffer.includes('A4 BAD')) {
        buffer = '';
        currentFolderIndex++;
        cleanNextFolder();
      } else if (buffer.includes('ALL_DONE')) {
        socket.write(`A5 LOGOUT\r\n`);
        socket.end();
        resolve(true);
      }
    });

    function cleanNextFolder() {
      if (currentFolderIndex >= foldersToClean.length) {
        console.log('🎉 Limpeza de todas as pastas de Spam e Lixeira concluída!');
        socket.write(`A5 LOGOUT\r\nSELECT_DONE ALL_DONE`);
        return;
      }

      const folder = foldersToClean[currentFolderIndex];
      console.log(`📂 Limpando pasta: ${folder}...`);
      socket.write(`A2 SELECT "${folder}"\r\nSELECT_DONE\r\n`);
    }

    socket.on('error', (err) => {
      console.error('❌ Erro IMAP:', err.message);
      reject(err);
    });
  });
}

cleanFolders().catch(() => {});
