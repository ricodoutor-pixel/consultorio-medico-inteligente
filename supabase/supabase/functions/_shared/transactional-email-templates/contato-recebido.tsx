/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Planta y Raiz'
const PRIMARY = '#17C385'
const FG = '#0F1B14'
const MUTED = '#5B6B63'
const BORDER = '#E5EEE9'
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

interface Props {
  name?: string
}

const ContatoRecebidoEmail = ({ name }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Recebemos sua mensagem na {SITE}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>🌱 {SITE}</Text>
        <Heading style={h1}>
          {name ? `Obrigado, ${name}!` : 'Recebemos sua mensagem'}
        </Heading>
        <Text style={text}>
          Sua mensagem foi recebida pela nossa equipe. A enfermeira Brisa ou um
          atendente humano vai responder em até <strong>24 horas úteis</strong>.
        </Text>
        <Text style={text}>
          Se for urgente, chame direto no WhatsApp{' '}
          <a href="https://wa.me/5511991363154" style={{ color: PRIMARY, fontWeight: 600 }}>
            +55 11 99136-3154
          </a>.
        </Text>
        <Hr style={divider} />
        <Text style={legal}>
          {SITE} · Telemedicina canábica · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContatoRecebidoEmail,
  subject: 'Recebemos sua mensagem · Planta y Raiz',
  displayName: 'Confirmação de contato',
  previewData: { name: 'João' },
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
const divider = { borderTop: `1px solid ${BORDER}`, margin: '32px 0 20px' }
const legal = { fontSize: '11px', color: '#A8B3AD', margin: '8px 0 0' }
