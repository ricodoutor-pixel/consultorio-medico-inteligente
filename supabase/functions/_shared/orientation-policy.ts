export const REPORT_WAIT_LIMIT_MS = 60_000;
export function canReadEducationalReport(status: string, released: boolean) {
  return status === "approved" || (status === "draft" && released);
}
export function orientationTimeStage(seconds: number) {
  return seconds <= 0 ? "ended" : seconds < 300 ? "closing" : "conversation";
}