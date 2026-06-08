import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RelatorioIA {
  id: string;
  departamento: string;
  titulo: string;
  conteudo_json: any;
  status: string;
  created_at: string;
}

export const useDiretoriaRealtimeData = () => {
  const { data: relatorios, isLoading, error, refetch } = useQuery({
    queryKey: ["diretoria_ia_relatorios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diretoria_ia_relatorios" as never)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RelatorioIA[];
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    const channel = supabase
      .channel("diretoria_ia_relatorios_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "diretoria_ia_relatorios",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [refetch]);

  return { relatorios, isLoading, error };
};
