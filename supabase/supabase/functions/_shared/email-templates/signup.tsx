/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_styles.ts'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail para acessar a {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandBar}>🌱 {BRAND.name}</Text>
        <Heading style={styles.h1}>Bem-vindo(a) à {BRAND.name}</Heading>
        <Text style={styles.text}>
          Falta só um passo: confirme que <strong>{recipient}</strong> é mesmo
          seu e-mail para liberar acesso à plataforma de telemedicina canábica
          do Dr. Edilson Bezerra (CRM-CE 10963).
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Confirmar meu e-mail
        </Button>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>
          Se você não criou uma conta, pode ignorar esta mensagem com segurança.
        </Text>
        <Text style={styles.legal}>
          {BRAND.name} · Plataforma de intermediação médica (CNAE 6209-1/00)
          · <Link href={siteUrl} style={styles.link}>plantayraiz.com.br</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
