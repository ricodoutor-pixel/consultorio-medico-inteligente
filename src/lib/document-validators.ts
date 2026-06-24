import { validateCPF } from "./validators";

export type DocumentType = "cpf" | "passport" | "rne" | "ci";

/** Validate Cédula de Identidad boliviana (5-10 dígitos, opcional sufijo de departamento) */
export const validateCI = (ci: string): boolean => {
  return /^\d{5,10}(-?[A-Z]{2})?$/i.test(ci.replace(/\s/g, ""));
};

/** Format CPF as 000.000.000-00 */
export const formatCPFInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
};

/** Format RNE as X000000-0 */
export const formatRNEInput = (value: string): string => {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
  if (cleaned.length <= 7) return cleaned;
  return `${cleaned.slice(0, 7)}-${cleaned.slice(7)}`;
};

/** Validate passport format (1-2 letters + 6-9 digits) */
export const validatePassport = (passport: string): boolean => {
  return /^[A-Z]{1,2}\d{6,9}$/i.test(passport.replace(/\s/g, ""));
};

/** Validate RNE format (1 letter + 6 digits + 1 alphanumeric) */
export const validateRNE = (rne: string): boolean => {
  return /^[A-Z]\d{6}[A-Z0-9]$/i.test(rne.replace(/[\s-]/g, ""));
};

/** Validate any document by type */
export const validateDocument = (type: DocumentType, value: string): { valid: boolean; message: string } => {
  const cleaned = value.replace(/[\s.-]/g, "");
  
  switch (type) {
    case "cpf":
      return {
        valid: validateCPF(cleaned),
        message: validateCPF(cleaned) ? "CPF válido ✓" : "CPF inválido (verifique os dígitos)",
      };
    case "passport":
      return {
        valid: validatePassport(cleaned),
        message: validatePassport(cleaned) ? "Passaporte válido ✓" : "Formato inválido (ex: AB1234567)",
      };
    case "rne":
      return {
        valid: validateRNE(cleaned),
        message: validateRNE(cleaned) ? "RNE válido ✓" : "Formato inválido (ex: V123456A)",
      };
    case "ci":
      return {
        valid: validateCI(cleaned),
        message: validateCI(cleaned) ? "Cédula válida ✓" : "Formato inválido (ej: 1234567 ó 1234567-LP)",
      };
  }
};

/** Get placeholder text for document input */
export const getDocumentPlaceholder = (type: DocumentType): string => {
  switch (type) {
    case "cpf": return "000.000.000-00";
    case "passport": return "AB1234567";
    case "rne": return "V123456A";
    case "ci": return "1234567-LP";
  }
};

/** Get label for document input */
export const getDocumentLabel = (type: DocumentType): string => {
  switch (type) {
    case "cpf": return "CPF";
    case "passport": return "Nº do Passaporte";
    case "rne": return "RNE (Registro Nacional de Estrangeiro)";
    case "ci": return "Cédula de Identidad (CI)";
  }
};
