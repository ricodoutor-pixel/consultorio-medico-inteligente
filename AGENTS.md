# Project architecture rules

- The Orientation flow stores the completed triage before creating its Mercado Pago order, and unlocks service only from an approved webhook status; this prevents unpaid or context-free clinical sessions.
- Public medical listings derive from approved backend records and exclude veterinary registrations from human-care views; this preserves clinical scope and a single source of truth.
- Appointment routing uses the real server-returned doctor or the selected public record, and availability uses persisted slots only; synthetic identifiers cannot satisfy appointment foreign keys.