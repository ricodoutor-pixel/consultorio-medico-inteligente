/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_styles.ts'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandBar}>🌱 {BRAND.name}</Text>
        <Heading style={styles.h1}>Código de verificação</Heading>
        <Text style={styles.text}>
          Use o código abaixo para confirmar sua identidade na plataforma:
        </Text>
        <Text style={styles.code}>{token}</Text>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>
          Este código expira em poucos minutos. Se você não solicitou,
          ignore esta mensagem.
        </Text>
        <Text style={styles.legal}>
          {BRAND.name} · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
