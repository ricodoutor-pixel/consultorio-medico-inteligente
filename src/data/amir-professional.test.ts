import { describe, expect, it } from "vitest";
import { professionals } from "./professionals";

describe("Dr. Amir verified public profile", () => {
  it("uses the CFM registrations supplied by Dr. Edilson and the existing doctor record", () => {
    const doctor = professionals.find((p) => p.id === "med-amir-hayel-ali");
    expect(doctor?.name).toBe("Dr. Amir Hayel Ali");
    expect(doctor?.crm).toBe("38430/SC • 57711/PR");
    expect(doctor?.dbId).toBe("933411e3-75b1-4dd6-96a0-9bcb2614829d");
  });
  it("does not invent availability or patient reviews", () => {
    const doctor = professionals.find((p) => p.id === "med-amir-hayel-ali");
    expect(doctor?.online).toBe(true);
    expect(doctor?.slots).toEqual([]);
    expect(doctor?.reviews).toEqual([]);
  });
  it("uses the official portrait supplied by Dr. Edilson, keeping the AA initials as fallback", () => {
    const doctor = professionals.find((p) => p.id === "med-amir-hayel-ali");
    expect(doctor?.imageUrl).toBe("/avatars/dr-amir-ali-jaleco.jpg?v=20261027");
    expect(doctor?.avatar).toBe("AA");
  });
});