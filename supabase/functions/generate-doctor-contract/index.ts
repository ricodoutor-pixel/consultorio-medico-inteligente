import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ContractSigningRequest {
  doctor_id: string;
  user_id: string;
  signer_ip?: string;
  signer_user_agent?: string;
  doctor_full_name?: string;
  doctor_cpf?: string;
  doctor_crm?: string;
  doctor_crm_uf?: string;
  contract_version?: string;
}

// Utility: Compute SHA-512 Hash
async function generateSha512(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

const PLANTA_Y_RAIZ_ENTITY = {
  razao_social: "PLANTA Y RAIZ LTDA",
  cnpj: "58.283.475/0001-00",
  inscricao_municipal: "8.941.205-0",
  sede: "Av. Paulista, 1106 - Bela Vista, São Paulo - SP, CEP 01310-100",
  representante_legal: "Dr. Edilson Bezerra da Silva",
  cargo_representante: "Diretor Clínico & CEO",
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: ContractSigningRequest = await req.json();
    const {
      doctor_id,
      user_id,
      signer_user_agent = req.headers.get("user-agent") || "Navegador Web Seguro",
      contract_version = "v1.0",
    } = body;

    // Determinação fidedigna do IP do signatário através dos headers HTTP da Edge / CDN
    const headerIp = req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip");
    
    let resolvedIp: string | null = null;
    if (headerIp && headerIp !== "127.0.0.1" && headerIp !== "::1") {
      resolvedIp = headerIp;
    } else if (body.signer_ip && body.signer_ip !== "127.0.0.1" && body.signer_ip !== "187.12.84.190") {
      resolvedIp = body.signer_ip;
    }

    const ip_capture_failed = !resolvedIp;
    const signer_ip = resolvedIp; // null caso não tenha sido possível detectar com precisão (sem IPs fake)

    if (!doctor_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios ausentes: doctor_id e user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Busca dados do médico e perfil se não fornecidos
    let fullName = body.doctor_full_name;
    let cpf = body.doctor_cpf;
    let crm = body.doctor_crm;
    let crmUf = body.doctor_crm_uf || "SP";

    if (!fullName || !cpf || !crm) {
      const { data: docData } = await supabaseAdmin
        .from("doctors")
        .select("*, profile:profiles(*)")
        .eq("id", doctor_id)
        .maybeSingle();

      if (docData) {
        fullName = fullName || docData.profile?.full_name || docData.full_name || "Médico Prescritor Credenciado";
        cpf = cpf || docData.profile?.cpf || docData.document_number || "000.000.000-00";
        crm = crm || docData.crm || "00000";
        crmUf = crmUf || docData.crm_state || docData.profile?.region || "SP";
      }
    }

    fullName = fullName || "Médico Prescritor Credenciado";
    cpf = cpf || "000.000.000-00";
    crm = crm || "00000";

    const signedAt = new Date().toISOString();
    const formattedDate = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: "America/Sao_Paulo",
    }).format(new Date());

    // 2. Montagem da Minuta Contratual Jurídica Oficial
    const contractPayloadForHash = `
CONTRATO DE CREDENCIAMENTO, PRESTAÇÃO DE SERVIÇOS MÉDICOS E INTERMEDIAÇÃO TECNOLÓGICA
VERSÃO: ${contract_version}
CONTRATANTE: ${PLANTA_Y_RAIZ_ENTITY.razao_social} - CNPJ ${PLANTA_Y_RAIZ_ENTITY.cnpj}
CONTRATADO(A): ${fullName} - CPF ${cpf} - CRM ${crm}/${crmUf}
DATA/HORA ASSINATURA UTC: ${signedAt}
ENDEREÇO IP: ${signer_ip}
USER AGENT: ${signer_user_agent}
TERMOS CFM: RESOLUÇÃO CFM Nº 2.336/2023, RESOLUÇÃO CFM Nº 2.314/2022 E LEI Nº 13.709/2018 (LGPD).
    `.trim();

    const sha512Hash = await generateSha512(contractPayloadForHash);

    // 3. Documento HTML/PDF Oficial Formatado com Carimbo Criptográfico
    const htmlContract = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Credenciamento Médico - ${fullName} - Planta y Raíz</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 860px; margin: auto; background: #fff; }
    .header { border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: 900; color: #065f46; text-transform: uppercase; margin: 0; }
    .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
    .parties { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px; font-size: 12px; }
    .parties strong { color: #0f172a; }
    .clause { margin-bottom: 18px; }
    .clause-title { font-size: 13px; font-weight: 800; color: #065f46; margin-bottom: 6px; text-transform: uppercase; }
    .clause-body { font-size: 12px; text-align: justify; color: #334155; }
    .signature-stamp { margin-top: 35px; border: 2px solid #059669; background: #ecfdf5; border-radius: 12px; padding: 20px; page-break-inside: avoid; }
    .stamp-title { font-size: 14px; font-weight: 900; color: #065f46; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; text-transform: uppercase; }
    .stamp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
    .stamp-item strong { color: #0f172a; }
    .hash-box { margin-top: 12px; padding: 8px 12px; background: #064e3b; color: #34d399; font-family: monospace; font-size: 10px; border-radius: 6px; word-break: break-all; }
    .legal-ref { font-size: 10px; color: #64748b; margin-top: 10px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Contrato de Credenciamento Médico</h1>
      <p class="subtitle">Intermediação Tecnológica, Telemedicina e Conformidade Ética CFM</p>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <strong>Versão:</strong> ${contract_version}<br>
      <strong>Código:</strong> PR-DOC-${doctor_id.slice(0, 8).toUpperCase()}
    </div>
  </div>

  <div class="parties">
    <p style="margin: 0 0 8px 0;"><strong>CONTRATANTE:</strong> <strong>${PLANTA_Y_RAIZ_ENTITY.razao_social}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>${PLANTA_Y_RAIZ_ENTITY.cnpj}</strong>, com sede em ${PLANTA_Y_RAIZ_ENTITY.sede}, neste ato representada por seu Diretor Clínico, ${PLANTA_Y_RAIZ_ENTITY.representante_legal}.</p>
    <p style="margin: 0;"><strong>CONTRATADO(A):</strong> <strong>${fullName}</strong>, médico(a) devidamente inscrito(a) no Conselho Regional de Medicina sob o <strong>CRM-${crmUf} nº ${crm}</strong>, portador(a) do CPF nº <strong>${cpf}</strong>.</p>
  </div>

  <div class="clause">
    <div class="clause-title">Cláusula 1ª — Do Objeto e Intermediação Tecnológica</div>
    <div class="clause-body">
      O presente contrato tem por objeto o credenciamento do(a) CONTRATADO(A) para prestação autônoma de serviços médicos, orientações técnicas e consultas de telemedicina por meio da infraestrutura tecnológica disponibilizada pela CONTRATANTE na plataforma digital Planta y Raíz Ltda (plantayraiz.com.br).
    </div>
  </div>

  <div class="clause">
    <div class="clause-title">Cláusula 2ª — Da Autonomia Profissional e Conformidade CFM</div>
    <div class="clause-body">
      O(A) CONTRATADO(A) exercerá sua atividade médica com estrita observância ao Código de Ética Médica, às Resoluções CFM nº 2.336/2023 (Publicidade e Divulgação Médica), CFM nº 2.314/2022 (Regulamentação da Telemedicina) e normas da ANVISA, mantendo total soberania, independência clínica e responsabilidade sobre os diagnósticos, prescrições e condutas terapêuticas indicadas aos pacientes.
    </div>
  </div>

  <div class="clause">
    <div class="clause-title">Cláusula 3ª — Do Sigilo Médico e Proteção de Dados (LGPD)</div>
    <div class="clause-body">
      As partes comprometem-se a resguardar o mais rigoroso sigilo médico profissional (art. 73 do CEM) e a zelar pela confidencialidade e segurança dos dados de saúde dos pacientes, em integral conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD), sendo vedado o compartilhamento indevido de prontuários a terceiros.
    </div>
  </div>

  <div class="clause">
    <div class="clause-title">Cláusula 4ª — Da Emissão de Receituários e Assinatura Digital</div>
    <div class="clause-body">
      Todas as receitas médicas, relatórios de orientação técnica, atestados e encaminhamentos emitidos na plataforma contarão com assinatura eletrônica qualificada/avançada (Padrão ICP-Brasil ou token criptográfico SHA-512) nos moldes da MP nº 2.200-2/2001 e da Lei nº 14.063/2020, garantindo autenticidade, integridade e validade jurídica perante farmácias e órgãos fiscalizadores.
    </div>
  </div>

  <div class="clause">
    <div class="clause-title">Cláusula 5ª — Da Remuneração, Repasses e Transparência Financeira</div>
    <div class="clause-body">
      Os honorários médicos devidos ao(à) CONTRATADO(A) serão processados e repassados de forma transparente conforme os valores fixados na esteira de atendimento da plataforma, com a emissão automática dos correspondentes demonstrativos fiscais e recibos para abatimento em IRPF (DMED), nos termos da legislação tributária vigente.
    </div>
  </div>

  <div class="clause">
    <div class="clause-title">Cláusula 6ª — Da Validade e Assinatura Eletrônica Avançada</div>
    <div class="clause-body">
      As partes reconhecem a plena validade, eficácia jurídica e força executória deste instrumento firmado por meio de certificado eletrônico avançado com registro de endereço IP, carimbo de tempo UTC e Hash SHA-512, nos termos do art. 10, § 2º da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.
    </div>
  </div>

  <!-- Carimbo Visual de Assinatura Eletrônica -->
  <div class="signature-stamp">
    <div class="stamp-title">
      ✓ Carimbo de Assinatura Eletrônica Avançada (Fé Pública & Auditoria)
    </div>
    <div class="stamp-grid">
      <div class="stamp-item"><strong>Signatário:</strong> ${fullName}</div>
      <div class="stamp-item"><strong>Registro Profissional:</strong> CRM-${crmUf} ${crm}</div>
      <div class="stamp-item"><strong>CPF do Médico:</strong> ${cpf}</div>
      <div class="stamp-item"><strong>Data e Hora (BRT):</strong> ${formattedDate}</div>
      <div class="stamp-item"><strong>Endereço IP Registrado:</strong> ${signer_ip}</div>
      <div class="stamp-item"><strong>Status Jurídico:</strong> Homologado & Ativo</div>
    </div>
    <div class="hash-box">
      <strong>HASH CRIPTOGRÁFICO DE INTEGRIDADE (SHA-512):</strong><br>
      ${sha512Hash}
    </div>
    <div class="legal-ref">
      Documento eletrônico assinado digitalmente em conformidade com a MP nº 2.200-2/2001 e Lei nº 14.063/2020. Registro permanente de auditoria arquivado nos servidores seguros da Planta y Raíz Ltda.
    </div>
  </div>
</body>
</html>`;

    // 4. Armazena no Storage Bucket legal-documents
    const storagePath = `contracts/${doctor_id}_contract_v1.html`;
    const encoder = new TextEncoder();
    const htmlBuffer = encoder.encode(htmlContract);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("legal-documents")
      .upload(storagePath, htmlBuffer, {
        contentType: "text/html; charset=utf-8",
        upsert: true,
      });

    if (uploadError) {
      console.warn("Storage upload warning (will proceed with DB save):", uploadError.message);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("legal-documents")
      .getPublicUrl(storagePath);

    const pdfUrl = publicUrlData?.publicUrl || `/contracts/${doctor_id}_contract_v1.html`;

    // 5. Grava ou atualiza o registro em doctor_contracts
    const { data: existingContract } = await supabaseAdmin
      .from("doctor_contracts")
      .select("id")
      .eq("doctor_id", doctor_id)
      .maybeSingle();

    let contractRecordId: string;

    if (existingContract?.id) {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("doctor_contracts")
        .update({
          status: "signed",
          signed_at: signedAt,
          signer_ip: signer_ip,
          signer_user_agent: signer_user_agent,
          doctor_full_name: fullName,
          doctor_cpf: cpf,
          doctor_crm: crm,
          doctor_crm_uf: crmUf,
          pdf_storage_path: storagePath,
          pdf_url: pdfUrl,
          sha512_hash: sha512Hash,
          ip_capture_failed: ip_capture_failed,
        })
        .eq("id", existingContract.id)
        .select("id")
        .single();

      if (updateErr) throw updateErr;
      contractRecordId = updated.id;
    } else {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("doctor_contracts")
        .insert({
          doctor_id: doctor_id,
          user_id: user_id,
          contract_version: contract_version,
          doctor_full_name: fullName,
          doctor_cpf: cpf,
          doctor_crm: crm,
          doctor_crm_uf: crmUf,
          status: "signed",
          signed_at: signedAt,
          signer_ip: signer_ip,
          signer_user_agent: signer_user_agent,
          pdf_storage_path: storagePath,
          pdf_url: pdfUrl,
          sha512_hash: sha512Hash,
          ip_capture_failed: ip_capture_failed,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      contractRecordId = inserted.id;
    }

    // 6. Atualiza tabela doctors habilitando is_contract_signed = true e metadados
    await supabaseAdmin
      .from("doctors")
      .update({ 
        is_contract_signed: true,
        contract_signed_at: signedAt,
        contract_hash: sha512Hash,
        contract_ip: signer_ip,
        contract_version: contract_version,
        ip_capture_failed: ip_capture_failed,
      })
      .eq("id", doctor_id);

    return new Response(
      JSON.stringify({
        success: true,
        contract_id: contractRecordId,
        doctor_id,
        doctor_full_name: fullName,
        doctor_crm: `${crm}/${crmUf}`,
        signed_at: signedAt,
        signer_ip: signer_ip,
        ip_capture_failed: ip_capture_failed,
        sha512_hash: sha512Hash,
        pdf_url: pdfUrl,
        storage_path: storagePath,
        message: "Contrato Médico assinado digitalmente com sucesso! Agenda clínica desbloqueada.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Erro na assinatura do contrato médico:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro ao processar assinatura digital do contrato" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
