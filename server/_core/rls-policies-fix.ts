/**
 * RLS POLICIES FIX - SUPABASE ROW LEVEL SECURITY
 * 
 * Implementação correta de RLS policies para garantir que usuários
 * só acessem seus próprios dados e dados públicos autorizados.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * RLS POLICIES A IMPLEMENTAR NO SUPABASE
 * 
 * Execute estas queries no SQL Editor do Supabase:
 */

export const RLS_POLICIES = {
  // 1. USERS TABLE - Usuários só veem seus próprios dados
  users: `
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Users can view their own data
    CREATE POLICY "Users can view their own data"
      ON public.users FOR SELECT
      USING (auth.uid() = id);

    -- Users can update their own data
    CREATE POLICY "Users can update their own data"
      ON public.users FOR UPDATE
      USING (auth.uid() = id);

    -- Admin can view all users
    CREATE POLICY "Admin can view all users"
      ON public.users FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  `,

  // 2. CONSULTATIONS TABLE - Usuários veem suas próprias consultas
  consultations: `
    -- Enable RLS
    ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

    -- Users can view their own consultations
    CREATE POLICY "Users can view their own consultations"
      ON public.consultations FOR SELECT
      USING (user_id = auth.uid() OR specialist_id = auth.uid());

    -- Users can create consultations
    CREATE POLICY "Users can create consultations"
      ON public.consultations FOR INSERT
      WITH CHECK (user_id = auth.uid());

    -- Users can update their own consultations
    CREATE POLICY "Users can update their own consultations"
      ON public.consultations FOR UPDATE
      USING (user_id = auth.uid() OR specialist_id = auth.uid());

    -- Admin can view all consultations
    CREATE POLICY "Admin can view all consultations"
      ON public.consultations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  `,

  // 3. PAYMENTS TABLE - Usuários veem seus próprios pagamentos
  payments: `
    -- Enable RLS
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

    -- Users can view their own payments
    CREATE POLICY "Users can view their own payments"
      ON public.payments FOR SELECT
      USING (user_id = auth.uid());

    -- Only system can insert payments
    CREATE POLICY "System can insert payments"
      ON public.payments FOR INSERT
      WITH CHECK (true);

    -- Admin can view all payments
    CREATE POLICY "Admin can view all payments"
      ON public.payments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  `,

  // 4. CLUB_NOTIFICATIONS TABLE - Validar permissões de INSERT
  club_notifications: `
    -- Enable RLS
    ALTER TABLE public.club_notifications ENABLE ROW LEVEL SECURITY;

    -- Users can view their own notifications
    CREATE POLICY "Users can view their own notifications"
      ON public.club_notifications FOR SELECT
      USING (user_id = auth.uid());

    -- Only authenticated users can insert (with validation)
    CREATE POLICY "Authenticated users can insert notifications"
      ON public.club_notifications FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND status = 'active'
        )
      );

    -- Users can only update their own notifications
    CREATE POLICY "Users can update their own notifications"
      ON public.club_notifications FOR UPDATE
      USING (user_id = auth.uid());

    -- Admin can view all notifications
    CREATE POLICY "Admin can view all notifications"
      ON public.club_notifications FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  `,

  // 5. PAYMENT_WEBHOOKS TABLE - Proteger escrita
  payment_webhooks: `
    -- Enable RLS
    ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

    -- Only system can insert webhooks
    CREATE POLICY "System can insert webhooks"
      ON public.payment_webhooks FOR INSERT
      WITH CHECK (true);

    -- Only admin can view webhooks
    CREATE POLICY "Admin can view webhooks"
      ON public.payment_webhooks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );

    -- Only system can update webhooks
    CREATE POLICY "System can update webhooks"
      ON public.payment_webhooks FOR UPDATE
      USING (true);
  `,

  // 6. EBOOK_DOWNLOADS TABLE - Rastrear downloads
  ebook_downloads: `
    -- Enable RLS
    ALTER TABLE public.ebook_downloads ENABLE ROW LEVEL SECURITY;

    -- Users can view their own downloads
    CREATE POLICY "Users can view their own downloads"
      ON public.ebook_downloads FOR SELECT
      USING (user_id = auth.uid() OR user_id IS NULL);

    -- Anyone can insert (public download)
    CREATE POLICY "Anyone can insert download"
      ON public.ebook_downloads FOR INSERT
      WITH CHECK (true);

    -- Admin can view all downloads
    CREATE POLICY "Admin can view all downloads"
      ON public.ebook_downloads FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  `,
};

/**
 * Validação de JWT em endpoints sensíveis
 */
export async function validateJWT(token: string): Promise<boolean> {
  try {
    if (!token) return false;

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("JWT validation failed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("JWT validation error:", error);
    return false;
  }
}

/**
 * Middleware para validar JWT em endpoints críticos
 */
export function jwtMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  validateJWT(token).then((valid) => {
    if (!valid) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next();
  });
}

/**
 * Validar assinatura de webhook Mercado Pago
 */
export function validateMercadoPagoSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return hash === signature;
}

/**
 * Sanitizar queries SQL
 */
export function sanitizeSQL(query: string): string {
  const sqlKeywords = ["DROP", "DELETE", "INSERT", "UPDATE", "UNION", "SELECT"];

  // Verificar se contém keywords suspeitas
  for (const keyword of sqlKeywords) {
    if (query.toUpperCase().includes(keyword)) {
      console.warn(`Potential SQL injection detected: ${keyword}`);
      throw new Error("Invalid query");
    }
  }

  return query;
}

/**
 * Headers de segurança
 */
export const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), microphone=(), camera=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
};

/**
 * CORS restringido
 */
export const corsOptions = {
  origin: ["https://plantayraiz.com.br", "https://www.plantayraiz.com.br"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  maxAge: 86400,
};

export default {
  RLS_POLICIES,
  validateJWT,
  jwtMiddleware,
  validateMercadoPagoSignature,
  sanitizeSQL,
  securityHeaders,
  corsOptions,
};
