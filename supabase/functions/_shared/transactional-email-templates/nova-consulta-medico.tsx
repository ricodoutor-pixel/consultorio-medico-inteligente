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
  doctorName?: string
  patientName?: string
  scheduledAt?: string
  modality?: string
  amount?: string
  consultorioUrl?: string
}

const NovaConsultaMedicoEmail = ({
  doctorName, patientName, scheduledAt, modality, amount, consultorioUrl,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo atendimento direcionado a você na {SITE}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>🌱 {SITE}</Text>
        <Heading style={h1}>
          {doctorName ? `${doctorName}, você tem um novo atendimento` : 'Você tem um novo atendimento'}
        </Heading>
        <Text style={text}>
          Um paciente concluiu a etapa de contratação na plataforma e foi
          direcionado ao seu consultório virtual.
        </Text>
        <Text style={text}>
          <strong>Paciente:</strong> {patientName || 'Paciente da plataforma'}<br />
          <strong>Data e hora:</strong> {scheduledAt || 'A confirmar'}<br />
          <strong>Modalidade:</strong> {modality || 'Vídeo'}<br />
          <strong>Valor:</strong> {amount || '—'}
        </Text>
        <Text style={text}>
          O paciente passa pela triagem da Enfª Brisa antes de entrar na sala.
          Confirme sua presença no consultório virtual.
        </Text>
        {consultorioUrl ? (
          <Button style={button} href={consultorioUrl}>
            Abrir consultório virtual
          </Button>
        ) : null}
        <Hr style={divider} />
        <Text style={footer}>
          Suporte da plataforma pelo WhatsApp +55 11 99136-3154.
        </Text>
        <Text style={legal}>
          {SITE} · Plataforma de intermediação tecnológica (CNAE 6209-1/00) · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NovaConsultaMedicoEmail,
  subject: (d: Record<string, any>) =>
    d?.patientName
      ? `Novo atendimento na Planta y Raiz — ${d.patientName}`
      : 'Novo atendimento direcionado a você — Planta y Raiz',
  displayName: 'Novo atendimento (aviso ao profissional)',
  previewData: {
    doctorName: 'Dr. Daniel Kobayashi Colombo',
    patientName: 'Maria Souza',
    scheduledAt: '12/09/2026 14:30',
    modality: 'Vídeo',
    amount: 'R$ 180,00',
    consultorioUrl: 'https://www.plantayraiz.com.br/consultorio',
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
void PRIMARY_DARK
