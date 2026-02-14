export interface ResumeLicense {
  id: string;
  license_type: string;
  issued_at: string | null;
  created_at: string;
}

export interface ResumeCareer {
  id: string;
  org_name: string;
  role: string | null;
  department: string | null;
  start_at: string;
  end_at: string | null;
  description: string | null;
  created_at: string;
}

export interface ResumeDetail {
  id: string;
  user_id: string;
  title: string;
  visibility: string;
  desired_job: string | null;
  desired_region: string | null;
  desired_shift: string | null;
  desired_salary_type: string | null;
  desired_salary_min: number | null;
  summary: string | null;
  is_experienced: boolean;
  licenses: ResumeLicense[];
  careers: ResumeCareer[];
  created_at: string;
  updated_at: string;
}

export interface ResumeSummary {
  id: string;
  title: string;
  visibility: string;
  desired_job: string | null;
  is_experienced: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeListResponse {
  items: ResumeSummary[];
}

export interface ResumeLicenseInput {
  license_type: string;
  license_no_enc?: string;
  issued_at?: string;
}

export interface ResumeCareerInput {
  org_name: string;
  role?: string;
  department?: string;
  start_at: string;
  end_at?: string;
  description?: string;
}
