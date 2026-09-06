/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_styles.ts'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha na {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandBar}>🌱 {BRAND.name}</Text>
        <Heading style={styles.h1}>Redefinir senha</Heading>
        <Text style={styles.text}>
          Recebemos um pedido para redefinir a senha da sua conta. Clique no
          botão abaixo para escolher uma nova senha. O link é válido por 1 hora.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Redefinir minha senha
        </Button>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>
          Se você não solicitou esta alteração, ignore este e-mail — sua senha
          atual continuará válida.
        </Text>
        <Text style={styles.legal}>
          {BRAND.name} · Telemedicina Canábica · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
