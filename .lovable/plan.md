# Plano — Google Maps Platform em Planta y Raiz

Antes de escrever código quero alinhar 4 pontos para não desperdiçar créditos nem quebrar layout.

## Escopo confirmado

**Feature 1 — DeliveryTrackerMap** (Shopping + Club)
- Novo componente `src/components/logistics/DeliveryTrackerMap.tsx` (Maps JS + Routes API via gateway).
- Origem: farmácia fixa (definir CEP/endereço padrão — ver pergunta 1).
- Destino: endereço do pedido (do `orders`/`vendor_transactions`).
- Exibe rota, distância, ETA. Sem tracking GPS do entregador (não temos dados de motorista) — ETA é do Routes API.
- Onde renderizar: card "Meus Pedidos" em `Shopping.tsx` e `ClubFeed.tsx`.

**Feature 2 — Smart Address Autocomplete**
- Novo componente `src/components/forms/AddressAutocomplete.tsx` usando **Places API (New)** `PlaceAutocompleteElement` (regra Lovable: não usar legacy Autocomplete).
- Preenche rua, bairro, cidade, estado, CEP, país + lat/lng ocultos.
- Aplicar em: `CadastroProfissional.tsx`, checkout do Shopping, onboarding do paciente (`Onboarding.tsx` se houver campo endereço).

**Feature 3 — AirQualityWidget**
- Novo `src/components/health/AirQualityWidget.tsx` no dashboard do paciente (`DashboardPaciente.tsx`).
- Chama edge function `air-quality-lookup` (nova) que consulta `/airquality/v1/currentConditions:lookup` via gateway.
- UI: badge colorida por AQI + alerta clínico sobre vaporização quando AQI ruim.

**Feature 4 — Doctors Near Me + Timezone Match**
- Mini-mapa em `Profissionais.tsx` / página de agendamento com pins dos médicos (usa `doctors_public.latitude/longitude` — já existe).
- No agendamento: converter horário exibido usando `timezone` do paciente e do médico (Google Time Zone API via gateway, cache por `user_id` em `profiles.timezone`).

## Arquitetura compartilhada

- **Loader único**: novo `src/lib/google-maps-loader.ts` (singleton Promise) usado por todos os mapas. Vou manter o padrão atual (script tag manual + callback) que já está em `GlobalOperationsMap.tsx` — sem adicionar `@react-google-maps/api` (dependência a mais e o padrão da casa já é vanilla loader). Se preferir a lib, aviso na pergunta 4.
- **Edge functions** para chamadas server-side (Routes, Air Quality, Time Zone, Geocoding) via `connector-gateway.lovable.dev/google_maps` com `LOVABLE_API_KEY` + `GOOGLE_MAPS_API_KEY`.
- **Browser key**: `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` já no `.env` — usado só para Maps JS + Places Autocomplete no cliente.
- **Fallback**: se `navigator.geolocation` for negado, mostrar campo manual de CEP.
- **Loading states**: skeleton em todos os widgets.

## Arquivos a criar

- `src/lib/google-maps-loader.ts`
- `src/components/logistics/DeliveryTrackerMap.tsx`
- `src/components/forms/AddressAutocomplete.tsx`
- `src/components/health/AirQualityWidget.tsx`
- `src/components/doctors/DoctorsNearMeMap.tsx`
- `supabase/functions/maps-route-eta/index.ts`
- `supabase/functions/air-quality-lookup/index.ts`
- `supabase/functions/maps-timezone/index.ts`

## Arquivos a editar

- `src/pages/Shopping.tsx` — DeliveryTrackerMap em pedidos ativos
- `src/pages/ClubFeed.tsx` — idem
- `src/pages/CadastroProfissional.tsx` — AddressAutocomplete
- `src/pages/DashboardPaciente.tsx` — AirQualityWidget
- `src/pages/Profissionais.tsx` — DoctorsNearMeMap
- Página de agendamento — exibição com fuso horário do paciente
- `supabase/config.toml` — registrar as 3 edge functions

## Perguntas antes de executar

1. **Endereço da farmácia/CDD de origem** para o DeliveryTrackerMap — qual CEP/cidade usar como ponto A? (Sugestão: usar o endereço cadastrado do Dr. Edilson ou um CEP fixo em SP.)
2. **Página de agendamento** — é `AgendamentoConsulta.tsx`, `Agendar.tsx`, ou outra? Preciso confirmar o arquivo para aplicar o timezone match.
3. **Formulário de onboarding do paciente** tem campo endereço hoje? Ou só CEP? Aplico Autocomplete em quais formulários exatamente?
4. **Loader**: mantenho vanilla (padrão atual do projeto, zero deps) ou você prefere que eu adicione `@react-google-maps/api`? Recomendo manter vanilla.

Assim que responder essas 4, executo tudo em sequência (criar arquivos, editar páginas, deploy das edge functions) e devolvo o log de conclusão.
