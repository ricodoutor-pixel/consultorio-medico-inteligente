import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { resetPageScroll } from "@/lib/page-scroll";

// Mounted inside Suspense so lazy-loaded pages reset after their content commits.
export function PageScrollReset() {
  const { key } = useLocation();

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const reset = () => resetPageScroll(window);
    reset();
    const frame = window.requestAnimationFrame(reset);
    window.addEventListener("pageshow", reset);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", reset);
      window.history.scrollRestoration = previous;
    };
  }, [key]);

  return null;
}