import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ShoppingBag, Stethoscope, Clock, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const mockOrders = [
  { id: "PED-001", type: "shopping", title: "Óleo CBD Isolado 10ml", date: "15/02/2026", amount: "R$ 69,90", status: "approved" },
  { id: "PED-002", type: "shopping", title: "Gomas de Melatonina + Cânhamo", date: "12/02/2026", amount: "R$ 39,90", status: "approved" },
  { id: "CON-001", type: "appointment", title: "Orientação Técnica - Dr. Felipe Andrade", date: "10/02/2026", amount: "R$ 120,00", status: "approved" },
  { id: "PED-003", type: "shopping", title: "Creme Tópico Hemp 120g", date: "05/02/2026", amount: "R$ 29,90", status: "pending" },
  { id: "CON-002", type: "appointment", title: "Retorno - Dra. Camila Rocha", date: "01/02/2026", amount: "R$ 75,00", status: "approved" },
];

const mockProfessionalData = {
  balance: "R$ 1.240,00",
  pending: "R$ 380,00",
  total: "R$ 4.560,00",
  appointments: [
    { id: "ATD-001", patient: "Maria L.", date: "15/02/2026", amount: "R$ 120,00", status: "completed" },
    { id: "ATD-002", patient: "João P.", date: "14/02/2026", amount: "R$ 80,00", status: "completed" },
    { id: "ATD-003", patient: "Ana S.", date: "13/02/2026", amount: "R$ 110,00", status: "completed" },
    { id: "ATD-004", patient: "Pedro M.", date: "12/02/2026", amount: "R$ 120,00", status: "pending" },
  ],
};

const Carteira = () => {
  const [view, setView] = useState<"patient" | "professional">("patient");

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-10" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              <span className="text-gradient-gold">Carteira</span>
            </h1>
            <p className="text-muted-foreground">Histórico, recibos e saldos</p>
          </motion.div>

          {/* View toggle */}
          <div className="flex justify-center gap-3 mb-10">
            <Button
              variant={view === "patient" ? "default" : "outline"}
              onClick={() => setView("patient")}
              className={view === "patient" ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold" : "border-border font-bold"}
            >
              <ShoppingBag size={16} className="mr-2" /> Paciente
            </Button>
            <Button
              variant={view === "professional" ? "default" : "outline"}
              onClick={() => setView("professional")}
              className={view === "professional" ? "bg-gradient-to-r from-secondary/30 to-secondary/10 text-secondary border border-green font-bold" : "border-border font-bold"}
            >
              <Stethoscope size={16} className="mr-2" /> Profissional
            </Button>
          </div>

          {view === "patient" ? (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">Histórico de Compras e Orientações Técnicas</h2>
              <div className="space-y-3">
                {mockOrders.map((order) => (
                  <Card key={order.id} className="border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.type === "shopping" ? "bg-gradient-green border border-green" : "bg-gradient-gold border border-gold"}`}>
                          {order.type === "shopping" ? <ShoppingBag size={18} className="text-secondary" /> : <Stethoscope size={18} className="text-primary" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{order.title}</p>
                          <p className="text-xs text-muted-foreground">{order.id} • {order.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gradient-gold text-sm">{order.amount}</p>
                        <div className="flex items-center gap-1 justify-end">
                          {order.status === "approved" ? (
                            <><CheckCircle2 size={12} className="text-secondary" /><span className="text-xs text-secondary font-bold">Pago</span></>
                          ) : (
                            <><Clock size={12} className="text-muted-foreground" /><span className="text-xs text-muted-foreground font-bold">Pendente</span></>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Balance cards */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Saldo Disponível", value: mockProfessionalData.balance, icon: Wallet, color: "primary" },
                  { label: "Pendente", value: mockProfessionalData.pending, icon: Clock, color: "muted" },
                  { label: "Total Recebido", value: mockProfessionalData.total, icon: CheckCircle2, color: "secondary" },
                ].map((card, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <card.icon size={16} className={card.color === "primary" ? "text-primary" : card.color === "secondary" ? "text-secondary" : "text-muted-foreground"} />
                        <span className="text-xs text-muted-foreground font-bold">{card.label}</span>
                      </div>
                      <p className="text-2xl font-display font-bold text-gradient-gold">{card.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button className="mb-8 font-bold bg-gradient-to-r from-primary/20 to-primary/10 border border-gold text-primary" asChild>
                <a href="https://wa.me/5511991363154?text=Olá!%20Quero%20solicitar%20saque%20Pix" target="_blank" rel="noopener noreferrer">
                  Solicitar Saque Pix <ArrowRight size={16} className="ml-2" />
                </a>
              </Button>

              <h2 className="text-lg font-display font-bold text-foreground mb-4">Histórico de Atendimentos</h2>
              <div className="space-y-3">
                {mockProfessionalData.appointments.map((apt) => (
                  <Card key={apt.id} className="border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-gold border border-gold flex items-center justify-center">
                          <FileText size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{apt.patient}</p>
                          <p className="text-xs text-muted-foreground">{apt.id} • {apt.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gradient-gold text-sm">{apt.amount}</p>
                        <span className={`text-xs font-bold ${apt.status === "completed" ? "text-secondary" : "text-muted-foreground"}`}>
                          {apt.status === "completed" ? "Concluído" : "Pendente"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                * Saque Pix: registro interno. Em produção, implementar como payout controlado (admin) ou split via Mercado Pago.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Carteira;
