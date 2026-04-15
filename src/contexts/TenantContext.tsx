/**
 * 🐸 Planta y Raiz — Multi-Tenant Context (White-Label Foundation)
 * Identifica a organização atual baseada no subdomínio ou URL
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  primaryColor: string; // HSL format: "152 80% 45%"
  logoUrl?: string;
  organizationId: string | null;
}

const DEFAULT_TENANT: TenantConfig = {
  id: "planta-e-raiz",
  name: "Planta & Raiz",
  slug: "planta-e-raiz",
  primaryColor: "152 80% 45%",
  logoUrl: undefined,
  organizationId: null,
};

interface TenantContextType {
  tenant: TenantConfig;
  isWhiteLabel: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: DEFAULT_TENANT,
  isWhiteLabel: false,
});

/**
 * Resolve o tenant baseado no subdomínio ou query param
 */
function resolveTenant(): TenantConfig {
  const hostname = window.location.hostname;
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get("tenant");

  // Subdomínio: parceiro.plantayraiz.com.br
  const subdomain = hostname.split(".")[0];

  // Default: sempre Planta & Raiz
  if (
    !tenantParam &&
    (subdomain === "www" ||
      subdomain === "plantayraiz" ||
      hostname === "localhost" ||
      hostname.includes("lovable"))
  ) {
    return DEFAULT_TENANT;
  }

  // White-label: subdomínio customizado
  // Em produção, buscar config do banco via API
  const tenantSlug = tenantParam || subdomain;

  return {
    ...DEFAULT_TENANT,
    id: tenantSlug,
    slug: tenantSlug,
    name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
    organizationId: tenantSlug, // será UUID real em produção
  };
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig>(DEFAULT_TENANT);
  const isWhiteLabel = tenant.id !== "planta-e-raiz";

  useEffect(() => {
    const resolved = resolveTenant();
    setTenant(resolved);

    // Aplica theme overrides via CSS custom properties
    if (resolved.primaryColor !== DEFAULT_TENANT.primaryColor) {
      document.documentElement.style.setProperty(
        "--primary",
        resolved.primaryColor
      );
      document.documentElement.style.setProperty(
        "--ring",
        resolved.primaryColor
      );
    }
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isWhiteLabel }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
