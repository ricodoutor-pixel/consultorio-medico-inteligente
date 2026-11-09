import { describe, expect, it, vi } from "vitest";
import { resetPageScroll } from "./page-scroll";

describe("page entry position", () => {
  it("opens at the top instead of restoring the middle or footer", () => {
    const root = { scrollTop: 2400, scrollLeft: 30 };
    const scrollTo = vi.fn();
    resetPageScroll({ scrollTo, document: { scrollingElement: root } } as unknown as Pick<Window, "scrollTo" | "document">);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(root.scrollTop).toBe(0);
    expect(root.scrollLeft).toBe(0);
  });
});