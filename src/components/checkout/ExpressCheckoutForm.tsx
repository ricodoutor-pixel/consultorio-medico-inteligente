import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { readAttribution } from "@/lib/payment-links";
import {
  validateExpressInput,
  type ExpressProduct,
} from "../../../supabase/functions/_shared/express-checkout";

type Method = "pix" | "card";

interface Props {
  product: ExpressProduct;
  /** Ex.: "R$ 30". */
  priceLabel: string;
  /** Chamado quando já existe sessão e o aceite foi gravado: a página gera o Pix/cartão de sempre. */
  onReady: (method: Method) => void | Promise<void>;
  /** A página está gerando o pagamento. */
  busy?: boolean;
  /** Na consulta o pagamento vem depois (horário/fila): mostra um único botão com este texto. */
  continueLabel?: string;
}

const formatCpf = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

/**
 * Checkout expresso em uma tela, sem /login nem /cadastro: nome, WhatsApp, CPF, e-mail e aceites.
 * Conta nova recebe sessão na hora; conta que já existia entra com a própria senha ou pelo link
 * enviado ao e-mail dela (nunca abrimos sessão de conta existente só com os dados digitados).
 */
export function ExpressCheckoutForm({ product, priceLabel, onReady, busy, continueLabel }: Props) {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("+55 ");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptTelemed, setAcceptTelemed] = useState(false);
  const [submitting, setSubmitting] = useState<Method | null>(null);
  const [existing, setExisting] = useState(false);
  const [password, setPassword] = useState("");
  const [sendingLink, setSendingLink] = useState(false);

  const accepted = { terms: acceptTerms, privacy: acceptTerms, telemedicine: acceptTelemed };
  const attribution = readAttribution(window.location.search);

  const saveConsentForCurrentUser = async () => {
    const { data, error } = await supabase.functions.invoke("checkout-express", {
      body: { action: "consent", product, accepted, attribution },
    });
    if (error || data?.error) throw new Error(data?.error || "consent");
  };

  const start = async (method: Method) => {
    const check = validateExpressInput({ full_name: fullName, whatsapp, cpf, email, product, accepted });
    if ("error" in check) {
      toast({ title: "Confira seus dados", description: check.error, variant: "destructive" });
      return;
    }
    setSubmitting(method);
    try {
      const { data, error } = await supabase.functions.invoke("checkout-express", {
        body: { ...check.value, attribution },
      });
      if (error || data?.error) throw new Error(data?.error || "Não foi possível iniciar agora.");
      if (data?.status === "existing_account") {
        setExisting(true);
        toast({ title: "Você já tem cadastro", description: "Digite sua senha ou receba um link de acesso no seu e-mail." });
        return;
      }
      const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
      if (otpErr) throw otpErr;
      await onReady(method);
    } catch (e) {
      toast({ title: "Não foi possível continuar", description: e instanceof Error ? e.message : "Tente de novo em instantes.", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  const loginAndPay = async (method: Method) => {
    if (!acceptTerms || !acceptTelemed) {
      toast({ title: "Aceite obrigatório", description: "Marque os termos para continuar.", variant: "destructive" });
      return;
    }
    setSubmitting(method);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw new Error("E-mail ou senha incorretos.");
      await saveConsentForCurrentUser();
      await onReady(method);
    } catch (e) {
      toast({ title: "Não foi possível entrar", description: e instanceof Error ? e.message : "Tente de novo.", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  const sendAccessLink = async () => {
    setSendingLink(true);
    try {
      await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false, emailRedirectTo: window.location.href },
      });
      toast({ title: "Link enviado", description: "Se este e-mail tiver cadastro, o link de acesso chega em instantes. Abra-o neste celular." });
    } finally {
      setSendingLink(false);
    }
  };

  const disabled = !!submitting || !!busy;

  return (
    <div className="space-y-3" data-testid="express-checkout">
      {!existing ? (
        <>
          <div>
            <Label htmlFor="xc-name" className="text-xs font-bold">Nome completo</Label>
            <Input id="xc-name" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} className="h-11" />
          </div>
          <div>
            <Label htmlFor="xc-whats" className="text-xs font-bold">WhatsApp</Label>
            <Input id="xc-whats" type="tel" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="xc-cpf" className="text-xs font-bold">CPF</Label>
              <Input id="xc-cpf" inputMode="numeric" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} className="h-11" />
            </div>
            <div>
              <Label htmlFor="xc-email" className="text-xs font-bold">E-mail</Label>
              <Input id="xc-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm text-foreground">Você já tem cadastro. Entre com a senha de <strong>{email || "seu e-mail"}</strong> e o pagamento abre aqui mesmo.</p>
          <div>
            <Label htmlFor="xc-email2" className="text-xs font-bold">E-mail</Label>
            <Input id="xc-email2" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
          </div>
          <div>
            <Label htmlFor="xc-pass" className="text-xs font-bold">Senha</Label>
            <Input id="xc-pass" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="h-11" />
          </div>
          <button type="button" onClick={() => void sendAccessLink()} disabled={sendingLink} className="text-xs underline text-primary">
            {sendingLink ? "Enviando..." : "Não lembro a senha: receber link de acesso no e-mail"}
          </button>
        </div>
      )}

      <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
        <Checkbox checked={acceptTerms} onCheckedChange={v => setAcceptTerms(v === true)} aria-label="Aceito os Termos de Uso e a Política de Privacidade" className="mt-0.5" />
        <span>Li e aceito os <Link to="/termos" target="_blank" className="underline">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="underline">Política de Privacidade (LGPD)</Link>.</span>
      </label>
      <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
        <Checkbox checked={acceptTelemed} onCheckedChange={v => setAcceptTelemed(v === true)} aria-label="Aceito o Termo de Consentimento para Telemedicina" className="mt-0.5" />
        <span>Aceito o Termo de Consentimento para Telemedicina (Res. CFM 2.314/2022).</span>
      </label>

      {continueLabel ? (
        <Button onClick={() => void (existing ? loginAndPay("pix") : start("pix"))} disabled={disabled}
          className="w-full h-14 rounded-2xl font-black text-base">
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <>{continueLabel} <ChevronRight size={18} className="ml-1" /></>}
        </Button>
      ) : (<>
      <Button
        onClick={() => void (existing ? loginAndPay("pix") : start("pix"))}
        disabled={disabled}
        className="w-full h-14 rounded-2xl font-black text-base bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
      >
        {submitting === "pix" || busy ? <><Loader2 className="animate-spin" size={18} /> Gerando Pix...</> : <><QrCode size={20} /> Pagar {priceLabel} com Pix</>}
      </Button>
      <Button
        variant="outline"
        onClick={() => void (existing ? loginAndPay("card") : start("card"))}
        disabled={disabled}
        className="w-full h-11 rounded-2xl font-semibold text-xs"
      >
        {submitting === "card" ? <><Loader2 className="animate-spin mr-2" size={14} /> Abrindo...</> : <>Pagar com cartão (Mercado Pago) <ChevronRight size={14} className="ml-1" /></>}
      </Button>
      </>)}
      <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-center">
        <ShieldCheck size={12} className="text-primary" /> Endereço e senha só depois do atendimento.
      </p>
    </div>
  );
}
