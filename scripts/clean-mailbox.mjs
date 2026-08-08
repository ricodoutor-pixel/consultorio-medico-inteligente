import * as tls from 'tls';
import * as dotenv from 'dotenv';

dotenv.config();

const IMAP_HOST = 'imap.hostinger.com';
const IMAP_PORT = 993;
const USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const PASS = process.env.SMTP_PASS || '95654045Pa#';

async function cleanMailbox() {
  console.log(`🔌 Conectando via IMAP TLS em ${IMAP_HOST}:${IMAP_PORT} para a conta ${USER}...`);

  return new Promise((resolve, reject) => {
    const socket = tls.connect(IMAP_PORT, IMAP_HOST, { rejectUnauthorized: false }, () => {
      console.log('✅ Conexão SSL/TLS estabelecida com sucesso.');
    });

    socket.setEncoding('utf-8');

    let step = 0;
    let buffer = '';

    socket.on('data', (data) => {
      buffer += data;
      console.log('IMAP In:', data.trim());

      if (step === 0 && buffer.includes('* OK')) {
        step = 1;
        buffer = '';
        console.log('🔑 Efetuando LOGIN...');
        socket.write(`A1 LOGIN "${USER}" "${PASS}"\r\n`);
      } else if (step === 1 && buffer.includes('A1 OK')) {
        step = 2;
        buffer = '';
        console.log('📂 Selecionando caixa de entrada (INBOX)...');
        socket.write(`A2 SELECT INBOX\r\n`);
      } else if (step === 2 && buffer.includes('A2 OK')) {
        step = 3;
        buffer = '';
        console.log('🧹 Marcando todos os e-mails antigos para exclusão (STORE 1:* +FLAGS \\Deleted)...');
        socket.write(`A3 STORE 1:* +FLAGS (\\Deleted)\r\n`);
      } else if (step === 3 && (buffer.includes('A3 OK') || buffer.includes('A3 NO') || buffer.includes('A3 BAD'))) {
        step = 4;
        buffer = '';
        console.log('🗑️ Executando limpeza permanente (EXPUNGE)...');
        socket.write(`A4 EXPUNGE\r\n`);
      } else if (step === 4 && (buffer.includes('A4 OK') || buffer.includes('A4 NO') || buffer.includes('A4 BAD'))) {
        step = 5;
        buffer = '';
        console.log('👋 Encerrando sessão IMAP (LOGOUT)...');
        socket.write(`A5 LOGOUT\r\n`);
      } else if (step === 5 && buffer.includes('A5 OK')) {
        console.log('🎉 Caixa de Entrada limpa e higienizada com sucesso!');
        socket.end();
        resolve(true);
      }
    });

    socket.on('error', (err) => {
      console.error('❌ Erro IMAP:', err.message);
      reject(err);
    });

    socket.on('end', () => {
      console.log('🔌 Conexão encerrada.');
    });
  });
}

cleanMailbox().catch(() => {});
