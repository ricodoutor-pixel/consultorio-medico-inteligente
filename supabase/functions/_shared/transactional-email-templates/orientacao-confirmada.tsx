/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Planta y Raiz'
const PRIMARY = '#17C385'
const PRIMARY_DARK = '#1B4332'
const FG = '#0F1B14'
const MUTED = '#5B6B63'
const BORDER = '#E5EEE9'
const RADIUS = '14px'
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

interface Props {
  name?: string
  whatsappUrl?: string
  protocolo?: string
}

const OrientacaoConfirmadaEmail = ({ name, whatsappUrl, protocolo }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Sua orientação médica está confirmada na {SITE}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>🌱 {SITE}</Text>
        <Heading style={h1}>
          {name ? `${name}, sua orientação está confirmada` : 'Sua orientação está confirmada'}
        </Heading>
        <Text style={text}>
          Pagamento recebido com sucesso. Em até <strong>24 horas</strong> a enfermeira
          Brisa entrará em contato pelo WhatsApp para agendar sua consulta com o
          Dr. Edilson Bezerra (CRM-CE 10963).
        </Text>
        {protocolo ? (
          <Text style={text}>
            <strong>Protocolo:</strong>{' '}
            <span style={{ fontFamily: "'SF Mono', Menlo, monospace", color: PRIMARY_DARK }}>
              {protocolo}
            </span>
          </Text>
        ) : null}
        {whatsappUrl ? (
          <Button style={button} href={whatsappUrl}>
            Falar com a Brisa agora
          </Button>
        ) : null}
        <Hr style={divider} />
        <Text style={footer}>
          Dúvidas? Responda este e-mail ou chame a Brisa no WhatsApp
          +55 11 99136-3154.
        </Text>
        <Text style={legal}>
          {SITE} · Plataforma de intermediação médica (CNAE 6209-1/00) · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrientacaoConfirmadaEmail,
  subject: (d: Record<string, any>) =>
    d?.name ? `${d.name}, sua orientação Planta y Raiz está confirmada` : 'Sua orientação Planta y Raiz está confirmada',
  displayName: 'Orientação confirmada (pós-pagamento)',
  previewData: {
    name: 'Maria',
    whatsappUrl: 'https://wa.me/5511991363154',
    protocolo: 'PYR-2026-00123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: FONT, margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 28px' }
const brandBar = {
  display: 'inline-block', padding: '6px 14px', backgroundColor: PRIMARY,
  color: '#ffffff', fontSize: '12px', fontWeight: 700 as const,
  letterSpacing: '0.08em', borderRadius: '999px',
  textTransform: 'uppercase' as const, marginBottom: '24px',
}
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: FG, margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: MUTED, lineHeight: '1.6', margin: '0 0 18px' }
const button = {
  backgroundColor: PRIMARY, color: '#ffffff', fontSize: '15px',
  fontWeight: 600 as const, borderRadius: RADIUS, padding: '14px 28px',
  textDecoration: 'none', display: 'inline-block',
}
const divider = { borderTop: `1px solid ${BORDER}`, margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#8A968F', lineHeight: '1.5', margin: '0' }
const legal = { fontSize: '11px', color: '#A8B3AD', margin: '8px 0 0' }
