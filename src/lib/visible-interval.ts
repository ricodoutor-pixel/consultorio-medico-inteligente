/**
 * setInterval that pauses while the tab is hidden and runs once when it
 * becomes visible again. Avoids backend calls from background tabs.
 * Returns a cleanup function.
 */
export function setVisibleInterval(fn: () => void, ms: number): () => void {
  let id: ReturnType<typeof setInterval> | null = null;
  const start = () => {
    if (id === null) id = setInterval(fn, ms);
  };
  const stop = () => {
    if (id !== null) {
      clearInterval(id);
      id = null;
    }
  };
  const onVis = () => {
    if (document.hidden) stop();
    else {
      fn();
      start();
    }
  };
  if (typeof document === "undefined" || !document.hidden) start();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    stop();
    document.removeEventListener("visibilitychange", onVis);
  };
}
