/**
 * Butterworth band-pass 4ª ordem para sinais PPG.
 * Cascata de 2 biquads (cada um é 2ª ordem) → ordem total 4.
 * Faixa: 0.5 Hz (30 BPM) → 3.5 Hz (210 BPM).
 *
 * Implementação RBJ Audio EQ Cookbook (forma direta II transposta),
 * aplicada bidirecionalmente (forward + reverse) para zero phase shift.
 */

interface Biquad {
  b0: number; b1: number; b2: number;
  a1: number; a2: number;
}

/** Cria um biquad band-pass (constant skirt gain, Q controla largura). */
function bandPassBiquad(fs: number, f0: number, q: number): Biquad {
  const w0 = (2 * Math.PI * f0) / fs;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * q);

  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
  };
}

function applyBiquad(input: number[], bq: Biquad): number[] {
  const out = new Array<number>(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = bq.b0 * x0 + bq.b1 * x1 + bq.b2 * x2 - bq.a1 * y1 - bq.a2 * y2;
    x2 = x1; x1 = x0;
    y2 = y1; y1 = y0;
    out[i] = y0;
  }
  return out;
}

/**
 * Filtra um sinal PPG (canal verde médio) com Butterworth band-pass 4ª ordem
 * 0.5–3.5 Hz aplicado forward+backward (zero phase).
 */
export function butterworthBandpassPPG(signal: number[], fs: number): number[] {
  if (signal.length < 8) return signal.slice();

  // 2 estágios em cascata → ordem 4 (Butterworth: Q1 = 0.54, Q2 = 1.31 para fc centrada)
  const fc = Math.sqrt(0.5 * 3.5); // ≈ 1.32 Hz (média geométrica)
  const stage1 = bandPassBiquad(fs, fc, 0.54);
  const stage2 = bandPassBiquad(fs, fc, 1.31);

  // Forward
  let y = applyBiquad(signal, stage1);
  y = applyBiquad(y, stage2);
  // Reverse (zero-phase)
  y.reverse();
  y = applyBiquad(y, stage1);
  y = applyBiquad(y, stage2);
  y.reverse();

  return y;
}
