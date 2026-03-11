/**
 * ICD-11 (CID-11) — WHO International Classification of Diseases, 11th Revision
 * Used alongside CID-10 for global interoperability (HL7 FHIR compatible)
 */
export interface ICD11Code {
  code: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  category: string;
}

export const ICD11_CODES: ICD11Code[] = [
  // Mental & Behavioural
  { code: "6A70", name_pt: "Transtorno de ansiedade generalizada", name_en: "Generalised anxiety disorder", name_es: "Trastorno de ansiedad generalizada", category: "Mental" },
  { code: "6A70.Z", name_pt: "Transtorno de ansiedade não especificado", name_en: "Anxiety disorder, unspecified", name_es: "Trastorno de ansiedad no especificado", category: "Mental" },
  { code: "6A71", name_pt: "Transtorno de pânico", name_en: "Panic disorder", name_es: "Trastorno de pánico", category: "Mental" },
  { code: "6A72", name_pt: "Agorafobia", name_en: "Agoraphobia", name_es: "Agorafobia", category: "Mental" },
  { code: "6A80", name_pt: "Episódio depressivo único", name_en: "Single episode depressive disorder", name_es: "Episodio depresivo único", category: "Mental" },
  { code: "6A81", name_pt: "Transtorno depressivo recorrente", name_en: "Recurrent depressive disorder", name_es: "Trastorno depresivo recurrente", category: "Mental" },
  { code: "6B40", name_pt: "Transtorno de estresse pós-traumático", name_en: "Post-traumatic stress disorder", name_es: "Trastorno de estrés postraumático", category: "Mental" },
  { code: "6A05", name_pt: "Transtorno do espectro autista", name_en: "Autism spectrum disorder", name_es: "Trastorno del espectro autista", category: "Neurodesenv." },
  { code: "6A05.0", name_pt: "TEA sem deficiência intelectual", name_en: "ASD without intellectual disability", name_es: "TEA sin discapacidad intelectual", category: "Neurodesenv." },
  { code: "6D10", name_pt: "Insônia crônica", name_en: "Chronic insomnia", name_es: "Insomnio crónico", category: "Sono" },
  // Neurological
  { code: "8A80", name_pt: "Enxaqueca sem aura", name_en: "Migraine without aura", name_es: "Migraña sin aura", category: "Neurológico" },
  { code: "8A80.1", name_pt: "Enxaqueca com aura", name_en: "Migraine with aura", name_es: "Migraña con aura", category: "Neurológico" },
  { code: "8A60", name_pt: "Epilepsia", name_en: "Epilepsy", name_es: "Epilepsia", category: "Neurológico" },
  { code: "8A00", name_pt: "Doença de Parkinson", name_en: "Parkinson disease", name_es: "Enfermedad de Parkinson", category: "Neurológico" },
  { code: "8A40", name_pt: "Esclerose múltipla", name_en: "Multiple sclerosis", name_es: "Esclerosis múltiple", category: "Neurológico" },
  // Pain
  { code: "MG30", name_pt: "Dor crônica", name_en: "Chronic pain", name_es: "Dolor crónico", category: "Dor" },
  { code: "MG30.0", name_pt: "Dor crônica primária", name_en: "Chronic primary pain", name_es: "Dolor crónico primario", category: "Dor" },
  { code: "MG30.3", name_pt: "Dor neuropática crônica", name_en: "Chronic neuropathic pain", name_es: "Dolor neuropático crónico", category: "Dor" },
  { code: "ME84", name_pt: "Fibromialgia", name_en: "Fibromyalgia", name_es: "Fibromialgia", category: "Dor" },
  { code: "ME84.0", name_pt: "Síndrome fibromiálgica", name_en: "Fibromyalgia syndrome", name_es: "Síndrome fibromiálgico", category: "Dor" },
  // Musculoskeletal
  { code: "ME84.Y", name_pt: "Dor musculoesquelética crônica", name_en: "Chronic musculoskeletal pain", name_es: "Dolor musculoesquelético crónico", category: "Musculoesquelético" },
  // Gastrointestinal
  { code: "DD91", name_pt: "Síndrome do intestino irritável", name_en: "Irritable bowel syndrome", name_es: "Síndrome del intestino irritable", category: "Gastrointestinal" },
  // Cannabis-specific therapeutic codes
  { code: "HA60", name_pt: "Espasticidade", name_en: "Spasticity", name_es: "Espasticidad", category: "Cannabis Terapêutica" },
  { code: "NF01", name_pt: "Náusea e vômito por quimioterapia", name_en: "Chemotherapy-induced nausea", name_es: "Náusea por quimioterapia", category: "Cannabis Terapêutica" },
  { code: "5A11", name_pt: "Diabetes mellitus tipo 2", name_en: "Type 2 diabetes mellitus", name_es: "Diabetes mellitus tipo 2", category: "Endócrino" },
];

export const CID10_TO_ICD11_MAP: Record<string, string> = {
  "F41.1": "6A70",
  "F32.0": "6A80",
  "F32.1": "6A80",
  "G43.0": "8A80",
  "G40.0": "8A60",
  "R52": "MG30",
  "M54.5": "ME84.Y",
  "G47.0": "6D10",
  "F90.0": "6A05",
  "G20": "8A00",
  "M79.7": "ME84",
  "F43.1": "6B40",
  "K58": "DD91",
  "G35": "8A40",
};
