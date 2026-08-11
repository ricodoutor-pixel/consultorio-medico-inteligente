# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fed447b0-f55f-4fd2-96f2-f6a4d65e5be4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fed447b0-f55f-4fd2-96f2-f6a4d65e5be4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fed447b0-f55f-4fd2-96f2-f6a4d65e5be4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## ⚠️ Notas de Operação: Bot da Enfermeira Brisa (WAHA)

O bot da Enfermeira Brisa utiliza o WAHA (WhatsApp HTTP API) para comunicação. 

**Suporte a Contas WhatsApp Business:**
Se você for conectar um número de WhatsApp Business e o bot parar de receber mensagens ou falhar ao enviar:
1. Acesse o servidor onde o WAHA está hospedado (ex: Railway, VPS, Docker local).
2. Altere (ou adicione) a variável de ambiente:
   `WHATSAPP_DEFAULT_ENGINE=NOWEB`
3. Reinicie o contêiner do WAHA.
O motor `WEBJS` (padrão) possui limitações com contas comerciais. O `NOWEB` utiliza uma arquitetura baseada em WebSocket que é totalmente compatível.

## 🚀 Motor Autônomo de Growth & CRM (Deploy)

Para rodar o motor autônomo (scraper + WhatsApp CRM) em segundo plano utilizando o **PM2**, siga as instruções:

1. Instale o PM2 globalmente (se não possuir):
   ```bash
   npm install -g pm2
   ```

2. Certifique-se de configurar seu arquivo `.env` com as chaves corretas do Supabase, WAHA_API_URL, e GEMINI_API_KEY.

3. Importe a carga inicial de leads:
   ```bash
   node src/seed-initial-leads.mjs
   ```

4. Inicie o Motor Autônomo com o PM2:
   ```bash
   pm2 start src/autonomous-growth-engine.mjs --name "planta-growth-engine"
   ```

5. Comandos úteis do PM2:
   - Visualizar logs: `pm2 logs planta-growth-engine`
   - Parar o motor: `pm2 stop planta-growth-engine`
   - Reiniciar: `pm2 restart planta-growth-engine`
   - Salvar processos para reiniciar no boot: `pm2 save`
