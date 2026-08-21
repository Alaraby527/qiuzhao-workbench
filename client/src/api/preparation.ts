import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  PreparationListResponse,
  PreparationReadinessResponse,
  UpdatePreparationItemRequest,
} from '@shared/api.interface';

export async function getPreparationList(): Promise<PreparationListResponse> {
  const res = await axiosForBackend.get('/api/preparation');
  return res.data;
}

export async function getPreparationReadiness(): Promise<PreparationReadinessResponse> {
  const res = await axiosForBackend.get('/api/preparation/readiness');
  return res.data;
}

export async function updatePreparationItem(itemKey: string, data: UpdatePreparationItemRequest): Promise<void> {
  await axiosForBackend.patch(`/api/preparation/${itemKey}`, data);
}

export async function initPreparation(): Promise<PreparationListResponse> {
  const res = await axiosForBackend.post('/api/preparation/init');
  return res.data;
}
