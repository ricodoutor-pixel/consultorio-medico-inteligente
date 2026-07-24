import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldCheck, QrCode, Lock, KeyRound, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MFAEnrollmentProps {
  onSuccess?: () => void;
}

export function MFAEnrollment({ onSuccess }: MFAEnrollmentProps) {
  const [loading, setLoading] = useState(true);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setLoading(true);
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (!error && factors && factors.totp.length > 0) {
        const verifiedFactor = factors.totp.find(f => f.status === "verified");
        if (verifiedFactor) {
          setIsAlreadyEnrolled(true);
          setLoading(false);
          return;
        }
      }

      // Se não tiver TOTP configurado, iniciar enroll
      const enrollRes = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Planta y Raiz",
        friendlyName: "Médico Telemedicina",
      });

      if (enrollRes.error) throw enrollRes.error;

      if (enrollRes.data) {
        setFactorId(enrollRes.data.id);
        setQrCodeSvg(enrollRes.data.totp.qr_code);
        setSecret(enrollRes.data.totp.secret);
      }
    } catch (err: any) {
      console.error("[MFAEnrollment] Erro no fluxo MFA:", err);
      toast.error("Erro ao gerar chave de autenticação MFA.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || code.trim().length !== 6) {
      toast.error("Insira o código de 6 dígitos do seu aplicativo autenticador.");
      return;
    }

    setVerifying(true);
    try {
      const challengeRes = await supabase.auth.mfa.challenge({ factorId });
      if (challengeRes.error) throw challengeRes.error;

      const challengeId = challengeRes.data.id;
      const verifyRes = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.trim(),
      });

      if (verifyRes.error) throw verifyRes.error;

      toast.success("Autenticação em Dois Fatores (MFA) ativada com sucesso!");
      setIsAlreadyEnrolled(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("[MFAEnrollment] Erro ao verificar código:", err);
      toast.error("Código incorreto. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border max-w-md mx-auto">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          Configurando Autenticação em Dois Fatores (MFA)...
        </CardContent>
      </Card>
    );
  }

  if (isAlreadyEnrolled) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5 max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-foreground">2FA (MFA) Ativado</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Sua conta médica está protegida com Autenticação em Dois Fatores em conformidade com as diretrizes de segurança da saúde.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-xl max-w-md mx-auto">
      <CardHeader className="bg-muted/30 border-b border-border text-center pb-4">
        <CardTitle className="text-base font-black flex items-center justify-center gap-2 text-foreground">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Ativação de 2FA Obrigatório (Médicos)
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4 text-center">
        <p className="text-xs text-muted-foreground">
          Abra seu aplicativo autenticador (Google Authenticator, Authy ou 1Password) e escaneie o código QR abaixo:
        </p>

        {qrCodeSvg && (
          <div className="bg-white p-4 rounded-2xl inline-block border border-border shadow-inner">
            <img src={qrCodeSvg} alt="QR Code 2FA" className="w-48 h-48 mx-auto" />
          </div>
        )}

        {secret && (
          <div className="bg-muted/40 p-2.5 rounded-xl border border-border text-xs">
            <span className="text-muted-foreground font-mono block text-[10px] uppercase">Chave de Recuperação Manual</span>
            <code className="font-bold text-foreground tracking-wider select-all">{secret}</code>
          </div>
        )}

        <div className="space-y-2 text-left pt-2">
          <label className="text-xs font-bold uppercase text-muted-foreground block text-center">
            Digite o Código de 6 dígitos exibido no app:
          </label>
          <Input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center text-xl font-mono tracking-widest h-12 rounded-xl"
          />
        </div>

        <Button
          onClick={handleVerify}
          disabled={verifying || code.length !== 6}
          className="w-full bg-primary text-primary-foreground font-black rounded-xl h-11 gap-2 mt-2"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" /> Confirmar e Ativar 2FA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
