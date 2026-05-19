/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_styles.ts'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail, newEmail, confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de e-mail na {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandBar}>🌱 {BRAND.name}</Text>
        <Heading style={styles.h1}>Confirmar troca de e-mail</Heading>
        <Text style={styles.text}>
          Você solicitou alterar o e-mail da sua conta de{' '}
          <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
        </Text>
        <Text style={styles.text}>
          Clique no botão abaixo para confirmar a alteração:
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Confirmar alteração
        </Button>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>
          Se você não solicitou esta mudança, proteja sua conta imediatamente
          alterando sua senha.
        </Text>
        <Text style={styles.legal}>
          {BRAND.name} · plantayraiz.com.br
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
