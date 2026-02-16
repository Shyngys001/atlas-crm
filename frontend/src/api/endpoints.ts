import { api } from './client';
import type {
  User, Pipeline, Lead, Message, Dialog, Call, Activity,
  Broadcast, DistributionRule, AnalyticsSummary, TokenResponse,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }),
  refresh: (refresh_token: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token }),
  me: () => api.get<User>('/auth/me'),
};

export const usersApi = {
  list: () => api.get<User[]>('/users'),
  create: (data: { email: string; name: string; password: string; role: string }) =>
    api.post<User>('/users', data),
  update: (id: number, data: Partial<User & { password: string }>) =>
    api.patch<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const pipelinesApi = {
  list: () => api.get<Pipeline[]>('/pipelines'),
  create: (data: { name: string; is_default?: boolean }) =>
    api.post<Pipeline>('/pipelines', data),
  createStage: (data: { pipeline_id: number; name: string; position: number; color: string }) =>
    api.post('/pipelines/stages', data),
  updateStage: (id: number, data: Partial<{ name: string; position: number; color: string }>) =>
    api.patch(`/pipelines/stages/${id}`, data),
  deleteStage: (id: number) => api.delete(`/pipelines/stages/${id}`),
};

export const leadsApi = {
  list: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return api.get<Lead[]>(`/leads${query}`);
  },
  get: (id: number) => api.get<Lead>(`/leads/${id}`),
  create: (data: Partial<Lead>) => api.post<Lead>('/leads', data),
  update: (id: number, data: Partial<Lead>) => api.patch<Lead>(`/leads/${id}`, data),
  timeline: (id: number) => api.get<Activity[]>(`/leads/${id}/timeline`),
};

export const messagesApi = {
  dialogs: () => api.get<Dialog[]>('/dialogs'),
  byLead: (leadId: number) => api.get<Message[]>(`/leads/${leadId}/messages`),
  send: (leadId: number, content: string, templateName?: string) =>
    api.post<Message>(`/leads/${leadId}/messages/send`, { content, template_name: templateName }),
};

export const callsApi = {
  list: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return api.get<Call[]>(`/calls${query}`);
  },
  byLead: (leadId: number) =>
    api.get<Call[]>(`/calls?lead_id=${leadId}`),
  clickToCall: (phone: string, leadId?: number) =>
    api.post('/calls/click-to-call', { phone, lead_id: leadId }),
};

export const broadcastsApi = {
  list: () => api.get<Broadcast[]>('/broadcasts'),
  create: (data: { name: string; segment?: Record<string, unknown>; template_name?: string; body: string }) =>
    api.post<Broadcast>('/broadcasts', data),
  schedule: (id: number, scheduledAt?: string) =>
    api.post<Broadcast>(`/broadcasts/${id}/schedule`, { scheduled_at: scheduledAt }),
};

export const distributionApi = {
  getRules: () => api.get<DistributionRule[]>('/distribution/rules'),
  updateRules: (rules: Partial<DistributionRule>[]) =>
    api.put<DistributionRule[]>('/distribution/rules', rules),
};

export const analyticsApi = {
  summary: () => api.get<AnalyticsSummary>('/analytics/summary'),
};
