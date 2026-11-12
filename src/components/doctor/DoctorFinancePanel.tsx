import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Loader2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportCSV } from "@/lib/admin-export";
import { financeTotals, monthLabel, type FinanceMonth } from "@/lib/doctor-finance";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Financeiro do consultório: repasses liberados por mês, saques, taxas e exportação para o contador. */
export function DoctorFinancePanel({ doctorId }: { doctorId: string }) {
  const [rows, setRows] = useState<FinanceMonth[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- função nova ainda fora dos tipos gerados
    void (supabase.rpc as any)("doctor_finance_monthly", { _months: 12 }).then(
      ({ data, error }: { data: FinanceMonth[] | null; error: unknown }) => {
        if (!active) return;
        if (error) setFailed(true);
        else setRows((data ?? []).map((r) => ({ ...r, released_amount: Number(r.released_amount), withdrawn_net: Number(r.withdrawn_net), withdrawn_fee: Number(r.withdrawn_fee), withdrawals_pending: Number(r.withdrawals_pending) })));
      },
    );
    void supabase
      .from("doctor_wallets")
      .select("balance")
      .eq("doctor_id", doctorId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setBalance(Number(data?.balance ?? 0));
      });
    return () => {
      active = false;
    };
  }, [doctorId]);

  const totals = rows ? financeTotals(rows) : null;
  const chart = rows ? [...rows].reverse().map((r) => ({ mes: monthLabel(r.month), valor: r.released_amount })) : [];

  const exportRows = () =>
    exportCSV(
      "financeiro-consultorio",
      (rows ?? []).map((r) => ({
        mes: monthLabel(r.month),
        consultas_liberadas: r.released_count,
        repasse_liberado_brl: r.released_amount.toFixed(2),
        saques_pagos_liquidos_brl: r.withdrawn_net.toFixed(2),
        taxa_saque_brl: r.withdrawn_fee.toFixed(2),
        saques_em_andamento_brl: r.withdrawals_pending.toFixed(2),
      })),
    );

  return (
    <Card className="border-emerald-500/30">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="inline-flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" /> Financeiro do consultório
          </CardTitle>
          <Button size="sm" variant="outline" onClick={exportRows} disabled={!rows?.length}>
            <Download className="h-4 w-4 mr-1" /> Exportar para o contador (CSV)
          </Button>
        </div>
        <CardDescription>
          Repasse de 93% liberado após a avaliação do paciente; saque Pix com taxa de 5%. Valores por mês (horário de
          Brasília).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {failed && <p className="text-sm text-red-600">Não foi possível carregar o financeiro agora.</p>}
        {!rows && !failed && (
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </p>
        )}
        {totals && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Saldo disponível", value: balance === null ? "—" : BRL(balance) },
              { label: "Repasses no mês", value: BRL(totals.currentMonth) },
              { label: "Repasses em 12 meses", value: BRL(totals.year) },
              { label: "Consultas liberadas (12 meses)", value: String(totals.consultations) },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{k.value}</p>
              </div>
            ))}
          </div>
        )}
        {rows && rows.some((r) => r.released_amount > 0) && (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={56} />
                <Tooltip formatter={(v) => [BRL(Number(v)), "Repasse"]} />
                <Bar dataKey="valor" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {rows && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Mês</th>
                  <th className="py-2 pr-3">Consultas</th>
                  <th className="py-2 pr-3">Repasse</th>
                  <th className="py-2 pr-3">Saques pagos</th>
                  <th className="py-2 pr-3">Taxas</th>
                  <th className="py-2">Em andamento</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.month} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium">{monthLabel(r.month)}</td>
                    <td className="py-2 pr-3">{r.released_count}</td>
                    <td className="py-2 pr-3">{BRL(r.released_amount)}</td>
                    <td className="py-2 pr-3">{BRL(r.withdrawn_net)}</td>
                    <td className="py-2 pr-3">{BRL(r.withdrawn_fee)}</td>
                    <td className="py-2">{BRL(r.withdrawals_pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          Leve este relatório ao seu contador para a declaração dos rendimentos (carnê-leão como pessoa física ou
          faturamento da sua empresa). A plataforma não substitui a orientação contábil.
        </p>
      </CardContent>
    </Card>
  );
}
