import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

/**
 * CORREÇÃO: "Meu Painel" removido do menu
 * Funcionalidades integradas ao ADM
 * Data: 09/03/2026
 */

export function Navigation() {
  const { user } = useAuth();

  const menuItems = [
    { label: 'Início', href: '/' },
    { label: 'Profissionais', href: '/profissionais' },
    { label: 'Telemedicina', href: '/telemedicina' },
    { label: 'Shopping', href: '/shopping' },
    { label: 'Biblioteca', href: '/biblioteca' },
    { label: 'Comunidade', href: '/comunidade' },
    // ✅ "Meu Painel" REMOVIDO - Funcionalidades integradas ao ADM
    { label: 'Planos', href: '/planos' }
  ];

  return (
    <nav className="flex items-center gap-6 text-white">
      {menuItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <a className="hover:text-green-500 transition-colors text-sm md:text-base">
            {item.label}
          </a>
        </Link>
      ))}
      {user && (
        <Link href="/adm">
          <a className="ml-auto px-4 py-2 bg-green-500 rounded hover:bg-green-600 transition-colors text-sm md:text-base">
            ADM
          </a>
        </Link>
      )}
    </nav>
  );
}
