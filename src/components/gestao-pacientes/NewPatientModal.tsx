import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCPF } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function NewPatientModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Apenas visual — sem integração
    onClose();
    setName("");
    setCpf("");
    setPhone("");
    setEmail("");
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      )}

      {/* Slide-over panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1B4332]">Novo Paciente</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="h-5 w-5 text-[#64748B]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-[#334155]">Nome Completo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João da Silva"
              className="rounded-xl border-[#CBD5E1] focus-visible:ring-[#1B4332]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#334155]">CPF</Label>
            <Input
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="rounded-xl border-[#CBD5E1] focus-visible:ring-[#1B4332]"
              maxLength={14}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#334155]">Telefone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="rounded-xl border-[#CBD5E1] focus-visible:ring-[#1B4332]"
              maxLength={15}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#334155]">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="paciente@email.com"
              className="rounded-xl border-[#CBD5E1] focus-visible:ring-[#1B4332]"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl border-[#CBD5E1]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white"
          >
            Cadastrar
          </Button>
        </div>
      </div>
    </>
  );
}
