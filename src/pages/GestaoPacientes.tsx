import { useState } from "react";
import { GestaoPacientesSidebar } from "@/components/gestao-pacientes/Sidebar";
import { SummaryCards } from "@/components/gestao-pacientes/SummaryCards";
import { PatientTable } from "@/components/gestao-pacientes/PatientTable";
import { NewPatientModal } from "@/components/gestao-pacientes/NewPatientModal";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GestaoPacientes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  return (
    <div className="flex min-h-dvh bg-[#F1F5F9]">
      {/* Sidebar */}
      <GestaoPacientesSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5 text-[#1B4332]" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-[#1B4332]">
              Gestão de Pacientes
            </h1>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Paciente</span>
          </Button>
        </header>

        <div className="flex-1 p-4 md:p-8 space-y-6 overflow-auto">
          {/* Summary Cards */}
          <SummaryCards />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs rounded-xl border-[#CBD5E1] focus-visible:ring-[#1B4332]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            >
              <option>Todos</option>
              <option>Ativo</option>
              <option>Pendente</option>
              <option>Arquivado</option>
            </select>
          </div>

          {/* Table */}
          <PatientTable search={search} statusFilter={statusFilter} />
        </div>
      </div>

      {/* New Patient Modal */}
      <NewPatientModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default GestaoPacientes;
