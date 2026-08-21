import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  BossDailyStatsListResponse,
  BossDailyStatsFunnelResponse,
  BossDailyStatsItem,
  UpsertBossDailyStatsRequest,
  UpdateBossDailyStatsRequest,
} from '@shared/api.interface';

export async function getBossDailyStats(params: {
  page?: number;
  pageSize?: number;
  timeRange?: string;
}): Promise<BossDailyStatsListResponse> {
  const res = await axiosForBackend.get('/api/boss-greetings', { params });
  return res.data;
}

export async function upsertBossDailyStats(data: UpsertBossDailyStatsRequest): Promise<BossDailyStatsItem> {
  const res = await axiosForBackend.post('/api/boss-greetings', data);
  return res.data;
}

export async function updateBossDailyStats(id: string, data: UpdateBossDailyStatsRequest): Promise<BossDailyStatsItem> {
  const res = await axiosForBackend.patch(`/api/boss-greetings/${id}`, data);
  return res.data;
}

export async function deleteBossDailyStats(id: string): Promise<{ success: boolean }> {
  const res = await axiosForBackend.delete(`/api/boss-greetings/${id}`);
  return res.data;
}

export async function getBossDailyStatsFunnel(timeRange = 'all'): Promise<BossDailyStatsFunnelResponse> {
  const res = await axiosForBackend.get('/api/boss-greetings/funnel', { params: { timeRange } });
  return res.data;
}
