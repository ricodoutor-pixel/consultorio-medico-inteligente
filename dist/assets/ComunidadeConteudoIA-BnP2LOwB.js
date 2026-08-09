var u=Object.defineProperty;var i=(a,o)=>u(a,"name",{value:o,configurable:!0});import{r as h,j as e}from"./vendor-CwWG2DsU.js";import{N as b}from"./Navbar-BC6n9NfV.js";import{b as f,c as n,I as v,C as r,a as t,f as d,g as l,h as c,B as m}from"./index-e-zpNX-K.js";import{r as j,B as N,y as p,O as y,f as C,F as w}from"./lucide-DB91BVKT.js";import"./date-fns-u34-iOv_.js";import"./ui-primitives-ChqdtZcu.js";import"./GlobalComplianceBadge-Ce2ON6S3.js";import"./dropdown-menu-gC2aZfl7.js";import"./pdf-excel-CVkfPfHA.js";import"./i18n-BUP1JwQ6.js";import"./supabase-CgO4_n1X.js";import"./animation-DWmyuYPV.js";function S(a){const o=document.createElement("div");o.id="print-container",o.innerHTML=`
    <style>
      @media screen {
        #print-container { display: none; }
      }
      @media print {
        @page { margin: 2cm; }
        body { font-family: 'Inter', sans-serif; color: #111; }
        h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 20px; font-size: 18px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: 900; color: #10b981; }
        .content { line-height: 1.6; }
        .card { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
        .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
      }
    </style>
    
    <div class="header">
      <div>
        <div class="logo">Planta y Raíz</div>
        <div>Medicina Canabinoide Avançada</div>
      </div>
      <div style="text-align: right;">
        <div><strong>Paciente:</strong> ${a.patientName}</div>
        <div><strong>Médico:</strong> ${a.doctorName}</div>
        <div><strong>Data:</strong> ${a.date}</div>
      </div>
    </div>

    <h1>Guia Pessoal de Tratamento</h1>
    
    <div class="content">
      <p>Este guia foi gerado exclusivamente para você pela Brisa IA para auxiliar na sua adaptação ao tratamento.</p>

      <h2>💊 Seus Produtos</h2>
      <div class="card">
        <ul>
          ${a.products.map(s=>`<li><strong>${s}</strong></li>`).join("")}
        </ul>
      </div>

      <h2>⚖️ Posologia e Titulação (Start Low, Go Slow)</h2>
      <div class="card">
        <p>${a.posology.replace(/\n/g,"<br/>")}</p>
      </div>

      <h2>🌿 Orientações de Ouro</h2>
      <div class="card">
        <ul>
          ${a.generalGuidelines.map(s=>`<li>${s}</li>`).join("")}
        </ul>
      </div>
    </div>

    <div class="footer">
      Documento auxiliar educativo. Sempre siga a receita médica original e acompanhe sua titulação no Dashboard.
    </div>
  `,document.body.appendChild(o),window.print(),setTimeout(()=>{document.body.contains(o)&&document.body.removeChild(o)},1e3)}i(S,"generateEducationalPDF");function L(){const{toast:a}=f(),[o,s]=h.useState(!1),x=i(()=>{S({patientName:"João Silva",doctorName:"Dr. Edilson",date:new Date().toLocaleDateString("pt-BR"),products:["Óleo CBD Full Spectrum 3000mg","Gummies de THC 5mg"],posology:`Semana 1: 2 gotas à noite antes de dormir.
Semana 2: 3 gotas à noite, 1 gota pela manhã se necessário.`,generalGuidelines:["Mantenha o frasco em local fresco e longe da luz.","Pingue embaixo da língua e aguarde 1 minuto antes de engolir.","Não interrompa outros medicamentos sem aviso prévio."]}),a({title:"PDF Gerado!",description:"O guia foi preparado para impressão/download."})},"handleGeneratePdf"),g=i(()=>{s(!0),setTimeout(()=>{s(!1),a({title:"Artigo Criado com Sucesso!",description:"O caso anônimo foi convertido em um post de blog otimizado para SEO."})},2e3)},"handleCreateArticle");return e.jsxs("div",{className:"min-h-dvh bg-background flex flex-col",children:[e.jsx(b,{}),e.jsxs("div",{className:"flex-1 container mx-auto py-8 px-4 space-y-8 pt-24",children:[e.jsxs("div",{className:"text-center max-w-2xl mx-auto mb-12",children:[e.jsx(n,{className:"bg-primary/20 text-primary mb-4 border-primary/30",children:"Educação Canabinoide"}),e.jsx("h1",{className:"text-4xl md:text-5xl font-display font-black text-foreground mb-4",children:"Biblioteca Científica & SEO"}),e.jsx("p",{className:"text-muted-foreground text-lg",children:"Explore nossos guias e artigos. Se você é médico parceiro, converta seus casos clínicos de sucesso em conteúdo indexável com 1 clique (powered by Brisa IA)."})]}),e.jsxs("div",{className:"max-w-xl mx-auto relative mb-12",children:[e.jsx(j,{className:"absolute left-3 top-3 h-5 w-5 text-muted-foreground"}),e.jsx(v,{placeholder:"Buscar artigos, estudos ou FAQs...",className:"pl-10 h-12 rounded-full border-border/50 bg-card"})]}),e.jsxs("div",{className:"grid lg:grid-cols-3 gap-8",children:[e.jsxs("div",{className:"lg:col-span-2 space-y-6",children:[e.jsxs("h2",{className:"text-2xl font-bold flex items-center gap-2",children:[e.jsx(N,{className:"text-primary"})," Artigos em Destaque"]}),e.jsx(r,{className:"hover:border-primary/50 transition-colors cursor-pointer group",children:e.jsxs(t,{className:"p-6",children:[e.jsx(n,{variant:"outline",className:"mb-3",children:"Ansiedade & Sono"}),e.jsx("h3",{className:"text-xl font-bold group-hover:text-primary transition-colors",children:"Como o CBD interage com receptores de serotonina no combate à ansiedade"}),e.jsx("p",{className:"text-muted-foreground mt-2 text-sm line-clamp-2",children:"Um mergulho técnico, porém acessível, sobre a farmacodinâmica do Canabidiol e seu potencial como ansiolítico natural."}),e.jsxs("div",{className:"flex items-center gap-2 text-primary font-bold text-sm mt-4",children:["Ler Artigo ",e.jsx(p,{size:14})]})]})}),e.jsx(r,{className:"hover:border-primary/50 transition-colors cursor-pointer group",children:e.jsxs(t,{className:"p-6",children:[e.jsx(n,{variant:"outline",className:"mb-3",children:"Titulação"}),e.jsx("h3",{className:"text-xl font-bold group-hover:text-primary transition-colors",children:"Start Low, Go Slow: O Guia Definitivo de Dosagem"}),e.jsx("p",{className:"text-muted-foreground mt-2 text-sm line-clamp-2",children:"Por que a microdosagem é tão importante na adaptação do Sistema Endocanabinoide durante os primeiros 30 dias."}),e.jsxs("div",{className:"flex items-center gap-2 text-primary font-bold text-sm mt-4",children:["Ler Artigo ",e.jsx(p,{size:14})]})]})})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs(r,{className:"border-border bg-card/50",children:[e.jsxs(d,{children:[e.jsxs(l,{className:"flex items-center gap-2 text-lg",children:[e.jsx(y,{className:"text-primary h-5 w-5"}),"Meu Guia em PDF"]}),e.jsx(c,{children:"Baixe as orientações da sua última consulta diagramadas em alta qualidade."})]}),e.jsx(t,{children:e.jsx(m,{className:"w-full font-bold shadow-lg",onClick:x,children:"Gerar e Baixar PDF"})})]}),e.jsxs(r,{className:"border-indigo-500/30 bg-indigo-500/5",children:[e.jsxs(d,{children:[e.jsxs(l,{className:"flex items-center gap-2 text-lg text-indigo-500",children:[e.jsx(C,{className:"h-5 w-5"}),"IA SEO Creator (Médicos)"]}),e.jsx(c,{children:"Converta o relato do seu último paciente em um post de blog otimizado para o Google em 5 segundos."})]}),e.jsxs(t,{children:[e.jsxs("div",{className:"p-3 bg-background rounded-lg border border-border mb-4 text-xs font-mono text-muted-foreground",children:[e.jsx(w,{size:12,className:"inline mr-1"}),"Caso Clínico #3944 (Anônimo) carregado na memória."]}),e.jsx(m,{variant:"outline",className:"w-full font-bold border-indigo-500/50 text-indigo-500 hover:bg-indigo-500 hover:text-white",onClick:g,disabled:o,children:o?"Gerando Artigo (IA)...":"Transformar em Artigo SEO"})]})]})]})]})]})]})}i(L,"ComunidadeConteudoIA");export{L as default};
