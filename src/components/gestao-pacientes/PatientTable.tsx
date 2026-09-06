import { formatCPF } from "@/lib/validators";
import { usePatientRegistry } from "./usePatientRegistry";
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

export function PatientTable({ search, statusFilter }: Props) {
  const { patients, loading } = usePatientRegistry();

  const filtered = patients.filter((p) => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchName && matchStatus;
  });

  return (
    <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <h2 className="text-sm font-semibold text-[#1B4332]">Pacientes Cadastrados</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              <TableHead className="text-[#64748B] font-medium">Nome</TableHead>
              <TableHead className="text-[#64748B] font-medium">CPF</TableHead>
              <TableHead className="text-[#64748B] font-medium">Cadastrado em</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[#94A3B8] py-8">
                  Carregando pacientes...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[#94A3B8] py-8">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <TableCell className="font-medium text-[#1E293B]">{p.name}</TableCell>
                  <TableCell className="text-[#475569] font-mono text-sm">
                    {p.cpf ? formatCPF(p.cpf) : "—"}
                  </TableCell>
                  <TableCell className="text-[#475569]">
                    {new Date(p.registeredAt).toLocaleDateString("pt-BR")}
                  </TableCell>
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
