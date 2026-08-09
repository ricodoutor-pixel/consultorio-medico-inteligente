import { Navbar } from "@/components/Navbar";
import GlobalOperationsMap from "@/components/admin/GlobalOperationsMap";

export default function AdminGlobalOps() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">
              🌍 Operações Globais
            </h1>
            <p className="text-sm text-muted-foreground">
              Visão geográfica em tempo real de todos os pacientes geolocalizados.
              Protocolo de emergência: clique em qualquer marcador para acessar a localização exata.
            </p>
          </div>
          <GlobalOperationsMap />
        </div>
      </section>
    </div>
  );
}
