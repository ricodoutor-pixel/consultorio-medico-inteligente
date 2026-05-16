import { BadgeCheck } from "lucide-react";

/**
 * Selo "Indicado pelo Dr. Edilson Made In Brazil" exibido em produtos
 * cuja flag `endorsed_by_doctor` está marcada como true pelo admin.
 */
export const DoctorEndorsedBadge = ({ compact = false }: { compact?: boolean }) => {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white font-bold shadow-sm w-fit">
        <BadgeCheck size={9} className="shrink-0" /> Dr. Edilson
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold w-fit">
      <BadgeCheck size={13} className="shrink-0" />
      Indicado pelo Dr. Edilson — Made In Brazil
    </span>
  );
};

export default DoctorEndorsedBadge;
