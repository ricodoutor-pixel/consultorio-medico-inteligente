import { Info } from "lucide-react";
import { EDILSON_ON_SUPERVISION, OT_FIRST_STEP_NOTICE } from "@/lib/edilson-on";

/** Aviso oficial: Dr. Edilson Bezerra ON é IA supervisionada e a Orientação Técnica é só o início do cuidado. */
export function EdilsonOnNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground ${className}`}>
      <Info size={14} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
      <p>
        <strong className="text-foreground">{OT_FIRST_STEP_NOTICE}</strong> {EDILSON_ON_SUPERVISION}
      </p>
    </div>
  );
}
