import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TodayStatusResponse,
  DashboardWeeklyStats,
  DashboardStageReadiness,
  DashboardOsVersion,
  RecommendedTask,
  DashboardV2Response,
} from '@shared/api.interface';

export async function getTodayStatus(): Promise<TodayStatusResponse> {
  const { data } = await axiosForBackend.get('/api/dashboard/today-status');
  return data;
}

export async function getRecommendedTasks(): Promise<{ items: RecommendedTask[] }> {
  const { data } = await axiosForBackend.get('/api/dashboard/recommended-tasks');
  return data;
}

export async function getWeeklyStats(): Promise<DashboardWeeklyStats> {
  const { data } = await axiosForBackend.get('/api/dashboard/weekly-stats');
  return data;
}

export async function getStageReadiness(): Promise<DashboardStageReadiness> {
  const { data } = await axiosForBackend.get('/api/dashboard/stage-readiness');
  return data;
}

export async function getOsVersion(): Promise<DashboardOsVersion> {
  const { data } = await axiosForBackend.get('/api/dashboard/os-version');
  return data;
}

export async function getDashboardV2(): Promise<DashboardV2Response> {
  const { data } = await axiosForBackend.get('/api/dashboard/v2');
  return data;
}
