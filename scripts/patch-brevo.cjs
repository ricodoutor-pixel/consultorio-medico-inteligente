const fs = require('fs');

function patchBrisa() {
  const path = 'src/components/BrisaChatModal.tsx';
  let c = fs.readFileSync(path, 'utf8');
  if (!c.includes('brevo-sync')) {
    c = c.replace('} catch (e) {', `
      // Sync with Brevo
      supabase.functions.invoke('brevo-sync', {
        body: { nome: finalData.name, email: finalData.email, telefone: finalData.phone, categoria: category, origem: 'brisa_chat_onboarding' }
      }).catch(e => console.error('Brevo sync failed:', e));
    } catch (e) {`);
    fs.writeFileSync(path, c);
    console.log('BrisaChatModal patched');
  }
}

function patchLeadCapture() {
  const path = 'src/components/LeadCaptureModal.tsx';
  let c = fs.readFileSync(path, 'utf8');
  if (!c.includes('brevo-sync')) {
    c = c.replace('// 🚀 Dispara convite automático WhatsApp', `
      // Sync with Brevo
      supabase.functions.invoke('brevo-sync', {
        body: { nome: nome.trim(), email: email.trim() || null, telefone: phoneDigits, categoria: categoria || null, tags: allTags, origem }
      }).catch(e => console.error('Brevo sync failed:', e));

      // 🚀 Dispara convite automático WhatsApp`);
    fs.writeFileSync(path, c);
    console.log('LeadCaptureModal patched');
  }
}

function patchWhatsAppButton() {
  const path = 'src/components/WhatsAppButton.tsx';
  let c = fs.readFileSync(path, 'utf8');
  if (!c.includes('brevo-sync')) {
    c = c.replace('await supabase.from("leads_contatos").insert({', `
        // Sync with Brevo
        supabase.functions.invoke('brevo-sync', {
          body: { nome, telefone, email: "", origem: 'whatsapp_button', tags: ["whatsapp_rapido"] }
        }).catch(e => console.error('Brevo sync failed:', e));
        
        await supabase.from("leads_contatos").insert({`);
    fs.writeFileSync(path, c);
    console.log('WhatsAppButton patched');
  }
}

patchBrisa();
patchLeadCapture();
patchWhatsAppButton();
