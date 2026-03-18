/**
 * Utility to mask phone numbers and contact info in displayed text
 * Prevents direct contact exchange between users
 */
export const maskPhone = (text: string): string => {
  // Mask phone patterns: (XX) XXXXX-XXXX, +55 XX XXXXX-XXXX, etc.
  return text.replace(
    /(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/g,
    "📞 [contato via plataforma]"
  );
};

export const maskEmail = (text: string): string => {
  return text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "📧 [contato via plataforma]"
  );
};

export const maskContacts = (text: string): string => {
  return maskEmail(maskPhone(text));
};
