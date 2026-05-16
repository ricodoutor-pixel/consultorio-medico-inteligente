---
name: Doctor Endorsed Products Badge
description: Selo "Indicado pelo Dr. Edilson" em vendor_products controlado por admin
type: feature
---
Coluna `vendor_products.endorsed_by_doctor` (BOOLEAN, default false) marca produtos auditados pelo Dr. Edilson.

**Proteção:** trigger `block_vendor_product_endorsement_tamper` impede que qualquer usuário não-admin altere o campo. Service-role e admins têm bypass.

**Frontend:** `src/components/DoctorEndorsedBadge.tsx` renderiza o selo verde. Exibido em `src/pages/Shopping.tsx`:
- Grid: badge compacto ao lado de FRETE GRÁTIS
- Lista: abaixo do título do produto
- Detalhe: badge completo abaixo do H1

Para ativar: `UPDATE vendor_products SET endorsed_by_doctor=true WHERE id='...'` (apenas admin).
