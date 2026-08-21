import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ReviewListResponse,
  ReviewItem,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewType,
} from '@shared/api.interface';

export async function getReviews(params: {
  type?: ReviewType;
  page?: number;
  pageSize?: number;
} = {}): Promise<ReviewListResponse> {
  const res = await axiosForBackend.get('/api/reviews', { params });
  return res.data;
}

export async function createReview(data: CreateReviewRequest): Promise<ReviewItem> {
  const res = await axiosForBackend.post('/api/reviews', data);
  return res.data;
}

export async function updateReview(id: string, data: UpdateReviewRequest): Promise<ReviewItem> {
  const res = await axiosForBackend.patch(`/api/reviews/${id}`, data);
  return res.data;
}

export async function deleteReview(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/reviews/${id}`);
}
