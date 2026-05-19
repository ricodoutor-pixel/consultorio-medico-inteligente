/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_styles.ts'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso à {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandBar}>🌱 {BRAND.name}</Text>
        <Heading style={styles.h1}>Seu link de acesso</Heading>
        <Text style={styles.text}>
          Clique no botão abaixo para entrar na sua conta. Por segurança, o
          link expira em poucos minutos e só pode ser usado uma vez.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Entrar na plataforma
        </Button>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>
          Se você não solicitou este link, pode ignorar este e-mail.
        </Text>
        <Text style={styles.legal}>
          {BRAND.name} · Telemedicina Canábica · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
