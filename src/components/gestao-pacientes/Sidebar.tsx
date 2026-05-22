import { Home, Users, Calendar, FileText, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: "Início", active: false },
  { icon: Users, label: "Pacientes", active: true },
  { icon: Calendar, label: "Agenda", active: false },
  { icon: FileText, label: "Prescrições", active: false },
  { icon: Settings, label: "Configurações", active: false },
];

export function GestaoPacientesSidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#1B4332] text-white transition-transform duration-300 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#40916C] flex items-center justify-center text-sm font-bold">
              P
            </div>
            <span className="font-bold text-base tracking-tight">Planta y Raiz</span>
          </div>
          <button className="md:hidden p-1 hover:bg-white/10 rounded" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                item.active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#40916C] flex items-center justify-center text-sm font-bold">
              DE
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Dr. Edilson</p>
              <p className="text-xs text-white/60 truncate">CRM 12345-SP</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
