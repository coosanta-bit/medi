export interface TalentSummary {
  id: string;
  desired_job: string | null;
  desired_region: string | null;
  is_experienced: boolean;
  license_types: string[];
  career_count: number;
  summary_preview: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentListResponse {
  items: TalentSummary[];
  page: number;
  size: number;
  total: number;
}

export interface ScoutRead {
  id: string;
  company_id: string;
  company_name: string | null;
  user_id: string;
  job_post_id: string | null;
  job_title: string | null;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoutListResponse {
  items: ScoutRead[];
  total: number;
}

export interface ScoutCreateInput {
  resume_id: string;
  job_post_id?: string;
  message?: string;
}
