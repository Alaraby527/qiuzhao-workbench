import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  CheckInListResponse,
  CheckInItem,
  CreateCheckInRequest,
} from '@shared/api.interface';

export async function getTodayCheckIns(): Promise<CheckInListResponse> {
  const res = await axiosForBackend.get('/api/check-ins/today');
  return res.data;
}

export async function getRecentCheckIns(days = 7): Promise<CheckInListResponse> {
  const res = await axiosForBackend.get('/api/check-ins/recent', { params: { days } });
  return res.data;
}

export async function getMonthCheckIns(year: number, month: number): Promise<CheckInListResponse> {
  const res = await axiosForBackend.get('/api/check-ins/month', { params: { year, month } });
  return res.data;
}

export async function createCheckIn(data: CreateCheckInRequest): Promise<CheckInItem> {
  const res = await axiosForBackend.post('/api/check-ins', data);
  return res.data;
}
