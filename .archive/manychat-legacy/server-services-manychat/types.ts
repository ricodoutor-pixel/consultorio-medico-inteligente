export interface ManyChatSubscriber {
  id: string;
  page_id: string;
  status: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  custom_fields: Record<string, any>;
  tags: { id: number; name: string }[];
}

export interface ManyChatSendResult {
  status: string;
  data?: any;
  error?: string;
}

export interface ManyChatFlow {
  id: string;
  name: string;
  status: string;
}

export interface LeadQualification {
  type: 'doctor' | 'patient' | 'curious';
  crm?: string;
  fastTrack: boolean;
  tags: string[];
}
