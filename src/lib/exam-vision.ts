import { supabase } from "@/integrations/supabase/client";

export type VisionExamType = "fundoscopy" | "dermatoscopy" | "mobility";
export type VisionAttention = "sem_sinais" | "acompanhar" | "atencao" | "urgente" | "indeterminado";

/** Leitura real da imagem feita pela função brisa-exam-vision. Nunca é gerada no navegador. */
export interface VisionAnalysis {
  exam_type: VisionExamType;
  image_ok: boolean;
  image_problem: string;
  attention: VisionAttention;
  observations: string[];
  measurements: { label: string; value: string }[];
  brisa_summary: string;
  orientation: string[];
  doctor_advice: string;
  analyzed_at: string;
}

export class VisionExamError extends Error {
  constructor(public code: "login" | "limite" | "indisponivel") {
    super(code);
  }
}

const MAX_SIDE = 1280;

function drawToJpeg(source: CanvasImageSource, width: number, height: number): string | null {
  if (!width || !height) return null;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Foto do quadro atual da câmera, como data URL JPEG. Null se a câmera ainda não entregou imagem. */
export function captureVideoFrame(video: HTMLVideoElement | null): string | null {
  if (!video) return null;
  return drawToJpeg(video, video.videoWidth, video.videoHeight);
}

/** Foto escolhida da galeria, reduzida e convertida para JPEG. */
export async function fileToJpegDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("imagem_invalida"));
      img.src = url;
    });
    return drawToJpeg(img, img.naturalWidth, img.naturalHeight);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Envia a foto para a leitura da Brisa. Lança VisionExamError; nunca devolve resultado inventado. */
export async function analyzeExamImage(
  examType: VisionExamType,
  jpegDataUrl: string,
  context: Record<string, unknown> = {},
): Promise<VisionAnalysis> {
  const { data, error } = await supabase.functions.invoke("brisa-exam-vision", {
    body: {
      exam_type: examType,
      image_base64: jpegDataUrl.split(",")[1] ?? "",
      mime_type: "image/jpeg",
      context,
    },
  });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 401) throw new VisionExamError("login");
    if (status === 429) throw new VisionExamError("limite");
    throw new VisionExamError("indisponivel");
  }
  if (!data?.ok || !data.analysis) throw new VisionExamError("indisponivel");
  return data.analysis as VisionAnalysis;
}

/** Converte o nível de atenção para o campo risk_level já usado em diagnostic_exams. */
export function attentionToRiskLevel(attention: VisionAttention): string {
  if (attention === "urgente") return "alto";
  if (attention === "atencao") return "moderado";
  if (attention === "indeterminado") return "indeterminado";
  return "baixo";
}
