require('dotenv').config();
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const fs = require('fs');
const path = require('path');

const MASTER_LIST_PATH = path.join(__dirname, 'prescritores_master_list.json');

const config = {
    imap: {
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
        host: 'imap.hostinger.com',
        port: 993,
        tls: true,
        authTimeout: 30000
    }
};

async function run() {
    if (!fs.existsSync(MASTER_LIST_PATH)) {
        console.log("Lista não encontrada.");
        return;
    }
    
    let contacts = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf8'));
    let emailsToSearch = new Set(contacts.map(c => c.email ? c.email.toLowerCase() : '').filter(e => e));
    
    console.log(`Conectando ao IMAP (${process.env.SMTP_USER})...`);
    let connection;
    try {
        connection = await imaps.connect(config);
    } catch(err) {
        console.error("Erro ao conectar IMAP:", err.message);
        return;
    }

    let bouncedEmails = new Set();
    let emailsToDelete = [];

    await connection.openBox('INBOX');
    const searchCriteria = [['FROM', 'mailer-daemon']];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    
    console.log("Buscando retornos na Caixa de Entrada...");
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    for (let item of messages) {
        let part = item.parts.find(p => p.which === 'TEXT');
        if (part && part.body) {
            let bodyStr = typeof part.body === 'string' ? part.body : part.body.toString('utf8');
            
            // Tenta encontrar e-mails no corpo da mensagem que correspondam aos que tentamos enviar
            let foundMatch = false;
            for (let email of emailsToSearch) {
                if (bodyStr.toLowerCase().includes(email)) {
                    bouncedEmails.add(email);
                    emailsToDelete.push(item.attributes.uid);
                    foundMatch = true;
                }
            }
        }
    }
    
    // Tenta também procurar na lixeira/Spam (opcional, dependendo do Hostinger)
    try {
        await connection.openBox('Spam');
        const spamMsgs = await connection.search(searchCriteria, fetchOptions);
        for (let item of spamMsgs) {
            let part = item.parts.find(p => p.which === 'TEXT');
            if (part && part.body) {
                let bodyStr = part.body.toString('utf8');
                for (let email of emailsToSearch) {
                    if (bodyStr.toLowerCase().includes(email)) {
                        bouncedEmails.add(email);
                    }
                }
            }
        }
    } catch(e) {} // Ignora se a pasta não existir

    console.log(`Encontrados ${bouncedEmails.size} e-mails únicos que deram erro.`);
    
    let deletedCount = 0;
    let cleanedCount = 0;
    
    // Atualizar a lista mestre
    let novaLista = [];
    
    for (let c of contacts) {
        let cEmail = c.email ? c.email.toLowerCase() : '';
        
        if (bouncedEmails.has(cEmail)) {
            let hasPhone = c.phone || c.telefone_raw;
            if (hasPhone) {
                // Tem whatsapp, limpa apenas o email inválido
                c.email = "";
                novaLista.push(c);
                cleanedCount++;
                console.log(`⚠️ Limpo (E-mail apagado, WPP mantido): ${c.nome} - WPP: ${c.phone}`);
            } else {
                // Não tem whatsapp, joga fora o contato inteiro
                deletedCount++;
                console.log(`❌ Deletado (Sem WPP e Email Falhou): ${c.nome} - E-mail: ${cEmail}`);
            }
        } else {
            // Mantém na lista
            novaLista.push(c);
        }
    }
    
    // Deletar as mensagens de erro da caixa de entrada
    if (emailsToDelete.length > 0) {
        await connection.openBox('INBOX');
        await connection.addFlags(emailsToDelete, '\\Deleted');
        console.log(`Lixeira/Caixa de Entrada limpa (mensagens de erro excluídas).`);
    }

    connection.end();
    
    // Salvar a nova lista
    fs.writeFileSync(MASTER_LIST_PATH, JSON.stringify(novaLista, null, 2));
    
    console.log(`\n================================`);
    console.log(`📋 RELATÓRIO DE LIMPEZA DA LISTA`);
    console.log(`Tamanho anterior: ${contacts.length}`);
    console.log(`Contatos Excluídos Totalmente: ${deletedCount}`);
    console.log(`Contatos Preservados (apenas E-mail apagado): ${cleanedCount}`);
    console.log(`Tamanho atual da lista Limpa: ${novaLista.length}`);
    console.log(`================================\n`);
}

run();
