import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ApplicationItem,
  ApplicationKanbanResponse,
  ApplicationListResponse,
  ApplicationStatisticsResponse,
  ApplicationStatus,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from '@shared/api.interface';

export async function getKanban(): Promise<ApplicationKanbanResponse> {
  const res = await axiosForBackend.get('/api/applications/kanban');
  return res.data;
}

export async function getStatistics(): Promise<ApplicationStatisticsResponse> {
  const res = await axiosForBackend.get('/api/applications/statistics');
  return res.data;
}

interface GetApplicationsParams {
  search?: string;
  channel?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function getApplications(params: GetApplicationsParams = {}): Promise<ApplicationListResponse> {
  const res = await axiosForBackend.get('/api/applications', { params });
  return res.data;
}

export async function getApplicationDetail(id: string): Promise<ApplicationItem> {
  const res = await axiosForBackend.get(`/api/applications/${id}`);
  return res.data;
}

export async function createApplication(data: CreateApplicationRequest): Promise<ApplicationItem> {
  const res = await axiosForBackend.post('/api/applications', data);
  return res.data;
}

export async function updateApplication(id: string, data: UpdateApplicationRequest): Promise<ApplicationItem> {
  const res = await axiosForBackend.patch(`/api/applications/${id}`, data);
  return res.data;
}

export async function deleteApplication(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/applications/${id}`);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, note?: string): Promise<ApplicationItem> {
  const res = await axiosForBackend.patch(`/api/applications/${id}/status`, { status, note });
  return res.data;
}
