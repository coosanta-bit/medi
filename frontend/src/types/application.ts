export interface ApplicationRead {
  id: string;
  job_post_id: string;
  job_title: string | null;
  company_name: string | null;
  applicant_user_id: string;
  applicant_name: string | null;
  resume_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationListResponse {
  items: ApplicationRead[];
  total: number;
}

export interface StatusHistory {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface ApplicationNote {
  id: string;
  author_user_id: string;
  note: string;
  created_at: string;
}

export interface ApplicationDetail {
  id: string;
  job_post_id: string;
  job_title: string | null;
  company_name: string | null;
  applicant_user_id: string;
  applicant_name: string | null;
  resume_id: string | null;
  status: string;
  status_history: StatusHistory[];
  notes: ApplicationNote[];
  created_at: string;
  updated_at: string;
}
