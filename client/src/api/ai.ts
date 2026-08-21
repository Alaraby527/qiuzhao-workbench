import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ConversationItem,
  ConversationListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  SavedResultItem,
  SavedResultListResponse,
  CreateSavedResultRequest,
  AiSettingItem,
  TestAiConnectionResponse,
} from '@shared/api.interface';

const CONV_BASE = '/api/ai/conversations';
const RESULT_BASE = '/api/ai/saved-results';

export async function listConversations(): Promise<ConversationListResponse> {
  const res = await axiosForBackend.get(CONV_BASE);
  return res.data;
}

export async function createConversation(data: CreateConversationRequest): Promise<ConversationItem> {
  const res = await axiosForBackend.post(CONV_BASE, data);
  return res.data;
}

export async function getConversation(id: string): Promise<ConversationItem> {
  const res = await axiosForBackend.get(`${CONV_BASE}/${id}`);
  return res.data;
}

export async function updateConversation(id: string, data: UpdateConversationRequest): Promise<ConversationItem> {
  const res = await axiosForBackend.patch(`${CONV_BASE}/${id}`, data);
  return res.data;
}

export async function deleteConversation(id: string): Promise<void> {
  await axiosForBackend.delete(`${CONV_BASE}/${id}`);
}

export async function listSavedResults(): Promise<SavedResultListResponse> {
  const res = await axiosForBackend.get(RESULT_BASE);
  return res.data;
}

export async function createSavedResult(data: CreateSavedResultRequest): Promise<SavedResultItem> {
  const res = await axiosForBackend.post(RESULT_BASE, data);
  return res.data;
}

export async function deleteSavedResult(id: string): Promise<void> {
  await axiosForBackend.delete(`${RESULT_BASE}/${id}`);
}

export async function getAiSetting(): Promise<AiSettingItem | null> {
  try {
    const res = await axiosForBackend.get('/api/ai/setting');
    return res.data.setting;
  } catch {
    return null;
  }
}

export async function saveAiSetting(data: AiSettingItem): Promise<AiSettingItem> {
  const res = await axiosForBackend.post('/api/ai/setting', data);
  return res.data;
}

export async function testAiConnection(data: AiSettingItem): Promise<TestAiConnectionResponse> {
  const res = await axiosForBackend.post('/api/ai/setting/test', data);
  return res.data;
}
