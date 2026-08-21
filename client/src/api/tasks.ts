import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TaskListResponse,
  TaskItem,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  RecommendedTask,
  DailySettingItem,
  UpdateDailySettingRequest,
  AddRecommendedRequest,
  TaskDateDensityResponse,
} from '@shared/api.interface';

interface GetTasksParams {
  date?: string;
  status?: TaskStatus;
  priority?: string;
  energyLevel?: string;
  page?: number;
  pageSize?: number;
}

export async function getTasks(params: GetTasksParams = {}): Promise<TaskListResponse> {
  const res = await axiosForBackend.get('/api/tasks', { params });
  return res.data;
}

export async function createTask(data: CreateTaskRequest): Promise<TaskItem> {
  const res = await axiosForBackend.post('/api/tasks', data);
  return res.data;
}

export async function updateTask(id: string, data: UpdateTaskRequest): Promise<TaskItem> {
  const res = await axiosForBackend.patch(`/api/tasks/${id}`, data);
  return res.data;
}

export async function deleteTask(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/tasks/${id}`);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskItem> {
  const res = await axiosForBackend.patch(`/api/tasks/${id}/status`, { status });
  return res.data;
}

export async function getDailyRecommendations(date?: string): Promise<RecommendedTask[]> {
  const res = await axiosForBackend.get('/api/tasks/recommended-daily', {
    params: date ? { date } : {},
  });
  return res.data;
}

export async function addRecommendedTasks(items: RecommendedTask[], date: string): Promise<TaskItem[]> {
  const res = await axiosForBackend.post('/api/tasks/add-recommended', {
    items,
    date,
  } as AddRecommendedRequest);
  return res.data;
}

export async function getDailySetting(date?: string): Promise<DailySettingItem> {
  const res = await axiosForBackend.get('/api/daily-setting', {
    params: date ? { date } : {},
  });
  return res.data;
}

export async function updateDailySetting(date: string, data: UpdateDailySettingRequest): Promise<DailySettingItem> {
  const res = await axiosForBackend.patch('/api/daily-setting', data, {
    params: { date },
  });
  return res.data;
}

export async function getTaskDateDensity(startDate: string, endDate: string): Promise<TaskDateDensityResponse> {
  const res = await axiosForBackend.get('/api/tasks/date-density', {
    params: { startDate, endDate },
  });
  return res.data;
}
