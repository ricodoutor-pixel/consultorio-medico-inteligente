/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orientacaoConfirmada } from './orientacao-confirmada.tsx'
import { template as contatoRecebido } from './contato-recebido.tsx'
import { template as boasVindas } from './boas-vindas.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'orientacao-confirmada': orientacaoConfirmada,
  'contato-recebido': contatoRecebido,
  'boas-vindas': boasVindas,
}
