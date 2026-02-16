export type UserRole = 'admin' | 'head' | 'manager';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Stage {
  id: number;
  pipeline_id: number;
  name: string;
  position: number;
  color: string;
}

export interface Pipeline {
  id: number;
  name: string;
  is_default: boolean;
  stages: Stage[];
  created_at: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  source: string;
  language: string;
  stage_id: number | null;
  manager_id: number | null;
  tags: string[];
  is_returning: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  stage: Stage | null;
  manager: User | null;
}

export interface Message {
  id: number;
  lead_id: number;
  sender_type: 'client' | 'manager' | 'system';
  type: 'text' | 'media' | 'template';
  content: string;
  media_url: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  wa_message_id: string | null;
  created_at: string;
}

export interface Dialog {
  lead_id: number;
  lead_name: string;
  lead_phone: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  manager_id: number | null;
  manager_name: string | null;
}

export interface Call {
  id: number;
  lead_id: number | null;
  manager_id: number | null;
  direction: 'in' | 'out';
  duration: number;
  recording_url: string | null;
  result: string | null;
  sipuni_call_id: string | null;
  created_at: string;
  lead_name: string | null;
  manager_name: string | null;
}

export interface Activity {
  id: number;
  lead_id: number;
  kind: 'message' | 'call' | 'note' | 'stage_change' | 'assignment';
  ref_id: number | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface Broadcast {
  id: number;
  name: string;
  segment: Record<string, unknown> | null;
  template_name: string | null;
  body: string;
  status: 'draft' | 'scheduled' | 'sending' | 'done';
  scheduled_at: string | null;
  created_by: number;
  created_at: string;
}

export interface DistributionRule {
  id: number;
  is_active: boolean;
  source: string | null;
  language: string | null;
  algorithm: 'round_robin' | 'load_based' | 'language_based' | 'source_based';
  priority: number;
  manager_id: number | null;
  created_at: string;
}

export interface AnalyticsSummary {
  total_leads: number;
  leads_by_stage: Record<string, number>;
  leads_by_source: Record<string, number>;
  leads_by_manager: Record<string, number>;
  total_messages: number;
  total_calls: number;
  conversion_rate: number;
  avg_response_time_minutes: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
