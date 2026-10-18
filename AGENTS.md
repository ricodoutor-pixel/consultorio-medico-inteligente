# Project architecture rules

- The Orientation flow stores the completed triage before creating its Mercado Pago order, and unlocks service only from an approved webhook status; this prevents unpaid or context-free clinical sessions.
- Public medical listings maintain base professional profiles from src/data/professionals.ts as the baseline and enrich with real-time status from approved backend records, ensuring vitrine doctors never disappear during network or backend desyncs.
- Appointment routing uses the real server-returned doctor or the selected public record, and availability uses persisted slots only; synthetic identifiers cannot satisfy appointment foreign keys.
- Telemedicine checkout records a pending appointment and uses mp-checkout with server-enforced modality prices; access proceeds only after reading the patient's paid appointment, never from a receipt button or payment error.
- Service worker updates never force a page reload; cache only same-origin static files and reuse hash-versioned bundles while keeping HTML network-first, so reopens are faster without interrupting active care or payments.