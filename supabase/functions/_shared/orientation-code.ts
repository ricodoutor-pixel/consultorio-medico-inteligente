/** Stable code from the already persisted attendance/order identifier. */
export function orientationCode(id: string): string {
  return `OT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Preserve the code on a historical report rather than rewriting its clinical content. */
export function reportAttendanceCode(report: { verification_code?: string | null; content_md: string; session_id: string }): string {
  return report.content_md.match(/\bOT-[A-Z0-9]{8}\b/i)?.[0]?.toUpperCase()
    || report.verification_code || orientationCode(report.session_id);
}

export function enforceAttendanceCode(content: string, code: string): string {
  return content.replace(/\bOT-[A-Z0-9]{8}\b/gi, code);
}