import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HealthSubscriptionPlans } from "@/components/subscription/HealthSubscriptionPlans";

export default function SaudeDigital() {
  return (
    <div className="min-h-dvh bg-background pb-6 sm:pb-0">
      <Helmet>
        <title>Planos de Saúde Digital | Planta y Raiz</title>
        <meta
          name="description"
          content="Planos de saúde digital com acesso à Brisa IA, descontos no shopping e orientações técnicas inclusas."
        />
      </Helmet>

      <Navbar />

      <section className="pt-20 pb-12 md:pt-32 md:pb-16 hero-glow">
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="mb-6">
            <Link
              to="/planos"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} /> Voltar aos Planos SaaS
            </Link>
          </div>

          <div className="text-center mb-10">
            <Heart size={40} className="text-primary mx-auto mb-3" />
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black text-foreground mb-3 tracking-tight">
              Planos de <span className="text-gradient-green">Saúde Digital</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Acesso à Brisa IA, descontos no shopping e orientações técnicas inclusas.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <HealthSubscriptionPlans />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
