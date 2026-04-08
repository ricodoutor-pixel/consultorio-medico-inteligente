import React, { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface MobileNavProps {
  className?: string;
}

export default function MobileNav({ className = "" }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Sobre", href: "/about" },
    { label: "Serviços", href: "/services" },
    { label: "E-book Gratuito", href: "/ebook" },
    { label: "Biblioteca", href: "/biblioteca" },
    { label: "Club", href: "/club" },
    { label: "Agendamentos", href: "/agendamentos" },
    { label: "Contato", href: "/contato" },
  ];

  return (\n    <>\n      {/* Mobile Menu Button */}\n      <button\n        onClick={() => setIsOpen(!isOpen)}\n        className={`fixed top-4 left-4 z-30 md:hidden p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition ${className}`}\n        style={{\n          top: `max(1rem, env(safe-area-inset-top))`,\n          left: `max(1rem, env(safe-area-inset-left))`,\n        }}\n      >\n        <Menu className=\"w-6 h-6 text-gray-900\" />\n      </button>\n\n      {/* Mobile Menu Backdrop */}\n      {isOpen && (\n        <div\n          className=\"fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden\"\n          onClick={() => setIsOpen(false)}\n        />\n      )}\n\n      {/* Mobile Menu */}\n      <div\n        className={`fixed top-0 left-0 w-full h-screen bg-white z-40 md:hidden transform transition-transform duration-300 overflow-y-auto ${\n          isOpen ? \"translate-x-0\" : \"-translate-x-full\"\n        }`}\n        style={{\n          paddingTop: `max(1rem, env(safe-area-inset-top))`,\n          paddingBottom: `max(1rem, env(safe-area-inset-bottom))`,\n        }}\n      >\n        {/* Menu Header with Close Button */}\n        <div className=\"sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-50\">\n          <h2 className=\"text-xl font-bold text-gray-900\">Menu</h2>\n          <button\n            onClick={() => setIsOpen(false)}\n            className=\"flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition active:scale-95\"\n            aria-label=\"Fechar menu\"\n          >\n            {/* Seta para esquerda */}\n            <ChevronRight className=\"w-6 h-6 text-gray-900 transform rotate-180\" />\n          </button>\n        </div>\n\n        {/* Menu Items */}\n        <nav className=\"space-y-1 p-4\">\n          {menuItems.map((item) => (\n            <Link key={item.href} href={item.href}>\n              <a\n                className=\"flex items-center justify-between w-full p-4 rounded-lg text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition\"\n                onClick={() => setIsOpen(false)}\n              >\n                <span className=\"font-medium\">{item.label}</span>\n                <ChevronRight className=\"w-5 h-5 text-gray-400\" />\n              </a>\n            </Link>\n          ))}\n        </nav>\n\n        {/* Menu Footer */}\n        <div className=\"absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50\">\n          <button\n            onClick={() => setIsOpen(false)}\n            className=\"w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition\"\n          >\n            Fechar Menu\n          </button>\n        </div>\n      </div>\n    </>\n  );\n}\n
