import { describe, it, expect } from "vitest";
import { directoryBadge, compareDirectoryDoctors } from "./doctor-directory-badges";

describe("directory badges", () => {
  const now = Date.parse("2026-11-17T04:08:00Z");
  it("Premium requires a paid term still in force", () => {
    expect(directoryBadge({ paid_until: "2026-12-08T00:00:00Z" }, now)).toBe("premium");
    expect(directoryBadge({ paid_until: "2026-11-05T00:00:00Z" }, now)).toBe(null);
    expect(directoryBadge(undefined, now)).toBe(null);
  });
  it("VIP requires complete registration, not just attachments or a name", () => {
    expect(directoryBadge({ registration_complete: true }, now)).toBe("vip");
    expect(directoryBadge({ registration_complete: false, documents_count: 20 }, now)).toBe(null);
  });
  it("Premium precedes VIP, then others by attachments without pinned names", () => {
    const doctors = [
      { name: "Victor Fonseca", documentsCount: 1 },
      { name: "Normal", documentsCount: 4 },
      { name: "VIP", directoryBadge: "vip" as const, documentsCount: 8 },
      { name: "Premium", directoryBadge: "premium" as const, documentsCount: 2 },
    ];
    expect(doctors.sort(compareDirectoryDoctors).map(d => d.name)).toEqual(["Premium", "VIP", "Normal", "Victor Fonseca"]);
  });
  it("attachments order doctors within each badge category", () => {
    expect(compareDirectoryDoctors({name:"A", directoryBadge:"premium", documentsCount:2}, {name:"B", directoryBadge:"premium", documentsCount:5})).toBeGreaterThan(0);
  });
  it("uses the server's public badge without inventing expiration dates", () => {
    expect(directoryBadge({ badge: "premium" }, now)).toBe("premium");
    expect(directoryBadge({ badge: null }, now)).toBe(null);
  });
  it("keeps server ordering without exposing private attachment counts", () => {
    expect(compareDirectoryDoctors({ name: "A", directoryBadge: null, directoryRank: 3 }, { name: "B", directoryBadge: null, directoryRank: 2 })).toBeGreaterThan(0);
  });
});