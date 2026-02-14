export interface JobPostSummary {
  id: string;
  company_name: string | null;
  company_type: string | null;
  status: string;
  title: string;
  job_category: string | null;
  employment_type: string | null;
  shift_type: string | null;
  salary_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  location_code: string | null;
  location_detail: string | null;
  close_at: string | null;
  published_at: string | null;
  view_count: number;
}

export interface JobPostDetail {
  id: string;
  company_id: string;
  company_name: string | null;
  company_type: string | null;
  status: string;
  title: string;
  body: string | null;
  job_category: string | null;
  department: string | null;
  specialty: string | null;
  employment_type: string | null;
  shift_type: string | null;
  salary_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  location_code: string | null;
  location_detail: string | null;
  contact_name: string | null;
  contact_visible: boolean;
  close_at: string | null;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  items: JobPostSummary[];
  page: number;
  size: number;
  total: number;
}

export interface JobSearchParams {
  keyword?: string;
  location_code?: string;
  job_category?: string;
  shift_type?: string;
  employment_type?: string;
  salary_min?: number;
  sort?: string;
  page?: number;
  size?: number;
}
