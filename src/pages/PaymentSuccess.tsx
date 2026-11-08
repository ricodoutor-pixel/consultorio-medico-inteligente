import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PostConsultationViralLoop } from "@/components/PostConsultationViralLoop";
import { orientationEntryUrl } from "@/lib/orientation-navigation";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { PaymentConfirmedNotice } from "@/components/payments/PaymentConfirmedNotice";

const PaymentSuccess = () => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("external_reference") || params.get("ref") || "";
  const paymentId = params.get("payment_id") || params.get("collection_id") || "";
  const { status, method, confirmedReference, recheck } = usePaymentConfirmation(ref, paymentId);
  const isOrientation = /^(brisa-orientacao-|orientacao[:\-]|ot[:\-])/.test(confirmedReference);

  return (
  <div className="min-h-dvh bg-background">
    <Navbar />
    <section className="pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          {status === "approved" ? <PaymentConfirmedNotice pix={method === "pix"}
            label={isOrientation ? "Continuar Orientação Técnica" : "Continuar para meu painel"}
            to={isOrientation ? orientationEntryUrl(`?ref=${encodeURIComponent(confirmedReference)}`) : "/dashboard"} /> : <>
            {status === "checking" ? <Loader2 size={64} className="mx-auto animate-spin text-primary" /> : status === "error" ? <AlertCircle size={64} className="mx-auto text-muted-foreground" /> : <Clock size={64} className="mx-auto text-primary" />}
            <h1 className="text-3xl font-display font-bold text-foreground">{status === "error" ? "Não foi possível conferir o pagamento" : "Aguardando confirmação do pagamento"}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">{status === "error" ? "Entre na mesma conta usada para pagar e tente conferir novamente. Não faça outro pagamento se já pagou." : "O sucesso será mostrado após a confirmação do Mercado Pago. Se já pagou, não é necessário pagar novamente."}</p>
            <Button onClick={recheck} variant="outline">Conferir novamente</Button>
            <Button asChild><Link to="/dashboard">Ir para meu painel</Link></Button>
          </>}
        </div>

        {/* Loop viral: Planta-Coins + indicação */}
        {status === "approved" && <PostConsultationViralLoop coinsEarned={15} bonusPerReferral={10} />}
      </div>
    </section>
    <Footer />
  </div>
  );
};

export default PaymentSuccess;
