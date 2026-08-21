import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TrainingStatsResponse,
  LearningDashboardResponse,
  WeakPointItem,
  ReviewRecommendationsResponse,
} from '@shared/api.interface';

export async function getTrainingStats(): Promise<TrainingStatsResponse> {
  const res = await axiosForBackend.get('/api/training/stats');
  return res.data;
}

export async function getDashboard(): Promise<LearningDashboardResponse> {
  const res = await axiosForBackend.get('/api/training/dashboard');
  return res.data;
}

export async function getWeakPoints(limit?: number): Promise<WeakPointItem[]> {
  const url = limit ? `/api/training/weak-points?limit=${limit}` : '/api/training/weak-points';
  const res = await axiosForBackend.get(url);
  return res.data;
}

export async function getReviewRecommendations(limit?: number): Promise<ReviewRecommendationsResponse> {
  const url = limit ? `/api/training/review-recommendations?limit=${limit}` : '/api/training/review-recommendations';
  const res = await axiosForBackend.get(url);
  return res.data;
}

export async function markPointMastered(pointKey: string): Promise<{ success: boolean }> {
  const res = await axiosForBackend.post(`/api/training/weak-points/${encodeURIComponent(pointKey)}/master`);
  return res.data;
}
