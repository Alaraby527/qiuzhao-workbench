import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  JobListingItem,
  JobListingListResponse,
  ParsedJobItem,
  BatchCreateJobResponse,
  MatchLevel,
  MatchScoreDetail,
} from '@shared/api.interface';

interface GetJobListingsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  industry?: string;
  location?: string;
  education?: string;
  matchLevel?: MatchLevel;
  sortBy?: string;
  excludeTechRoles?: boolean;
  excludeHighEducation?: boolean;
}

export async function getJobListings(params: GetJobListingsParams = {}): Promise<JobListingListResponse> {
  const res = await axiosForBackend.get('/api/job-listings', { params });
  return res.data;
}

export async function getJobListing(id: string): Promise<JobListingItem> {
  const res = await axiosForBackend.get(`/api/job-listings/${id}`);
  return res.data;
}

export async function markJobApplied(id: string): Promise<JobListingItem> {
  const res = await axiosForBackend.post(`/api/job-listings/${id}/mark-applied`);
  return res.data;
}

export async function updateJobListing(id: string, data: { isHidden?: boolean }): Promise<JobListingItem> {
  const res = await axiosForBackend.patch(`/api/job-listings/${id}`, data);
  return res.data;
}

export async function parseJobs(params: {
  type: 'text' | 'image' | 'link';
  content: string;
  images?: string[];
}): Promise<{ items: ParsedJobItem[] }> {
  const res = await axiosForBackend.post('/api/job-listings/parse', params);
  return res.data;
}

export async function getMatchAnalysis(id: string): Promise<MatchScoreDetail> {
  const res = await axiosForBackend.get(`/api/job-listings/${id}/match-analysis`);
  return res.data;
}

export async function batchCreateJobs(items: Array<Omit<JobListingItem, 'id' | 'createdAt' | 'updatedAt' | 'isHidden'>>): Promise<BatchCreateJobResponse> {
  const res = await axiosForBackend.post('/api/job-listings/batch-create', { items });
  return res.data;
}
