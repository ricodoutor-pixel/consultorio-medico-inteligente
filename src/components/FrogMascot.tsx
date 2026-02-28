import { useState, memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import verdinhoKiss from "@/assets/verdinho-kiss.jpg";
import verdinhoScepter from "@/assets/verdinho-scepter.jpg";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
}

export const FrogMascot = memo(({ onClick, size = 56 }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = [verdinhoKiss, verdinhoScepter];

  const handleClick = () => {
    setImageIndex((prev) => (prev + 1) % 2);
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("cursor-pointer select-none focus:outline-none relative")}
      aria-label="Pergunte ao Verdinho — Assistente IA"
      title="Pergunte ao Verdinho 🐸"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      animate={{ y: [0, -4, 0] }}
      transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
    >
      <img
        src={images[imageIndex]}
        alt="Verdinho - Assistente IA"
        className="rounded-full object-cover border-2 border-primary/40"
        style={{
          width: size,
          height: size,
          filter: "drop-shadow(0 2px 6px hsl(152 80% 45% / 0.35))",
        }}
        draggable={false}
      />

      {/* Hover tooltip */}
      {isHovered && (
        <motion.div
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold pointer-events-none bg-primary/20 border border-primary/30 text-primary"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Fale comigo! 🐸
        </motion.div>
      )}
    </motion.button>
  );
});

FrogMascot.displayName = "FrogMascot";
