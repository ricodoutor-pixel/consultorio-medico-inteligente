import { cn } from "@/lib/utils";

interface OnlineStatusIndicatorProps {
  online?: boolean;
  presenceState?: "online" | "em_consulta" | "offline";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const OnlineStatusIndicator = ({
  online = false,
  presenceState,
  size = "md",
  showLabel = false,
  className,
}: OnlineStatusIndicatorProps) => {
  const sizeMap = { sm: "w-2.5 h-2.5", md: "w-3.5 h-3.5", lg: "w-4 h-4" };
  const ringMap = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-8 h-8" };
  const resolvedState = presenceState ?? (online ? "online" : "offline");
  const isBusy = resolvedState === "em_consulta";
  const isOnline = resolvedState === "online";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex items-center justify-center">
        <span
          className={cn(
            "absolute rounded-full opacity-30 animate-pulse",
            ringMap[size],
            isBusy ? "bg-amber-400" : isOnline ? "bg-emerald-400" : "bg-red-400",
          )}
        />
        <span
          className={cn(
            "relative rounded-full shadow-sm",
            isBusy && "animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)] bg-amber-500",
            isOnline && "animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)] bg-emerald-500",
            !isBusy && !isOnline && "animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)] bg-red-500",
            sizeMap[size],
          )}
        />
      </span>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-bold",
            isBusy ? "text-amber-500" : isOnline ? "text-emerald-500" : "text-red-400",
          )}
        >
          {isBusy ? "Em consulta" : isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
};

