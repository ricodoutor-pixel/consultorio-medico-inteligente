import { cn } from "@/lib/utils";

interface OnlineStatusIndicatorProps {
  online?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const OnlineStatusIndicator = ({ online = false, size = "md", showLabel = false, className }: OnlineStatusIndicatorProps) => {
  const sizeMap = { sm: "w-2.5 h-2.5", md: "w-3.5 h-3.5", lg: "w-4 h-4" };
  const ringMap = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-8 h-8" };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex items-center justify-center">
        {online && (
          <span className={cn("absolute rounded-full opacity-40 animate-ping", ringMap[size], "bg-emerald-400")} />
        )}
        <span
          className={cn(
            "relative rounded-full border-2 border-background shadow-sm",
            sizeMap[size],
            online ? "bg-emerald-500" : "bg-red-500"
          )}
        />
      </span>
      {showLabel && (
        <span className={cn("text-xs font-bold", online ? "text-emerald-500" : "text-red-400")}>
          {online ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
};
