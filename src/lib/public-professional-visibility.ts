type PublicIdentity = {
  id?: string;
  name?: string | null;
  full_name?: string | null;
  crm?: string | null;
  crm_state?: string | null;
};

// Explicit withdrawals apply only to public discovery, never medical records.
const withdrawals = [
  { id: "med-leuma-netta", name: "leuma leao netta", number: "85182", state: "MG" },
  { id: "med-ana-paula", name: "ana paula ferreira lima", number: "36942", state: "PR" },
];

export function isPublicProfessionalVisible(identity: PublicIdentity): boolean {
  const name = (identity.name || identity.full_name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/^(?:(?:dra|dr|profa|prof)\.?\s+)+/, "")
    .trim().replace(/\s+/g, " ");
  const registration = identity.crm || "";
  const number = registration.match(/\d[\d.]*/)?.[0].replace(/\D/g, "") || "";
  const state = (identity.crm_state || registration.match(/(?:\/|\s-\s)\s*([a-z]{2})\b/i)?.[1] || "").toUpperCase();
  return !withdrawals.some((entry) =>
    identity.id === entry.id || name === entry.name ||
    (number === entry.number && state === entry.state),
  );
}