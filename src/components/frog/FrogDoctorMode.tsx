import { motion, AnimatePresence } from "framer-motion";
import verdinhoDoctor from "@/assets/verdinho-doctor.png";

interface FrogDoctorModeProps {
  size: number;
  isDoctor: boolean;
  lookingAtChart: boolean;
}

export const FrogDoctorMode = ({ size, isDoctor, lookingAtChart }: FrogDoctorModeProps) => {
  return (
    <AnimatePresence>
      {isDoctor && (
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Doctor image overlay — replaces the entire frog */}
          <motion.img
            src={verdinhoDoctor}
            alt="Dr. Verdinho"
            width={size}
            height={size}
            className="drop-shadow-xl pointer-events-none"
            draggable={false}
            animate={{
              rotateY: lookingAtChart ? -8 : 0,
              rotateZ: lookingAtChart ? -3 : 0,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ transformOrigin: "50% 55%" }}
          />

          {/* Stethoscope emoji floating */}
          <motion.span
            className="absolute -top-1 -right-1 text-sm z-40"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🩺
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
