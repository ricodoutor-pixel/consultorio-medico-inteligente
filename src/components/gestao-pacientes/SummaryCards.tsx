import { Users, CalendarCheck, FileText, UserPlus } from "lucide-react";
import { usePatientRegistry } from "./usePatientRegistry";

export function SummaryCards() {
  const { total, activeCount, pendingCount, newThisMonth, loading } = usePatientRegistry();

  const cards = [
    { label: "Total de Pacientes", value: total, icon: Users, color: "bg-[#1B4332]" },
    { label: "Cadastros Completos", value: activeCount, icon: CalendarCheck, color: "bg-[#2D6A4F]" },
    { label: "Pendentes de Documentos", value: pendingCount, icon: FileText, color: "bg-[#40916C]" },
    { label: "Novos Este Mês", value: newThisMonth, icon: UserPlus, color: "bg-[#52B788]" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl bg-white p-5 shadow-sm border border-[#E2E8F0] flex items-center gap-4"
        >
          <div className={`${c.color} rounded-xl p-3 text-white`}>
            <c.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1B4332]">{loading ? "—" : c.value}</p>
            <p className="text-xs text-[#64748B]">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
