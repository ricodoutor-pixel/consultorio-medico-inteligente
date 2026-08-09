import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Download, Trash2, Eye, FileText, Send, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const LGPDDireitos = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [requestSent, setRequestSent] = useState<string | null>(null);

  const handleRequest = async (type: string) => {
    setLoading(type);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Faça login primeiro", variant: "destructive" });
      setLoading(null);
      return;
    }

    const requestType = type === "eliminacao" || type === "deletion" ? "deletion" : "export";

    const { error } = await (supabase as any).from("data_subject_requests").insert({
      patient_id: session.user.id,
      request_type: requestType,
      status: "pending",
      notes: reason ? `[${type}] ${reason}` : `Solicitação de ${type}`,
    });

    if (error) {
      console.error("[LGPDDireitos] Erro ao gravar solicitação:", error);
    }

    setLoading(null);
    setRequestSent(type);
    toast({ title: `Solicitação "${type}" registrada ✅`, description: "Responderemos em até 15 dias úteis conforme LGPD Art. 18." });
  };

  const rights = [
    {
      icon: Eye,
      title: "Acesso aos Dados",
      desc: "Solicitar uma cópia completa dos seus dados pessoais armazenados.",
      action: "acesso",
      article: "Art. 18, II",
    },
    {
      icon: FileText,
      title: "Correção de Dados",
      desc: "Solicitar a correção de dados incompletos, inexatos ou desatualizados.",
      action: "correcao",
      article: "Art. 18, III",
    },
    {
      icon: Download,
      title: "Portabilidade",
      desc: "Receber seus dados em formato estruturado para transferência a outro serviço.",
      action: "portabilidade",
      article: "Art. 18, V",
    },
    {
      icon: Trash2,
      title: "Eliminação de Dados",
      desc: "Solicitar a exclusão dos dados pessoais não obrigatórios por lei. Dados do prontuário médico são retidos por 20 anos (CFM Res. 1.821/2007).",
      action: "eliminacao",
      article: "Art. 18, VI",
      warning: true,
    },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Shield size={12} className="mr-1" /> LGPD — Lei nº 13.709/2018
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Seus Direitos de Privacidade
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Exerça seus direitos como titular de dados pessoais conforme a Lei Geral de Proteção de Dados. 
            Todas as solicitações são processadas em até 15 dias úteis.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {rights.map((r, i) => (
            <motion.div key={r.action} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.1 }}>
              <Card className="border-border h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <r.icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{r.title}</h3>
                      <Badge variant="outline" className="text-[9px] mt-0.5 border-muted-foreground/20">{r.article}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{r.desc}</p>
                  {r.warning && (
                    <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-lg p-2 mb-3">
                      <AlertTriangle size={12} className="text-destructive mt-0.5 shrink-0" />
                      <p className="text-[10px] text-destructive">
                        Dados médicos obrigatórios não podem ser eliminados por determinação legal.
                      </p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={requestSent === r.action ? "outline" : "default"}
                    className="w-full text-xs"
                    disabled={loading === r.action || requestSent === r.action}
                    onClick={() => handleRequest(r.action)}
                  >
                    {loading === r.action ? (
                      <Loader2 size={12} className="animate-spin mr-1" />
                    ) : requestSent === r.action ? (
                      <CheckCircle2 size={12} className="mr-1" />
                    ) : (
                      <Send size={12} className="mr-1" />
                    )}
                    {requestSent === r.action ? "Solicitação Enviada" : "Solicitar"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-bold text-foreground text-sm mb-2">📝 Observações adicionais (opcional)</h3>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva detalhes da sua solicitação se necessário..."
              className="bg-muted border-border text-sm min-h-[80px] mb-3"
            />
            <p className="text-[10px] text-muted-foreground">
Encarregado de Dados (DPO): contato@plantayraiz.com.br • 
	              ANPD: www.gov.br/anpd • 
	              Prazo legal: 15 dias úteis (Art. 18, §5º, LGPD)
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default LGPDDireitos;
