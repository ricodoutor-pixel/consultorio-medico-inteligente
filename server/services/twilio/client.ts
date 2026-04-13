import axios, { AxiosInstance } from 'axios';

export class TwilioClient {
  private client: AxiosInstance;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.fromNumber = fromNumber;
    this.client = axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`,
      auth: { username: accountSid, password: authToken },
      timeout: 10000,
    });
  }

  async sendSMS(to: string, body: string): Promise<{ sid: string; status: string }> {
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', this.fromNumber);
    params.append('Body', body);

    const { data } = await this.client.post('/Messages.json', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return { sid: data.sid, status: data.status };
  }

  async sendWhatsApp(to: string, body: string): Promise<{ sid: string; status: string }> {
    const params = new URLSearchParams();
    params.append('To', `whatsapp:${to}`);
    params.append('From', `whatsapp:${this.fromNumber}`);
    params.append('Body', body);

    const { data } = await this.client.post('/Messages.json', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return { sid: data.sid, status: data.status };
  }

  async healthCheck(): Promise<{ ok: boolean; responseTime: number }> {
    const start = Date.now();
    try {
      await this.client.get('.json');
      return { ok: true, responseTime: Date.now() - start };
    } catch {
      return { ok: false, responseTime: Date.now() - start };
    }
  }
}

export const createTwilioClient = (): TwilioClient => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
  if (!sid || !token) throw new Error('Twilio credentials not configured');
  return new TwilioClient(sid, token, from);
};
