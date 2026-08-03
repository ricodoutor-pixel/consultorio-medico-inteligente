import { BadgeCheck } from "lucide-react";

/**
 * Selo "Supervisão Técnica Dr. Edilson Bezerra ON — Made In Brazil" exibido em produtos
 * cuja flag `endorsed_by_doctor` está marcada como true pelo admin.
 * Emitido sob a supervisão técnica da plataforma (Bezerra Med Soluções Integradas Ltda. — CNPJ 30.740.319/0001-14).
 */
export const DoctorEndorsedBadge = ({ compact = false }: { compact?: boolean }) => {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white font-bold shadow-sm w-fit">
        <BadgeCheck size={9} className="shrink-0" /> Dra. Suelen (CRM-PR)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold w-fit">
      <BadgeCheck size={13} className="shrink-0" />
      Supervisão Técnica — Dr. Edilson Bezerra ON (CRM 49354/PR) — Made In Brazil
    </span>
  );
};

export default DoctorEndorsedBadge;
