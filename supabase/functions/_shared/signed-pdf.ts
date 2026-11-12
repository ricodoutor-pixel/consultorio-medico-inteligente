// Minimal structural check that an uploaded file is a digitally signed PDF (e.g. from assinador.iti.br / gov.br):
// PDF header, size cap, and a signature dictionary (/Type /Sig with a /ByteRange). It does not validate the
// certificate chain — that is done by the official validator (validar.iti.gov.br) linked from the prescription.
export const SIGNED_PDF_MAX_BYTES = 10 * 1024 * 1024;

export function isSignedPdf(head: string, body: string, byteLength: number): boolean {
  if (head !== "%PDF-" || byteLength <= 0 || byteLength > SIGNED_PDF_MAX_BYTES) return false;
  return /\/ByteRange\s*\[/.test(body) && /\/Sig\b/.test(body);
}
