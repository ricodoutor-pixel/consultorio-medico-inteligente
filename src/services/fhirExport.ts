/**
 * Utilitário de Interoperabilidade e Exportação em Padrão HL7 FHIR R4
 * Em conformidade com a RNDS (Rede Nacional de Dados em Saúde - Ministério da Saúde)
 */

export interface FhirExportParams {
  record: {
    id: string;
    created_at: string;
    chief_complaint?: string | null;
    diagnosis?: string | null;
    diagnosis_cid?: string | null;
    treatment_plan?: string | null;
    prescricao_snapshot?: any;
    record_hash?: string | null;
  };
  patient?: {
    id?: string;
    name?: string;
    cpf?: string;
    cns?: string; // Cartão Nacional de Saúde
    birthDate?: string;
    gender?: "male" | "female" | "other" | "unknown";
  };
  practitioner?: {
    id?: string;
    name?: string;
    crm?: string;
    crm_state?: string;
  };
  medications?: Array<{
    name: string;
    dosage?: string;
    instructions?: string;
  }>;
}

export function generateFhirR4Bundle(params: FhirExportParams): any {
  const { record, patient, practitioner, medications = [] } = params;
  const bundleId = `bundle-pep-${record.id}`;
  const timestamp = new Date().toISOString();

  const patientResourceId = patient?.id || `patient-${record.id.slice(0, 8)}`;
  const practitionerResourceId = practitioner?.id || `practitioner-${record.id.slice(0, 8)}`;
  const conditionResourceId = `condition-${record.id.slice(0, 8)}`;

  const bundleEntries: any[] = [];

  // 1. Resource: Patient
  bundleEntries.push({
    fullUrl: `urn:uuid:${patientResourceId}`,
    resource: {
      resourceType: "Patient",
      id: patientResourceId,
      identifier: [
        ...(patient?.cpf ? [{
          use: "official",
          system: "https://saude.gov.br/fhir/r4/StructureDefinition/BRDivulgacaoCPF",
          value: patient.cpf.replace(/\D/g, ""),
        }] : []),
        ...(patient?.cns ? [{
          use: "secondary",
          system: "https://saude.gov.br/fhir/r4/StructureDefinition/BRCartaoNacionalSaude",
          value: patient.cns,
        }] : []),
      ],
      name: [
        {
          use: "official",
          text: patient?.name || "Paciente Planta & Raiz",
        },
      ],
      birthDate: patient?.birthDate || undefined,
      gender: patient?.gender || "unknown",
    },
  });

  // 2. Resource: Practitioner
  bundleEntries.push({
    fullUrl: `urn:uuid:${practitionerResourceId}`,
    resource: {
      resourceType: "Practitioner",
      id: practitionerResourceId,
      identifier: [
        {
          use: "official",
          system: "http://portal.cfm.org.br",
          value: practitioner?.crm || "CRM Não informado",
          extension: practitioner?.crm_state ? [
            {
              url: "http://saude.gov.br/fhir/r4/StructureDefinition/BRUFConselhoProfissional",
              valueCode: practitioner.crm_state,
            }
          ] : [],
        },
      ],
      name: [
        {
          use: "official",
          text: practitioner?.name || "Médico Prescritor",
        },
      ],
    },
  });

  // 3. Resource: Condition (CID-10 / CID-11)
  bundleEntries.push({
    fullUrl: `urn:uuid:${conditionResourceId}`,
    resource: {
      resourceType: "Condition",
      id: conditionResourceId,
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active",
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "encounter-diagnosis",
              display: "Encounter Diagnosis",
            },
          ],
        },
      ],
      code: {
        coding: [
          ...(record.diagnosis_cid ? [{
            system: "http://hl7.org/fhir/sid/icd-10",
            code: record.diagnosis_cid,
            display: record.diagnosis || "Condição Clínica Diagnosticada",
          }] : []),
        ],
        text: record.diagnosis || record.chief_complaint || "Orientação Clínica Canabinoide",
      },
      subject: {
        reference: `urn:uuid:${patientResourceId}`,
        display: patient?.name || "Paciente",
      },
      recorder: {
        reference: `urn:uuid:${practitionerResourceId}`,
        display: practitioner?.name || "Médico Prescritor",
      },
      recordedDate: record.created_at,
    },
  });

  // 4. Resource: MedicationRequest
  medications.forEach((med, idx) => {
    const medReqId = `medreq-${record.id.slice(0, 8)}-${idx + 1}`;
    bundleEntries.push({
      fullUrl: `urn:uuid:${medReqId}`,
      resource: {
        resourceType: "MedicationRequest",
        id: medReqId,
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          text: med.name,
        },
        subject: {
          reference: `urn:uuid:${patientResourceId}`,
        },
        requester: {
          reference: `urn:uuid:${practitionerResourceId}`,
        },
        dosageInstruction: [
          {
            text: med.dosage || med.instructions || "Conforme orientação médica",
          },
        ],
        authoredOn: record.created_at,
      },
    });
  });

  return {
    resourceType: "Bundle",
    id: bundleId,
    meta: {
      lastUpdated: timestamp,
      profile: ["https://saude.gov.br/fhir/r4/StructureDefinition/BRRegistroAtendimentoClinico"],
      security: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "R",
          display: "Restricted",
        },
      ],
    },
    type: "document",
    timestamp: timestamp,
    entry: bundleEntries,
    signature: record.record_hash ? {
      type: [
        {
          system: "urn:iso-astm:E1762-95:2013",
          code: "1.2.840.10065.1.12.1.1",
          display: "Author's Signature",
        },
      ],
      when: record.created_at,
      data: record.record_hash,
    } : undefined,
  };
}

export function downloadFhirBundleJson(params: FhirExportParams): void {
  const bundle = generateFhirR4Bundle(params);
  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: "application/fhir+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prontuario-fhir-r4-${params.record.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
