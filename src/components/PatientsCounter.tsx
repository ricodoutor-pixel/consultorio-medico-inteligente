import { useState, useEffect, useRef } from "react";
import { Users } from "lucide-react";

export const PatientsCounter = () => {
  // Inicializa em 4800 ou recupera do localStorage se quisermos manter a contagem (mas como não foi pedido, apenas começa em 4800 cada refresh, ou podemos usar um ref para não perder na re-renderização)
  const countRef = useRef(4800);
  const [count, setCount] = useState(countRef.current);

  useEffect(() => {
    // Incrementa a cada 20 segundos
    const id = setInterval(() => {
      countRef.current += 1;
      setCount(countRef.current);
    }, 20000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center mt-6 lg:mt-8 w-full">
      <div className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl bg-primary/10 border border-primary/20 max-w-sm w-full mx-auto backdrop-blur-sm shadow-[0_0_15px_rgba(57,255,20,0.1)]">
        <div className="p-3 bg-primary/20 rounded-xl">
          <Users className="text-primary w-6 h-6 md:w-8 md:h-8" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-display font-black text-primary tracking-tight">
              {count.toLocaleString("pt-BR")}
            </span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <p className="text-xs md:text-sm font-semibold text-muted-foreground mt-0.5">
            Pacientes Atendidos
          </p>
        </div>
      </div>
    </div>
  );
};
