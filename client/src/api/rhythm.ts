import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  RhythmAnalysisResponse,
  StageCheckItem,
  CreateStageCheckRequest,
} from '@shared/api.interface';

export async function getRhythmAnalysis(): Promise<RhythmAnalysisResponse> {
  const res = await axiosForBackend.get('/api/rhythm/analysis');
  return res.data;
}

export async function getLatestStageCheck(): Promise<StageCheckItem | null> {
  const res = await axiosForBackend.get('/api/stage-check/latest');
  return res.data?.item ?? null;
}

export async function createStageCheck(data: CreateStageCheckRequest): Promise<StageCheckItem> {
  const res = await axiosForBackend.post('/api/stage-check', data);
  return res.data;
}
