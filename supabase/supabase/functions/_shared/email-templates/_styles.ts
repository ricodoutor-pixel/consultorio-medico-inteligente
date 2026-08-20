// Shared brand styles for Planta y Raiz auth emails
// Email body MUST be white (#ffffff) per delivery best practices.

export const BRAND = {
  name: 'Planta y Raiz',
  primary: '#17C385', // hsl(152 80% 45%)
  primaryDark: '#1B4332',
  foreground: '#0F1B14',
  muted: '#5B6B63',
  border: '#E5EEE9',
  radius: '14px',
  font:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}

export const styles = {
  main: { backgroundColor: '#ffffff', fontFamily: BRAND.font, margin: 0, padding: 0 },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 28px',
  },
  brandBar: {
    display: 'inline-block',
    padding: '6px 14px',
    backgroundColor: BRAND.primary,
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 700 as const,
    letterSpacing: '0.08em',
    borderRadius: '999px',
    textTransform: 'uppercase' as const,
    marginBottom: '24px',
  },
  h1: {
    fontSize: '24px',
    fontWeight: 700 as const,
    color: BRAND.foreground,
    margin: '0 0 16px',
    lineHeight: '1.3',
  },
  text: {
    fontSize: '15px',
    color: BRAND.muted,
    lineHeight: '1.6',
    margin: '0 0 20px',
  },
  link: { color: BRAND.primaryDark, textDecoration: 'underline' },
  button: {
    backgroundColor: BRAND.primary,
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600 as const,
    borderRadius: BRAND.radius,
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  code: {
    display: 'inline-block',
    padding: '14px 24px',
    backgroundColor: '#F1F8F4',
    border: `1px solid ${BRAND.border}`,
    borderRadius: BRAND.radius,
    fontFamily: "'SF Mono', Menlo, Consolas, monospace",
    fontSize: '22px',
    fontWeight: 700 as const,
    color: BRAND.primaryDark,
    letterSpacing: '0.2em',
  },
  divider: {
    borderTop: `1px solid ${BRAND.border}`,
    margin: '32px 0 20px',
  },
  footer: {
    fontSize: '12px',
    color: '#8A968F',
    lineHeight: '1.5',
    margin: '0',
  },
  legal: {
    fontSize: '11px',
    color: '#A8B3AD',
    margin: '8px 0 0',
  },
}
