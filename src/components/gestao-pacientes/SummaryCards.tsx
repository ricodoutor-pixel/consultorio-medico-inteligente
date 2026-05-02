import { Users, CalendarCheck, FileText, UserPlus } from "lucide-react";

const cards = [
  { label: "Total de Pacientes", value: "1.247", icon: Users, color: "bg-[#1B4332]" },
  { label: "Orientações Técnicas Hoje", value: "18", icon: CalendarCheck, color: "bg-[#2D6A4F]" },
  { label: "Prescrições Ativas", value: "342", icon: FileText, color: "bg-[#40916C]" },
  { label: "Novos Cadastros", value: "23", icon: UserPlus, color: "bg-[#52B788]" },
];

export function SummaryCards() {
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
            <p className="text-2xl font-bold text-[#1B4332]">{c.value}</p>
            <p className="text-xs text-[#64748B]">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
