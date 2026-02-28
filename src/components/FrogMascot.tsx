import { useState, memo } from "react";
import { motion } from "framer-motion";
import verdinhoFrog from "@/assets/verdinho-frog.png";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
}

export const FrogMascot = memo(({ onClick, size = 56 }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none focus:outline-none relative"
      aria-label="Pergunte ao Verdinho — Assistente IA"
      title="Pergunte ao Verdinho 🐸"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.12 }}
      animate={{ y: [0, -3, 0] }}
      transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
    >
      <img
        src={verdinhoFrog}
        alt="Verdinho - Assistente IA"
        className="object-contain"
        style={{ width: size, height: size }}
        draggable={false}
      />

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
