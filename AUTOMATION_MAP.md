# 🗺️ AUTOMATION MAP - Planta e Raiz

**Versão:** 1.0 | **Última atualização:** 2026-04-13

---

## 📡 Edge Functions (Supabase)

### 1. Anvisa Automation
**URL:** `POST /functions/v1/anvisa-automation`
```json
// Request
{
  "patientName": "João da Silva",
  "patientCPF": "529.982.247-25",
  "patientEmail": "joao@email.com",
  "patientPhone": "11999998888",
  "doctorName": "Dr. Edilson",
  "doctorCRM": "12345",
  "doctorCRMState": "SP",
  "doctorSpecialty": "Cannabis Medicinal",
  "medicines": [{
    "name": "CBD Oil 10mg",
    "activePrinciple": "Canabidiol",
    "concentration": "10mg/ml",
    "dosage": "20mg/dia",
    "quantity": 1,
    "indication": "Epilepsia refratária"
  }],
  "medicalJustification": "Paciente apresenta epilepsia refratária sem resposta a tratamentos convencionais...",
  "treatmentDuration": "6 meses"
}

// Response 200
{
  "success": true,
  "protocol": "ANV-202604-X8K2M3",
  "status": "submitted",
  "estimatedDays": 7,
  "message": "Solicitação submetida com sucesso."
}
```

### 2. Retention Webhook (ManyChat)
**URL:** `POST /functions/v1/retention-webhook`
```json
// Request
{
  "patientId": "uuid-paciente",
  "daysSinceLastPurchase": 45,
  "daysSinceLastConsultation": 30,
  "npsScore": 4,
  "subscriptionAgeMonths": 2,
  "totalConsultations": 3
}

// Response 200
{
  "patientId": "uuid-paciente",
  "riskScore": 0.82,
  "riskLevel": "critical",
  "couponCode": "VOLTA-X8K2M3",
  "discountPercent": 20,
  "action": "phone_call"
}
```

---

## 🔌 tRPC Endpoints (`trpc.domination.*`)

### 3. Instant Match - Best Doctor
**Procedure:** `domination.findBestMatch`
```json
// Input
{
  "patientId": "uuid",
  "specialty": "cannabis",
  "urgency": "high",
  "location": { "lat": -23.55, "lng": -46.63 }
}

// Output
{
  "doctor": { "id": "d1", "specialty": "Cannabis Medicinal", "rating": 4.8 },
  "score": 95,
  "estimatedWaitTime": 0,
  "matchReasons": ["Especialidade compatível", "Online agora", "Baixa carga"]
}
```

### 4. Digital Franchise - Calculate Revenue
**Procedure:** `domination.calculateRevenue`
```json
// Input
{ "amount": 1000, "monthlyConsultations": 250 }

// Output
{
  "tier": { "level": 3, "name": "Destaque", "doctorShare": 0.90 },
  "doctorEarnings": 900,
  "platformFee": 100,
  "totalAmount": 1000
}
```

### 5. Planta-Coin - Check Balance & Purchase
**Procedure:** `domination.checkCoinPurchase`
```json
// Input
{ "balance": 600, "itemId": "course-advanced" }

// Output
{ "canBuy": true, "item": { "name": "Curso Cannabis Avançado", "costCoins": 500 } }
```

### 6. Quality Seal - Evaluate Doctor
**Procedure:** `domination.evaluateQuality`
```json
// Input
{
  "npsAverage": 9.2,
  "responseRate": 0.95,
  "avgResponseTimeMinutes": 8,
  "certificationsValid": true,
  "complaintsCount": 0,
  "totalConsultations": 300,
  "memberSinceMonths": 6
}

// Output
{
  "score": 9.1,
  "tier": "gold",
  "benefits": ["Badge Ouro", "Destaque na busca", "+2% comissão"],
  "extraCommission": 0.02
}
```

### 7. Wellness Subscription - Apply Discount
**Procedure:** `domination.applyDiscount`
```json
// Input
{ "price": 200, "planId": "premium" }

// Output
{ "originalPrice": 200, "discountedPrice": 160, "discount": 40 }
```

### 8. Retention AI - Calculate Risk
**Procedure:** `domination.calculateRisk`
```json
// Input
{
  "daysSinceLastPurchase": 45,
  "daysSinceLastConsultation": 30,
  "npsScore": 4,
  "subscriptionAgeMonths": 2,
  "totalConsultations": 3
}

// Output
{
  "riskScore": 0.82,
  "riskLevel": "critical",
  "suggestedAction": "phone_call",
  "coupon": { "code": "VOLTA-X8K2M3", "discountPercent": 20 }
}
```

### 9. SEO Content - Get Keywords
**Procedure:** `domination.getKeywords`
```json
// Input
{ "priority": 1 }

// Output
[
  { "keyword": "cannabis medicinal benefícios", "searchVolume": 12000, "difficulty": 35 },
  { "keyword": "receita de cannabis medicinal", "searchVolume": 9000, "difficulty": 40 }
]
```

### 10. Doctor BI - Revenue Projection
**Procedure:** `domination.revenueProjection`
```json
// Input
{ "currentRevenue": 10000, "growthRate": 15, "months": 6 }

// Output
[11500, 13225, 15209, 17490, 20114, 23131]
```

---

## 🔐 Security Notes

- All tRPC endpoints require authentication via Supabase Auth
- Edge Functions validate JWT in-code
- CPF validation uses digit-check algorithm (rejects `000...`, `111...`, etc.)
- RLS policies isolate doctor data (Médico A cannot see Médico B's PlantaCoins or Seal)
- Financial calculations are deterministic and auditable

---

## 📊 Integration Matrix

| Consumer | Endpoint | Protocol |
|----------|----------|----------|
| ManyChat | retention-webhook | POST webhook |
| ManyChat | anvisa-automation | POST webhook |
| Frontend | trpc.domination.* | tRPC over HTTP |
| Mercado Pago | mercadopago-webhook | POST webhook |
| Cron Jobs | growth-engine | Scheduled |
| Cron Jobs | retention-engine | Scheduled |
