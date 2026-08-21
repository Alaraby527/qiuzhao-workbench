import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ResumeInfoResponse,
  ResumeVersionItem,
  ResumeVersionStatisticsResponse,
  UpdateResumeInfoRequest,
  CreateResumeVersionRequest,
  UpdateResumeVersionRequest,
} from '@shared/api.interface';

export async function getResumeInfo(): Promise<ResumeInfoResponse> {
  const res = await axiosForBackend.get('/api/resume-info');
  return res.data;
}

export async function updateResumeInfo(data: UpdateResumeInfoRequest): Promise<ResumeInfoResponse> {
  const res = await axiosForBackend.put('/api/resume-info', data);
  return res.data;
}

export async function getResumeVersions(search?: string): Promise<ResumeVersionItem[]> {
  const res = await axiosForBackend.get('/api/resume-versions', {
    params: search ? { search } : undefined,
  });
  return res.data;
}

export async function createResumeVersion(data: CreateResumeVersionRequest): Promise<ResumeVersionItem> {
  const res = await axiosForBackend.post('/api/resume-versions', data);
  return res.data;
}

export async function updateResumeVersion(id: string, data: UpdateResumeVersionRequest): Promise<ResumeVersionItem> {
  const res = await axiosForBackend.patch(`/api/resume-versions/${id}`, data);
  return res.data;
}

export async function setDefaultResumeVersion(id: string): Promise<ResumeVersionItem> {
  const res = await axiosForBackend.patch(`/api/resume-versions/${id}/set-default`);
  return res.data;
}

export async function deleteResumeVersion(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/resume-versions/${id}`);
}
