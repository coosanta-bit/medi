export interface AdminDashboard {
  pending_verifications: number;
  pending_reports: number;
  published_jobs: number;
  total_users: number;
  today_applications: number;
}

export interface ReportRead {
  id: string;
  target_type: string;
  target_id: string;
  reporter_user_id: string | null;
  reason_code: string;
  detail: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReportListResponse {
  items: ReportRead[];
  total: number;
}

export interface JobModerationItem {
  id: string;
  company_name: string | null;
  title: string;
  status: string;
  published_at: string | null;
  view_count: number;
  report_count: number;
}

export interface JobModerationListResponse {
  items: JobModerationItem[];
  total: number;
}

export interface UserAdminRead {
  id: string;
  email: string;
  type: string;
  role: string;
  status: string;
  created_at: string;
}

export interface UserAdminListResponse {
  items: UserAdminRead[];
  total: number;
}

export interface AdminLogRead {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta_json: Record<string, unknown> | null;
  created_at: string;
}
