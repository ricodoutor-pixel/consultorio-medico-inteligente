import { ShieldCheck, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SealType = "vip" | "premium" | "enterprise" | null;

export const DoctorVIPSeal = ({ tier }: { tier?: string | null }) => {
  if (!tier) return null;

  if (tier === "basic") {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-black gap-1 px-2">
        <ShieldCheck size={10} /> VIP
      </Badge>
    );
  }

  if (tier === "premium") {
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-black gap-1 px-2">
        <Crown size={10} /> Premium
      </Badge>
    );
  }

  if (tier === "enterprise") {
    return (
      <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-black gap-1 px-2">
        <Crown size={10} /> Enterprise
      </Badge>
    );
  }

  return null;
};
