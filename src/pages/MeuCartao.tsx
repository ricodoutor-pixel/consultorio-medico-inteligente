import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import CartaoVirtual from "@/components/CartaoVirtual";

export default function MeuCartao() {
  const [nome, setNome] = useState("Assinante Planta y Raiz");
  const [numero, setNumero] = useState("PYR-00000000");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const meta = (u.user_metadata || {}) as Record<string, string>;
      setNome(meta.full_name || u.email?.split("@")[0] || "Assinante");
      // Deriva um número estável a partir do user.id (placeholder até integrar saude_plus_assinantes)
      const digits = (u.id.replace(/\D/g, "") + "00000000").slice(0, 8);
      setNumero(`PYR-${digits}`);
    });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#04080F] text-white px-4 py-10">
      <Helmet>
        <title>Meu Cartão Saúde Plus | Planta y Raiz</title>
        <meta name="description" content="Cartão Saúde Plus virtual com NFC, QR Code dinâmico e integração com Google e Apple Wallet." />
      </Helmet>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-1">Meu Cartão Saúde Plus</h1>
        <p className="text-center text-sm text-emerald-300/80 mb-6">
          Apresente o QR Code ou aproxime o celular (NFC) na clínica parceira.
        </p>

        <CartaoVirtual
          numeroCartao={numero}
          nomeTitular={nome}
          plano="Raiz"
          validade="12/2027"
        />
      </div>
    </main>
  );
}
