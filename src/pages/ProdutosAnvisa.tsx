import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnvisaBadge } from "@/components/AnvisaBadge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, FileText, ExternalLink, AlertTriangle, Leaf } from "lucide-react";

const ProdutosAnvisa = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Helmet>
        <title>Produtos ANVISA — Conformidade Sanitária | Planta y Raiz</title>
        <meta
          name="description"
          content="Informações regulatórias sobre produtos de cannabis medicinal comercializados na Planta y Raiz — todos em conformidade com as RDC 660/2022 e 327/2019 da ANVISA."
        />
        <link rel="canonical" href="https://www.plantayraiz.com.br/produtos-anvisa" />
        <meta property="og:title" content="Produtos ANVISA — Planta y Raiz" />
        <meta
          property="og:description"
          content="Conformidade sanitária ANVISA — RDC 660/2022 e 327/2019. Cannabis medicinal com rastreabilidade regulatória."
        />
        <meta property="og:url" content="https://www.plantayraiz.com.br/produtos-anvisa" />
        <meta property="og:type" content="article" />
      </Helmet>

      <Navbar />

      <main className="container mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="text-primary" size={28} />
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Produtos ANVISA — Conformidade Sanitária
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Todos os produtos disponibilizados na plataforma Planta y Raiz são regulamentados
            pela Agência Nacional de Vigilância Sanitária (ANVISA), conforme legislação vigente.
          </p>
          <div className="mt-4 flex justify-center">
            <AnvisaBadge registration="RDC 660/2022 · 327/2019" />
          </div>
        </header>

        <section className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
                <FileText size={18} className="text-primary" /> Base Regulatória
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>
                  <strong className="text-foreground">RDC 660/2022</strong> — regulamenta a
                  importação de produtos derivados de cannabis por pessoa física para uso próprio,
                  mediante prescrição médica.
                </li>
                <li>
                  <strong className="text-foreground">RDC 327/2019</strong> — dispõe sobre os
                  procedimentos de fabricação, importação, comercialização, prescrição, dispensação
                  e monitoramento de produtos de <em>Cannabis</em> nacionais.
                </li>
                <li>
                  <strong className="text-foreground">RDC 1.015/2026</strong> — atualiza os
                  requisitos de rastreabilidade e farmacovigilância aplicáveis a produtos derivados
                  de cannabis.
                </li>
                <li>
                  <strong className="text-foreground">Resolução CFM 2.314/2022</strong> — disciplina
                  a telemedicina no Brasil, incluindo teleconsulta e telemonitoramento.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
                <Leaf size={18} className="text-primary" /> Como identificar um produto regularizado
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Registro/autorização ANVISA visível no rótulo e na página do produto.</li>
                <li>Rotulagem em português com composição, teor de CBD/THC e lote.</li>
                <li>
                  Nota fiscal e certificado de análise (Certificate of Analysis) emitidos pelo
                  fabricante ou importador autorizado.
                </li>
                <li>Vinculação obrigatória a uma prescrição médica válida.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
                <AlertTriangle size={18} className="text-amber-500" /> Orientações de uso responsável
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Os produtos derivados de <em>Cannabis</em> devem ser utilizados exclusivamente sob
                orientação médica. Não interrompa o uso de outros medicamentos sem consultar seu
                profissional de saúde. Em caso de eventos adversos, notifique a ANVISA pelo sistema
                VigiMed.
              </p>
              <a
                href="https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/notificacoes/vigimed"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <ExternalLink size={12} /> Notificar evento adverso — VigiMed
              </a>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
                <ShieldCheck size={18} className="text-primary" /> Consulta pública ANVISA
              </h2>
              <p className="mb-3 text-sm text-muted-foreground">
                A verificação da regularidade de empresas, medicamentos e produtos pode ser
                realizada gratuitamente no portal oficial de consultas da ANVISA.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://consultas.anvisa.gov.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <ExternalLink size={12} /> Portal de Consultas ANVISA
                </a>
                <a
                  href="https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cannabis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <ExternalLink size={12} /> Cannabis medicinal — ANVISA
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground/70">
          Supervisão Técnica: Dra. Suelen Naves Rodrigues · CRM 49354/PR · Bezerra Med Soluções Integradas Ltda. · CNPJ 30.740.319/0001-14
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default ProdutosAnvisa;
