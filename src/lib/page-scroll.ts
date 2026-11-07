export function resetPageScroll(target: Pick<Window, "scrollTo" | "document">) {
  target.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const root = target.document.scrollingElement;
  if (root) {
    root.scrollTop = 0;
    root.scrollLeft = 0;
  }
}