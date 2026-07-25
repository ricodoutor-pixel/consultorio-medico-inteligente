const fs = require('fs');
let c = fs.readFileSync('src/integrations/supabase/types.ts', 'utf8');
const fieldsRow = `
          address: Json | null
          approval_status: string | null
          approved_at: string | null
          cpf: string | null
          crm_back_url: string | null
          crm_front_url: string | null
          is_approved: boolean | null
          personal_phone: string | null
          pix_key: string | null
          video_presentation_url: string | null`;
const fieldsOpt = `
          address?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          cpf?: string | null
          crm_back_url?: string | null
          crm_front_url?: string | null
          is_approved?: boolean | null
          personal_phone?: string | null
          pix_key?: string | null
          video_presentation_url?: string | null`;
c = c.replace(/(doctors: \{\s*Row: \{[^}]*)(\n\s*available_hours)/, '$1' + fieldsRow + '$2');
c = c.replace(/(doctors: \{[^}]*Row: \{[^}]*\}[^}]*Insert: \{[^}]*)(\n\s*available_hours)/, '$1' + fieldsOpt + '$2');
c = c.replace(/(doctors: \{[^}]*Row: \{[^}]*\}[^}]*Insert: \{[^}]*\}[^}]*Update: \{[^}]*)(\n\s*available_hours)/, '$1' + fieldsOpt + '$2');
c = c.replace(/(doctors_public: \{\s*Row: \{[^}]*)(\n\s*available_hours)/, '$1' + fieldsRow + '$2');
fs.writeFileSync('src/integrations/supabase/types.ts', c, 'utf8');
console.log('Updated types.ts');
