/**
 * ManualVitalSignsForm
 * Registro manual de sinais vitais (SpO2, pressão arterial, FC, FR, temperatura)
 * durante a teleconsulta. Grava em public.diagnostic_exams (exam_type = 'cardiac')
 * e lista as últimas aferições reais do paciente.
 *
 * Sem mocks: todos os dados vêm do banco (Supabase) ou de props.
 */
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Loader2,
  RefreshCw,
  Save,
  Stethoscope,
  Wind,
  Thermometer,
  ClipboardList,
} from "lucide-react";

/* ---------------------------------- Tipos --------------------------------- */

export interface ManualVitalSignsFormProps {
  /** Paciente ao qual a aferição pertence (auth user id). */
  patientId: string;
  /** Nome exibido no cabeçalho, quando disponível. */
  patientName?: string;
  /** Consulta/atendimento vinculado, para rastreabilidade clínica. */
  consultationId?: string;
  /** Quantas aferições anteriores exibir. */
  historyLimit?: number;
  /** Disparado após gravação bem-sucedida. */
  onSaved?: (reading: VitalSignsReading) => void;
}

export interface VitalSignsValues {
  systolic: number;
  diastolic: number;
  heartRate: number;
  spo2: number;
  respRate?: number;
  temperature?: number;
  notes?: string;
}

export interface VitalSignsReading extends VitalSignsValues {
  id: string;
  createdAt: string;
  riskLevel: RiskLevel;
  consultationId?: string;
}

type RiskLevel = "normal" | "attention" | "critical";

interface DiagnosticExamRow {
  id: string;
  created_at: string;
  risk_level: string | null;
  results: unknown;
}

/* -------------------------------- Validação ------------------------------- */

const vitalSignsSchema = z
  .object({
    systolic: z.coerce
      .number({ invalid_type_error: "Informe a pressão sistólica" })
      .int("Use números inteiros")
      .min(50, "Valor abaixo do plausível (mín. 50 mmHg)")
      .max(260, "Valor acima do plausível (máx. 260 mmHg)"),
    diastolic: z.coerce
      .number({ invalid_type_error: "Informe a pressão diastólica" })
      .int("Use números inteiros")
      .min(30, "Valor abaixo do plausível (mín. 30 mmHg)")
      .max(160, "Valor acima do plausível (máx. 160 mmHg)"),
    heartRate: z.coerce
      .number({ invalid_type_error: "Informe a frequência cardíaca" })
      .int("Use números inteiros")
      .min(25, "Valor abaixo do plausível (mín. 25 bpm)")
      .max(240, "Valor acima do plausível (máx. 240 bpm)"),
    spo2: z.coerce
      .number({ invalid_type_error: "Informe a saturação" })
      .int("Use números inteiros")
      .min(50, "Valor abaixo do plausível (mín. 50%)")
      .max(100, "Máximo 100%"),
    respRate: z.coerce
      .number()
      .int("Use números inteiros")
      .min(4, "Valor abaixo do plausível (mín. 4 rpm)")
      .max(70, "Valor acima do plausível (máx. 70 rpm)")
      .optional(),
    temperature: z.coerce
      .number()
      .min(30, "Valor abaixo do plausível (mín. 30 °C)")
      .max(43, "Valor acima do plausível (máx. 43 °C)")
      .optional(),
    notes: z
      .string()
      .max(500, "Máximo de 500 caracteres")
      .optional()
      .transform((value) => sanitizeText(value)),
  })
  .refine((data) => data.systolic > data.diastolic, {
    path: ["diastolic"],
    message: "A diastólica deve ser menor que a sistólica",
  });

type VitalSignsFormInput = z.input<typeof vitalSignsSchema>;

/* ------------------------------- Utilitários ------------------------------ */

function sanitizeText(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function classifyRisk(values: VitalSignsValues): RiskLevel {
  const critical =
    values.spo2 < 90 ||
    values.systolic >= 180 ||
    values.diastolic >= 120 ||
    values.systolic < 90 ||
    values.heartRate < 45 ||
    values.heartRate > 130 ||
    (values.respRate !== undefined && (values.respRate < 8 || values.respRate > 28)) ||
    (values.temperature !== undefined && values.temperature >= 39.5);
  if (critical) return "critical";

  const attention =
    values.spo2 < 95 ||
    values.systolic >= 140 ||
    values.diastolic >= 90 ||
    values.heartRate > 100 ||
    values.heartRate < 55 ||
    (values.respRate !== undefined && values.respRate > 22) ||
    (values.temperature !== undefined && values.temperature >= 37.8);
  return attention ? "attention" : "normal";
}

const RISK_LABEL: Record<RiskLevel, string> = {
  normal: "Dentro da faixa esperada",
  attention: "Requer atenção",
  critical: "Alerta clínico",
};

const RISK_STYLE: Record<RiskLevel, string> = {
  normal: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  attention: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
};

function isRiskLevel(value: string | null): value is RiskLevel {
  return value === "normal" || value === "attention" || value === "critical";
}

function readNumber(source: Record<string, unknown>, key: string): number | undefined {
  const raw = source[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

function mapRow(row: DiagnosticExamRow): VitalSignsReading | null {
  if (typeof row.results !== "object" || row.results === null) return null;
  const results = row.results as Record<string, unknown>;
  const systolic = readNumber(results, "systolic");
  const diastolic = readNumber(results, "diastolic");
  const heartRate = readNumber(results, "heart_rate");
  const spo2 = readNumber(results, "spo2");
  if (
    systolic === undefined ||
    diastolic === undefined ||
    heartRate === undefined ||
    spo2 === undefined
  ) {
    return null;
  }
  const notes = results["notes"];
  const consultationId = results["consultation_id"];
  return {
    id: row.id,
    createdAt: row.created_at,
    riskLevel: isRiskLevel(row.risk_level) ? row.risk_level : "normal",
    systolic,
    diastolic,
    heartRate,
    spo2,
    respRate: readNumber(results, "resp_rate"),
    temperature: readNumber(results, "temperature"),
    notes: typeof notes === "string" ? notes : undefined,
    consultationId: typeof consultationId === "string" ? consultationId : undefined,
  };
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/* ------------------------------- Componente ------------------------------- */

export function ManualVitalSignsForm({
  patientId,
  patientName,
  consultationId,
  historyLimit = 5,
  onSaved,
}: ManualVitalSignsFormProps) {
  const [history, setHistory] = useState<VitalSignsReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VitalSignsFormInput>({
    resolver: zodResolver(vitalSignsSchema),
    mode: "onBlur",
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("diagnostic_exams")
      .select("id, created_at, risk_level, results")
      .eq("user_id", patientId)
      .eq("exam_type", "cardiac")
      .order("created_at", { ascending: false })
      .limit(historyLimit);

    if (error) {
      setLoadError("Não foi possível carregar as aferições anteriores.");
      setHistory([]);
    } else {
      const rows: DiagnosticExamRow[] = data ?? [];
      setHistory(rows.map(mapRow).filter((item): item is VitalSignsReading => item !== null));
    }
    setLoading(false);
  }, [patientId, historyLimit]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const onSubmit = handleSubmit(async (raw) => {
    const parsed = vitalSignsSchema.parse(raw);
    const values: VitalSignsValues = {
      systolic: Number(parsed.systolic),
      diastolic: Number(parsed.diastolic),
      heartRate: Number(parsed.heartRate),
      spo2: Number(parsed.spo2),
      respRate: parsed.respRate === undefined ? undefined : Number(parsed.respRate),
      temperature: parsed.temperature === undefined ? undefined : Number(parsed.temperature),
      notes: parsed.notes,
    };
    const riskLevel = classifyRisk(values);


    const { data, error } = await supabase
      .from("diagnostic_exams")
      .insert({
        user_id: patientId,
        exam_type: "cardiac",
        risk_level: riskLevel,
        results: {
          source: "manual_entry",
          systolic: values.systolic,
          diastolic: values.diastolic,
          heart_rate: values.heartRate,
          spo2: values.spo2,
          resp_rate: values.respRate ?? null,
          temperature: values.temperature ?? null,
          notes: values.notes ?? null,
          consultation_id: consultationId ?? null,
          measured_at: new Date().toISOString(),
        },
      })
      .select("id, created_at, risk_level, results")
      .single();

    if (error || !data) {
      toast.error("Não foi possível registrar a aferição. Tente novamente.");
      return;
    }

    const saved = mapRow(data as DiagnosticExamRow);
    toast.success("Sinais vitais registrados no prontuário.");
    reset();
    if (saved) {
      setHistory((prev) => [saved, ...prev].slice(0, historyLimit));
      onSaved?.(saved);
    } else {
      void fetchHistory();
    }
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Stethoscope size={18} className="text-emerald-600" aria-hidden="true" />
          Sinais vitais — registro manual
          {patientName ? (
            <span className="text-xs font-normal text-muted-foreground">· {patientName}</span>
          ) : null}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Valores aferidos por equipamento calibrado e lançados pelo profissional durante o
          atendimento. O registro é gravado no prontuário do paciente.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="vs-systolic"
              label="Pressão sistólica (mmHg)"
              icon={<Activity size={14} aria-hidden="true" />}
              error={errors.systolic?.message}
            >
              <Input
                id="vs-systolic"
                type="number"
                inputMode="numeric"
                placeholder="120"
                aria-label="Pressão arterial sistólica em mmHg"
                aria-invalid={Boolean(errors.systolic)}
                {...register("systolic")}
              />
            </Field>

            <Field
              id="vs-diastolic"
              label="Pressão diastólica (mmHg)"
              icon={<Activity size={14} aria-hidden="true" />}
              error={errors.diastolic?.message}
            >
              <Input
                id="vs-diastolic"
                type="number"
                inputMode="numeric"
                placeholder="80"
                aria-label="Pressão arterial diastólica em mmHg"
                aria-invalid={Boolean(errors.diastolic)}
                {...register("diastolic")}
              />
            </Field>

            <Field
              id="vs-heart-rate"
              label="Frequência cardíaca (bpm)"
              icon={<HeartPulse size={14} aria-hidden="true" />}
              error={errors.heartRate?.message}
            >
              <Input
                id="vs-heart-rate"
                type="number"
                inputMode="numeric"
                placeholder="72"
                aria-label="Frequência cardíaca em batimentos por minuto"
                aria-invalid={Boolean(errors.heartRate)}
                {...register("heartRate")}
              />
            </Field>

            <Field
              id="vs-spo2"
              label="Saturação SpO₂ (%)"
              icon={<Wind size={14} aria-hidden="true" />}
              error={errors.spo2?.message}
            >
              <Input
                id="vs-spo2"
                type="number"
                inputMode="numeric"
                placeholder="98"
                aria-label="Saturação periférica de oxigênio em porcentagem"
                aria-invalid={Boolean(errors.spo2)}
                {...register("spo2")}
              />
            </Field>

            <Field
              id="vs-resp-rate"
              label="Frequência respiratória (rpm)"
              optional
              icon={<Wind size={14} aria-hidden="true" />}
              error={errors.respRate?.message}
            >
              <Input
                id="vs-resp-rate"
                type="number"
                inputMode="numeric"
                placeholder="16"
                aria-label="Frequência respiratória em respirações por minuto"
                aria-invalid={Boolean(errors.respRate)}
                {...register("respRate")}
              />
            </Field>

            <Field
              id="vs-temperature"
              label="Temperatura (°C)"
              optional
              icon={<Thermometer size={14} aria-hidden="true" />}
              error={errors.temperature?.message}
            >
              <Input
                id="vs-temperature"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="36.5"
                aria-label="Temperatura corporal em graus Celsius"
                aria-invalid={Boolean(errors.temperature)}
                {...register("temperature")}
              />
            </Field>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vs-notes" className="text-xs font-semibold">
              Observações clínicas <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="vs-notes"
              rows={3}
              maxLength={500}
              placeholder="Condições da aferição, equipamento utilizado, queixas associadas…"
              aria-label="Observações clínicas sobre a aferição"
              aria-invalid={Boolean(errors.notes)}
              className="resize-none"
              {...register("notes")}
            />
            {errors.notes?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.notes.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            aria-label="Registrar sinais vitais no prontuário"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" /> Registrando…
              </>
            ) : (
              <>
                <Save size={14} className="mr-2" aria-hidden="true" /> Registrar aferição
              </>
            )}
          </Button>
        </form>

        <section aria-labelledby="vs-history-title" className="border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3
              id="vs-history-title"
              className="flex items-center gap-2 text-sm font-bold text-foreground"
            >
              <ClipboardList size={15} className="text-emerald-600" aria-hidden="true" />
              Últimas aferições
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void fetchHistory()}
              disabled={loading}
              aria-label="Recarregar aferições anteriores"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            </Button>
          </div>

          {loading ? (
            <ul className="space-y-2" aria-busy="true" aria-label="Carregando aferições">
              {Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-24 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </li>
              ))}
            </ul>
          ) : loadError ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                {loadError}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void fetchHistory()}
                aria-label="Tentar carregar as aferições novamente"
              >
                <RefreshCw size={13} className="mr-1.5" aria-hidden="true" /> Tentar novamente
              </Button>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <HeartPulse size={20} className="mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">Nenhuma aferição registrada</p>
              <p className="mt-1 text-xs text-muted-foreground">
                O histórico aparece aqui logo após o primeiro registro deste paciente.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((reading) => (
                <li key={reading.id} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <time
                      dateTime={reading.createdAt}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {dateFormatter.format(new Date(reading.createdAt))}
                    </time>
                    <Badge variant="outline" className={`text-[10px] ${RISK_STYLE[reading.riskLevel]}`}>
                      {RISK_LABEL[reading.riskLevel]}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Metric label="PA" value={`${reading.systolic}/${reading.diastolic}`} unit="mmHg" />
                    <Metric label="FC" value={String(reading.heartRate)} unit="bpm" />
                    <Metric label="SpO₂" value={String(reading.spo2)} unit="%" />
                    <Metric
                      label="FR"
                      value={reading.respRate !== undefined ? String(reading.respRate) : "—"}
                      unit={reading.respRate !== undefined ? "rpm" : ""}
                    />
                  </dl>
                  {reading.notes ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{reading.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Subcomponentes UI ---------------------------- */

function Field({
  id,
  label,
  icon,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="text-emerald-600">{icon}</span>
        {label}
        {optional ? <span className="text-muted-foreground">(opcional)</span> : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-bold text-foreground">
        {value}
        {unit ? <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{unit}</span> : null}
      </dd>
    </div>
  );
}

export default ManualVitalSignsForm;
