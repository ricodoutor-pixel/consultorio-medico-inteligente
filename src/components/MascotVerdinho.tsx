import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

interface MascotVerdhinhoProps {
  onChatOpen?: () => void;
  className?: string;
}

export default function MascotVerdinho({ onChatOpen, className = "" }: MascotVerdhinhoProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const touchTimeoutRef = useRef<NodeJS.Timeout>();
  const mascotRef = useRef<HTMLDivElement>(null);

  // Detectar scroll tipo Star Wars
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        setScrollPosition((prev) => Math.min(prev + 10, 100));
      } else {
        setScrollPosition((prev) => Math.max(prev - 10, 0));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Lidar com toques
  const handleTouchOrClick = () => {
    setTouchCount((prev) => prev + 1);

    // Limpar timeout anterior
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }

    // 1 toque: Disparar scroll Star Wars
    if (touchCount === 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }

    // 2 toques: Abrir chat de IA
    if (touchCount === 1) {
      setShowChat(true);
      onChatOpen?.();
    }

    // Reset após 500ms
    touchTimeoutRef.current = setTimeout(() => {
      setTouchCount(0);
    }, 500);
  };

  // Hover: Aumentar 3x
  const handleHover = (isHovering: boolean) => {
    if (mascotRef.current) {
      if (isHovering) {
        mascotRef.current.style.transform = "scale(3)";
        mascotRef.current.style.zIndex = "9999";
      } else {
        mascotRef.current.style.transform = "scale(1)";
        mascotRef.current.style.zIndex = "40";
      }
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Mascote Verdinho */}
      <div
        ref={mascotRef}
        className={`fixed bottom-6 right-6 z-40 cursor-pointer transition-all duration-300 ${className}`}
        style={{
          transformOrigin: "bottom right",
          transform: isAnimating ? "scale(1.2) rotate(360deg)" : "scale(1)",
        }}
        onClick={handleTouchOrClick}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
      >
        {/* Mascote SVG */}
        <div className="relative w-16 h-16 md:w-20 md:h-20">
          {/* Corpo Verde */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-lg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cabeça */}
            <circle cx="50" cy="35" r="20" fill="#10b981" />

            {/* Olhos */}
            <circle cx="42" cy="30" r="3" fill="#ffffff" />
            <circle cx="58" cy="30" r="3" fill="#ffffff" />

            {/* Pupilas animadas */}
            <circle cx="42" cy="30" r="1.5" fill="#000000" className="animate-pulse" />
            <circle cx="58" cy="30" r="1.5" fill="#000000" className="animate-pulse" />

            {/* Sorriso */}
            <path d="M 42 38 Q 50 42 58 38" stroke="#ffffff" strokeWidth="2" fill="none" />

            {/* Corpo */}
            <ellipse cx="50" cy="60" rx="18" ry="22" fill="#10b981" />

            {/* Braços */}
            <rect x="25" y="50" width="12" height="8" rx="4" fill="#10b981" />
            <rect x="63" y="50" width="12" height="8" rx="4" fill="#10b981" />

            {/* Pernas */}
            <rect x="40" y="78" width="8" height="15" rx="4" fill="#10b981" />
            <rect x="52" y="78" width="8" height="15" rx="4" fill="#10b981" />

            {/* Folha no topo da cabeça */}
            <path
              d="M 50 15 Q 55 8 60 12 Q 55 5 50 10"
              fill="#059669"
              className={isAnimating ? "animate-spin" : ""}
            />
          </svg>

          {/* Indicador de interação */}
          {touchCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {touchCount}
            </div>
          )}

          {/* Animação de pulso */}
          <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-pulse" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div>1 toque: Scroll Star Wars</div>
          <div>2 toques: Chat IA</div>
        </div>
      </div>

      {/* Star Wars Scroll Effect */}
      {scrollPosition > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div
            className="absolute inset-0 bg-gradient-to-b from-yellow-400 via-transparent to-transparent opacity-30"
            style={{
              transform: `perspective(1000px) rotateX(${scrollPosition}deg)`,
              transformOrigin: "center top",
            }}
          >
            <div className="text-center text-yellow-400 font-bold text-4xl mt-20 opacity-50">
              PLANTA & RAIZ
            </div>
          </div>
        </div>
      )}

      {/* Chat IA Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-end p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full md:w-96 max-h-96 flex flex-col">
            {/* Header */}
            <div className="bg-green-500 text-white p-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-green-500 font-bold">V</span>
                </div>
                <div>
                  <div className="font-bold">Verdinho</div>
                  <div className="text-xs opacity-80">IA Assistant</div>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-green-600 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                  <p className="text-sm text-gray-800">
                    Olá! 👋 Sou o Verdinho, seu assistente de IA. Como posso ajudá-lo hoje?
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t p-4 flex gap-2">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 transition">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Safe Area Adjustment */}
      <style>{`
        @media (max-width: 768px) {
          div[class*="bottom-6"] {
            bottom: max(1.5rem, env(safe-area-inset-bottom));
            right: max(1.5rem, env(safe-area-inset-right));
          }
        }
      `}</style>
    </>
  );
}
