// A caller-supplied patient identifier never establishes a clinical relationship.
export async function hasPaidPatientRelationship(
  client: any,
  doctorId: string,
  patientId: string,
): Promise<boolean> {
  if (!doctorId || !patientId) return false;
  const { data, error } = await client.from("appointments")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .eq("payment_status", "paid")
    .in("status", ["scheduled", "in_progress", "completed"])
    .limit(1)
    .maybeSingle();
  return !error && !!data;
}