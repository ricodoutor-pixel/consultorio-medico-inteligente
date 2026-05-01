import { formatCPF } from "@/lib/validators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  search: string;
  statusFilter: string;
}

const statusStyles: Record<string, string> = {
  Ativo: "bg-[#D1FAE5] text-[#065F46]",
  Pendente: "bg-[#FEF3C7] text-[#92400E]",
  Arquivado: "bg-[#E2E8F0] text-[#475569]",
};

const patients = [
  { name: "João Silva", cpf: "12345678900", lastVisit: "18/04/2026", status: "Ativo" },
  { name: "Maria Oliveira", cpf: "98765432100", lastVisit: "15/04/2026", status: "Ativo" },
  { name: "Carlos Santos", cpf: "11122233344", lastVisit: "10/04/2026", status: "Pendente" },
  { name: "Ana Costa", cpf: "55566677788", lastVisit: "02/04/2026", status: "Arquivado" },
  { name: "Pedro Mendes", cpf: "99988877766", lastVisit: "20/04/2026", status: "Ativo" },
  { name: "Fernanda Lima", cpf: "22233344455", lastVisit: "12/04/2026", status: "Pendente" },
  { name: "Roberto Almeida", cpf: "77788899900", lastVisit: "08/04/2026", status: "Ativo" },
  { name: "Beatriz Rocha", cpf: "33344455566", lastVisit: "01/04/2026", status: "Arquivado" },
];

export function PatientTable({ search, statusFilter }: Props) {
  const filtered = patients.filter((p) => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchName && matchStatus;
  });

  return (
    <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <h2 className="text-sm font-semibold text-[#1B4332]">Pacientes Recentes</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              <TableHead className="text-[#64748B] font-medium">Nome</TableHead>
              <TableHead className="text-[#64748B] font-medium">CPF</TableHead>
              <TableHead className="text-[#64748B] font-medium">Última Orientação Técnica</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[#94A3B8] py-8">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.cpf} className="hover:bg-[#F8FAFC] transition-colors">
                  <TableCell className="font-medium text-[#1E293B]">{p.name}</TableCell>
                  <TableCell className="text-[#475569] font-mono text-sm">
                    {formatCPF(p.cpf)}
                  </TableCell>
                  <TableCell className="text-[#475569]">{p.lastVisit}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyles[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
