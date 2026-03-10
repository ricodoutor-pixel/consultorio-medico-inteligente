import { google } from 'googleapis';

const calendar = google.calendar('v3');

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  videoConferenceUrl?: string;
}

interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  refreshToken?: string;
}

/**
 * Obter autorização OAuth2 para Google Calendar
 */
export function getGoogleCalendarAuthUrl(config: GoogleCalendarConfig): string {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUrl
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return authUrl;
}

/**
 * Trocar authorization code por refresh token
 */
export async function exchangeCodeForToken(
  code: string,
  config: GoogleCalendarConfig
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUrl
  );

  const { tokens } = await oauth2Client.getToken(code);
  return tokens.refresh_token || '';
}

/**
 * Criar evento no Google Calendar
 */
export async function createCalendarEvent(
  event: CalendarEvent,
  config: GoogleCalendarConfig
): Promise<{ eventId: string; htmlLink: string }> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUrl
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

  const eventBody = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    attendees: event.attendees.map(email => ({ email })),
    location: event.location,
    conferenceData: event.videoConferenceUrl
      ? {
          entryPoints: [
            {
              entryPointType: 'video',
              uri: event.videoConferenceUrl,
            },
          ],
          conferenceSolution: {
            key: { type: 'hangoutsMeet' },
          },
        }
      : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  const response = await calendarApi.events.insert({
    calendarId: 'primary',
    requestBody: eventBody,
    conferenceDataVersion: 1,
  });

  return {
    eventId: response.data.id || '',
    htmlLink: response.data.htmlLink || '',
  };
}

/**
 * Atualizar evento no Google Calendar
 */
export async function updateCalendarEvent(
  eventId: string,
  event: Partial<CalendarEvent>,
  config: GoogleCalendarConfig
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUrl
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

  const eventBody: any = {};

  if (event.title) eventBody.summary = event.title;
  if (event.description) eventBody.description = event.description;
  if (event.startTime) {
    eventBody.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    };
  }
  if (event.endTime) {
    eventBody.end = {
      dateTime: event.endTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    };
  }
  if (event.location) eventBody.location = event.location;

  await calendarApi.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: eventBody,
  });
}

/**
 * Deletar evento do Google Calendar
 */
export async function deleteCalendarEvent(
  eventId: string,
  config: GoogleCalendarConfig
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUrl
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendarApi.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

/**
 * Listar eventos do Google Calendar
 */
export async function listCalendarEvents(
  config: GoogleCalendarConfig,
  timeMin?: Date,
  timeMax?: Date
): Promise<any[]> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUrl
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendarApi.events.list({
    calendarId: 'primary',
    timeMin: timeMin?.toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

/**
 * Obter disponibilidade do calendário
 */
export async function getCalendarAvailability(
  config: GoogleCalendarConfig,
  date: Date,
  durationMinutes: number = 60
): Promise<{ start: Date; end: Date }[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(8, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(18, 0, 0, 0);

  const events = await listCalendarEvents(config, startOfDay, endOfDay);

  const availableSlots: { start: Date; end: Date }[] = [];
  let currentTime = new Date(startOfDay);

  for (const event of events) {
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);

    if (currentTime < eventStart) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      if (slotEnd <= eventStart) {
        availableSlots.push({
          start: new Date(currentTime),
          end: slotEnd,
        });
      }
    }

    currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
  }

  // Adicionar slots restantes até o final do dia
  const slotEnd = new Date(currentTime);
  slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

  if (slotEnd <= endOfDay) {
    availableSlots.push({
      start: new Date(currentTime),
      end: slotEnd,
    });
  }

  return availableSlots;
}

/**
 * Sincronizar consulta com Google Calendar
 */
export async function syncConsultationToCalendar(
  consultation: {
    id: string;
    patientName: string;
    patientEmail: string;
    professionalName: string;
    professionalEmail: string;
    startTime: Date;
    endTime: Date;
    type: string;
    videoConferenceUrl?: string;
  },
  config: GoogleCalendarConfig
): Promise<{ eventId: string; htmlLink: string }> {
  const event: CalendarEvent = {
    title: `Consulta: ${consultation.patientName} - ${consultation.type}`,
    description: `Consulta com ${consultation.professionalName}\nID: ${consultation.id}`,
    startTime: consultation.startTime,
    endTime: consultation.endTime,
    attendees: [consultation.patientEmail, consultation.professionalEmail],
    videoConferenceUrl: consultation.videoConferenceUrl,
  };

  return createCalendarEvent(event, config);
}

/**
 * Cancelar consulta e remover do Google Calendar
 */
export async function cancelConsultationFromCalendar(
  eventId: string,
  config: GoogleCalendarConfig
): Promise<void> {
  await deleteCalendarEvent(eventId, config);
}

/**
 * Enviar convite de calendário
 */
export async function sendCalendarInvite(
  eventId: string,
  config: GoogleCalendarConfig
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUrl
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendarApi.events.update({
    calendarId: 'primary',
    eventId,
    sendNotifications: true,
    requestBody: {},
  });
}
