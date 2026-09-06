import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  FileSignature, ShieldCheck, Wallet, Package, Star, Truck, Copy,
  CheckCircle2, AlertTriangle, ClipboardList,
} from "lucide-react";

interface DocItem {
  label: string;
  detail: string;
  required: boolean;
}

export const PHARMACY_DOC_CHECKLIST: DocItem[] = [
  { label: "Contrato Social / Requerimento de Empresário (PDF)", detail: "Última alteração consolidada, com CNAE de farmácia/dispensário.", required: true },
  { label: "Cartão CNPJ (Comprovante de Inscrição - Receita Federal)", detail: "Emitido nos últimos 90 dias.", required: true },
  { label: "Alvará Sanitário / Licença da Vigilância Sanitária", detail: "Dentro da validade, com endereço igual ao do cadastro.", required: true },
  { label: "AFE ANVISA (Autorização de Funcionamento)", detail: "Número da AFE e, quando houver, AE para produtos controlados.", required: true },
  { label: "Certidão de Regularidade Técnica — CRF", detail: "Com nome e nº de inscrição do farmacêutico responsável técnico.", required: true },
  { label: "Documento de identidade + CPF do responsável legal", detail: "RG ou CNH legível (frente e verso).", required: true },
  { label: "Comprovante de endereço comercial", detail: "Conta de luz, água ou telefone dos últimos 90 dias.", required: true },
  { label: "Foto da fachada / loja física", detail: "Usada para o card da farmácia no Shopping.", required: true },
  { label: "Logomarca oficial (PNG ou JPG)", detail: "Fundo claro, mínimo 400x400px — aparece no catálogo.", required: true },
  { label: "Dados bancários / Pix + ID de vendedor Mercado Pago", detail: "Obrigatório para receber o repasse de 95% das vendas.", required: true },
  { label: "Certidão negativa de débitos (CND)", detail: "Opcional, acelera a homologação.", required: false },
];

const STEPS = [
  {
    icon: FileSignature,
    title: "1. Faça o cadastro da farmácia",
    body: "Preencha razão social, nome fantasia, CNPJ, endereço completo, responsável técnico (CRF) e contatos. Assine o Termo de Responsabilidade declarando que todos os dados são verdadeiros.",
    action: { to: "/cadastro-farmacia", label: "Abrir formulário de cadastro" },
  },
  {
    icon: ShieldCheck,
    title: "2. Anexe os documentos (KYC)",
    body: "Envie os documentos da lista abaixo na aba 'KYC & Documentos'. Arquivos em PDF, JPG ou PNG, legíveis e dentro da validade.",
  },
  {
    icon: Wallet,
    title: "3. Cadastre a conta de recebimento",
    body: "Na aba 'Financeiro', informe a chave Pix e o ID de vendedor do Mercado Pago. Sem isso, as vendas ficam bloqueadas — o repasse é automático (95% farmácia / 5% plataforma).",
  },
  {
    icon: CheckCircle2,
    title: "4. Aguarde a homologação",
    body: "Nossa equipe confere os documentos em até 48h úteis. Aprovada, sua loja passa a aparecer no Shopping Planta y Raíz.",
  },
  {
    icon: Package,
    title: "5. Cadastre seu catálogo",
    body: "Na aba 'Catálogo', inclua até 10 produtos com nome, concentração, preço, estoque e foto. Produtos controlados exigem receita.",
  },
  {
    icon: Star,
    title: "6. Escolha sua melhor oferta",
    body: "Na aba 'Sua Melhor Oferta', selecione 1 produto de destaque e o selo ('Oferta' ou 'Promoção'). Ele aparece no card da farmácia e na vitrine.",
  },
  {
    icon: Truck,
    title: "7. Receba receitas e despache",
    body: "As receitas chegam nas abas 'Receitas Recebidas' e 'Receitas'. Confira o hash regulatório, aprove a dispensação, separe o medicamento e informe o código de rastreio.",
  },
];

export function PharmacyOnboardingGuide() {
  const { toast } = useToast();

  const copyChecklist = async () => {
    const text = [
      "DOCUMENTOS PARA CADASTRO DE FARMÁCIA — PLANTA Y RAÍZ",
      "",
      ...PHARMACY_DOC_CHECKLIST.map(
        (d, i) => `${i + 1}. ${d.label}${d.required ? "" : " (opcional)"}\n   ${d.detail}`
      ),
      "",
      "Formatos aceitos: PDF, JPG ou PNG (até 10MB por arquivo).",
      "Cadastro: https://www.plantayraiz.com.br/cadastro-farmacia",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Lista copiada", description: "Cole no WhatsApp e envie para o lojista." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ClipboardList className="text-emerald-400" size={20} /> Passo a Passo do Lojista
          </CardTitle>
          <CardDescription>
            Da abertura da loja à primeira venda — siga a ordem abaixo para ser homologado rápido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-3 p-4 rounded-2xl bg-card/70 border border-border">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <s.icon size={20} />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-sm text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                {s.action && (
                  <Button asChild size="sm" variant="outline" className="mt-1 h-8 text-xs font-bold rounded-lg border-primary/30 text-primary">
                    <Link to={s.action.to}>{s.action.label}</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-500/30">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="text-amber-400" size={20} /> Documentos necessários para o cadastro
            </CardTitle>
            <CardDescription>PDF, JPG ou PNG — até 10MB por arquivo, legíveis e dentro da validade.</CardDescription>
          </div>
          <Button size="sm" onClick={copyChecklist} className="shrink-0 rounded-xl font-bold text-xs">
            <Copy size={14} className="mr-1.5" /> Copiar lista
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {PHARMACY_DOC_CHECKLIST.map((d, i) => (
            <div key={d.label} className="flex gap-3 p-3 rounded-xl border border-border bg-card/60">
              <span className="w-6 h-6 shrink-0 rounded-lg bg-muted text-xs font-bold flex items-center justify-center text-foreground">
                {i + 1}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{d.label}</span>
                  <Badge
                    variant="outline"
                    className={d.required
                      ? "text-[10px] border-emerald-500/40 text-emerald-400"
                      : "text-[10px] border-muted-foreground/30 text-muted-foreground"}
                  >
                    {d.required ? "Obrigatório" : "Opcional"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{d.detail}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2 p-3 mt-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Documentos vencidos, ilegíveis ou com endereço diferente do cadastro reprovam a homologação.
              A veracidade das informações é de responsabilidade do lojista, conforme o Termo assinado no cadastro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PharmacyOnboardingGuide;
