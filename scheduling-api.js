/**
 * API REST PARA AGENDAMENTOS
 * Plantayraiz.com.br - Express + Twilio
 * Data: 04 de Abril de 2026
 */

const express = require('express');
const scheduling = require('./whatsapp-scheduling');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROTAS: AGENDAMENTOS
// ============================================================================

/**
 * POST /api/appointments - Criar novo agendamento
 */
app.post('/api/appointments', async (req, res) => {
  try {
    const { patientName, patientPhone, date, time, notes } = req.body;

    // Validar dados
    if (!patientName || !patientPhone || !date || !time) {
      return res.status(400).json({
        error: 'Dados incompletos',
        required: ['patientName', 'patientPhone', 'date', 'time'],
      });
    }

    // Formatar número de telefone
    let formattedPhone = patientPhone;
    if (!formattedPhone.startsWith('whatsapp:')) {
      formattedPhone = `whatsapp:+${patientPhone.replace(/\D/g, '')}`;
    }

    // Criar agendamento
    const appointment = await scheduling.createAppointment({
      patientName,
      patientPhone: formattedPhone,
      date,
      time,
      notes,
      professionalId: 'brisa',
      professionalName: 'Brisa (Enfermeira)',
      specialty: 'Enfermagem',
    });

    res.status(201).json({
      success: true,
      message: 'Agendamento criado com sucesso',
      appointment,
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/appointments - Listar agendamentos
 */
app.get('/api/appointments', (req, res) => {
  try {
    const { status, date } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (date) filter.date = date;

    const appointments = scheduling.listAppointments(filter);

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/appointments/:id - Obter agendamento específico
 */
app.get('/api/appointments/:id', (req, res) => {
  try {
    const appointment = scheduling.getAppointment(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        error: 'Agendamento não encontrado',
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Erro ao obter agendamento:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * PUT /api/appointments/:id/cancel - Cancelar agendamento
 */
app.put('/api/appointments/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await scheduling.cancelAppointment(req.params.id, reason);

    res.json({
      success: true,
      message: 'Agendamento cancelado com sucesso',
      appointment,
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// ============================================================================
// ROTAS: DISPONIBILIDADE
// ============================================================================

/**
 * GET /api/available-slots - Obter horários disponíveis
 */
app.get('/api/available-slots', (req, res) => {
  try {
    const { date, professionalId } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Data é obrigatória',
      });
    }

    const slots = scheduling.getAvailableSlots(professionalId || 'brisa', date);

    res.json({
      success: true,
      date,
      availableSlots: slots,
      count: slots.length,
    });
  } catch (error) {
    console.error('Erro ao obter horários:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// ============================================================================
// ROTAS: LEMBRETES
// ============================================================================

/**
 * POST /api/send-reminders - Enviar lembretes para amanhã
 */
app.post('/api/send-reminders', async (req, res) => {
  try {
    const count = await scheduling.sendTomorrowReminders();

    res.json({
      success: true,
      message: `${count} lembretes enviados`,
      count,
    });
  } catch (error) {
    console.error('Erro ao enviar lembretes:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// ============================================================================
// ROTAS: SAÚDE
// ============================================================================

/**
 * GET /api/health - Verificar saúde da API
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Scheduling API',
  });
});

/**
 * GET /api/status - Status detalhado
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Scheduling API',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ============================================================================
// ROTAS: DOCUMENTAÇÃO
// ============================================================================

/**
 * GET /api/docs - Documentação da API
 */
app.get('/api/docs', (req, res) => {
  const docs = `
# 📋 API DE AGENDAMENTOS - PLANTAYRAIZ

## Base URL
https://plantayraiz.com.br/api

## Endpoints

### Agendamentos

#### POST /appointments
Criar novo agendamento

**Request:**
\`\`\`json
{
  "patientName": "João Silva",
  "patientPhone": "11987654321",
  "date": "2026-04-10",
  "time": "14:00",
  "notes": "Primeira consulta"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "appointment": {
    "id": "APT_1712250600000",
    "patientName": "João Silva",
    "date": "2026-04-10",
    "time": "14:00",
    "status": "CONFIRMED"
  }
}
\`\`\`

#### GET /appointments
Listar agendamentos

**Query Parameters:**
- status: CONFIRMED, CANCELLED
- date: YYYY-MM-DD

**Response:**
\`\`\`json
{
  "success": true,
  "count": 5,
  "appointments": [...]
}
\`\`\`

#### GET /appointments/:id
Obter agendamento específico

**Response:**
\`\`\`json
{
  "success": true,
  "appointment": {...}
}
\`\`\`

#### PUT /appointments/:id/cancel
Cancelar agendamento

**Request:**
\`\`\`json
{
  "reason": "Motivo do cancelamento"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Agendamento cancelado com sucesso"
}
\`\`\`

### Disponibilidade

#### GET /available-slots
Obter horários disponíveis

**Query Parameters:**
- date: YYYY-MM-DD (obrigatório)
- professionalId: brisa (padrão)

**Response:**
\`\`\`json
{
  "success": true,
  "date": "2026-04-10",
  "availableSlots": ["09:00", "10:00", "14:00"],
  "count": 3
}
\`\`\`

### Lembretes

#### POST /send-reminders
Enviar lembretes para agendamentos de amanhã

**Response:**
\`\`\`json
{
  "success": true,
  "message": "5 lembretes enviados",
  "count": 5
}
\`\`\`

### Saúde

#### GET /health
Verificar saúde da API

#### GET /status
Status detalhado da API

## Exemplos de Uso

### cURL

\`\`\`bash
# Criar agendamento
curl -X POST https://plantayraiz.com.br/api/appointments \\
  -H "Content-Type: application/json" \\
  -d '{
    "patientName": "João Silva",
    "patientPhone": "11987654321",
    "date": "2026-04-10",
    "time": "14:00"
  }'

# Listar agendamentos
curl https://plantayraiz.com.br/api/appointments

# Obter horários disponíveis
curl "https://plantayraiz.com.br/api/available-slots?date=2026-04-10"

# Cancelar agendamento
curl -X PUT https://plantayraiz.com.br/api/appointments/APT_123/cancel \\
  -H "Content-Type: application/json" \\
  -d '{"reason": "Motivo do cancelamento"}'
\`\`\`

### JavaScript

\`\`\`javascript
// Criar agendamento
const response = await fetch('https://plantayraiz.com.br/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientName: 'João Silva',
    patientPhone: '11987654321',
    date: '2026-04-10',
    time: '14:00'
  })
});

const data = await response.json();
console.log(data);
\`\`\`

## Fluxo de Agendamento

1. **Verificar disponibilidade**: GET /available-slots
2. **Criar agendamento**: POST /appointments
3. **Notificações automáticas**:
   - Paciente recebe confirmação via WhatsApp
   - Brisa recebe notificação de novo agendamento
4. **Dia anterior**: Lembretes automáticos enviados
5. **Cancelamento**: PUT /appointments/:id/cancel

## Contato

**Enfermeira Brisa**: +55 11 99136-3154
**Suporte**: suporte@plantayraiz.com.br
`;

  res.type('text/plain').send(docs);
});

// ============================================================================
// TRATAMENTO DE ERROS
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
  });
});

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 API de Agendamentos rodando em http://localhost:${PORT}`);
  console.log(`📋 Documentação: http://localhost:${PORT}/api/docs`);
});

module.exports = app;
