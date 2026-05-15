import axios, { AxiosInstance } from 'axios';
import type { ManyChatSubscriber, ManyChatSendResult } from './types';

export class ManyChatClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.manychat.com/fb',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async getSubscriberByPhone(phone: string): Promise<ManyChatSubscriber | null> {
    try {
      const { data } = await this.client.get('/subscriber/findBySystemField', {
        params: { phone },
      });
      return data?.data ?? null;
    } catch {
      return null;
    }
  }

  async getSubscriberById(subscriberId: string): Promise<ManyChatSubscriber | null> {
    try {
      const { data } = await this.client.get('/subscriber/getInfo', {
        params: { subscriber_id: subscriberId },
      });
      return data?.data ?? null;
    } catch {
      return null;
    }
  }

  async addTag(subscriberId: string, tagId: number): Promise<boolean> {
    try {
      await this.client.post('/subscriber/addTag', {
        subscriber_id: subscriberId,
        tag_id: tagId,
      });
      return true;
    } catch {
      return false;
    }
  }

  async removeTag(subscriberId: string, tagId: number): Promise<boolean> {
    try {
      await this.client.post('/subscriber/removeTag', {
        subscriber_id: subscriberId,
        tag_id: tagId,
      });
      return true;
    } catch {
      return false;
    }
  }

  async setCustomField(subscriberId: string, fieldId: number, value: string): Promise<boolean> {
    try {
      await this.client.post('/subscriber/setCustomField', {
        subscriber_id: subscriberId,
        field_id: fieldId,
        field_value: value,
      });
      return true;
    } catch {
      return false;
    }
  }

  async sendContent(subscriberId: string, flowNamespace: string): Promise<ManyChatSendResult> {
    try {
      const { data } = await this.client.post('/sending/sendContent', {
        subscriber_id: subscriberId,
        flow_ns: flowNamespace,
      });
      return { status: 'ok', data };
    } catch (error: any) {
      return { status: 'error', error: error?.message ?? 'Unknown error' };
    }
  }

  async sendMessage(subscriberId: string, text: string): Promise<ManyChatSendResult> {
    try {
      const { data } = await this.client.post('/sending/sendContent', {
        subscriber_id: subscriberId,
        data: {
          version: 'v2',
          content: {
            messages: [{ type: 'text', text }],
          },
        },
      });
      return { status: 'ok', data };
    } catch (error: any) {
      return { status: 'error', error: error?.message ?? 'Unknown error' };
    }
  }

  async healthCheck(): Promise<{ ok: boolean; responseTime: number }> {
    const start = Date.now();
    try {
      await this.client.get('/page/getInfo');
      return { ok: true, responseTime: Date.now() - start };
    } catch {
      return { ok: false, responseTime: Date.now() - start };
    }
  }
}

export const createManyChatClient = (): ManyChatClient => {
  const apiKey = process.env.MANYCHAT_API_KEY;
  if (!apiKey) throw new Error('MANYCHAT_API_KEY not configured');
  return new ManyChatClient(apiKey);
};
