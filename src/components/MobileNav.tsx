import React, { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileNavProps {
  className?: string;
}

export default function MobileNav({ className = "" }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Sobre", href: "/como-funciona" },
    { label: "Profissionais", href: "/profissionais" },
    { label: "E-book Gratuito", href: "/ebook" },
    { label: "Biblioteca", href: "/biblioteca" },
    { label: "Comunidade", href: "/comunidade" },
    { label: "Agendamento", href: "/agendamento" },
    { label: "Contato", href: "/contato" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-30 md:hidden p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition ${className}`}
        style={{
          top: `max(1rem, env(safe-area-inset-top))`,
          left: `max(1rem, env(safe-area-inset-left))`,
        }}
      >
        <Menu className="w-6 h-6 text-gray-900" />
      </button>

      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-dvh bg-white z-40 md:hidden transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          paddingTop: `max(1rem, env(safe-area-inset-top))`,
          paddingBottom: `max(1rem, env(safe-area-inset-bottom))`,
        }}
      >
        {/* Menu Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-50">
          <h2 className="text-xl font-bold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition active:scale-95"
            aria-label="Fechar menu"
          >
            <ChevronRight className="w-6 h-6 text-gray-900 transform rotate-180" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center justify-between w-full p-4 rounded-lg text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition"
              onClick={() => setIsOpen(false)}
            >
              <span className="font-medium">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </nav>

        {/* Menu Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
          >
            Fechar Menu
          </button>
        </div>
      </div>
    </>
  );
}
