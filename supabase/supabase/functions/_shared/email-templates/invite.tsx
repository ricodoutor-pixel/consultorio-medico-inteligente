/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_styles.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado(a) para a {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandBar}>🌱 {BRAND.name}</Text>
        <Heading style={styles.h1}>Você foi convidado(a)</Heading>
        <Text style={styles.text}>
          Você recebeu um convite para fazer parte da {BRAND.name} — a mega
          clínica digital especializada em cannabis medicinal. Clique abaixo
          para aceitar o convite e criar sua conta.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Aceitar convite
        </Button>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>
          Se você não esperava este convite, pode ignorar esta mensagem.
        </Text>
        <Text style={styles.legal}>
          {BRAND.name} · Plataforma de intermediação médica · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
