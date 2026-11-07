import { describe, it, expect } from "vitest";
import { orientationCode, reportAttendanceCode, enforceAttendanceCode } from "../../supabase/functions/_shared/orientation-code";

describe("attendance identity", () => {
  it("uses the same persisted order identifier for repeated generations", () => {
    expect(orientationCode("bb3dee98-1111-4444-9999-111111111111")).toBe("OT-BB3DEE98");
    expect(orientationCode("bb3dee98-1111-4444-9999-111111111111")).toBe("OT-BB3DEE98");
  });
  it("keeps historical body code for header and filename without altering history", () => {
    expect(reportAttendanceCode({ content_md: "Código do atendimento: OT-BB3DEE98", verification_code: null, session_id: "0cb2f8a3-1234" })).toBe("OT-BB3DEE98");
  });
  it("normalizes generated codes before hashing and saving", () => {
    expect(enforceAttendanceCode("Código OT-0CB2F8A3; OT-BB3DEE98", "OT-BB3DEE98")).toBe("Código OT-BB3DEE98; OT-BB3DEE98");
  });
});