import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountProvider } from "@/contexts/AccountContext";
import Telemedicina from "./Telemedicina";

describe("Telemedicina renderToString", () => {
  it("renders without throwing an exception", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    try {
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <TooltipProvider>
            <MemoryRouter>
              <AccountProvider>
                <Telemedicina />
              </AccountProvider>
            </MemoryRouter>
          </TooltipProvider>
        </QueryClientProvider>
      );
      expect(html).toBeDefined();
    } catch (err: any) {
      console.error("TELEMEDICINA RENDER ERROR:", err);
      throw err;
    }
  });
});
