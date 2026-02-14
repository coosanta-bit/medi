export interface VerificationRead {
  id: string;
  company_id: string;
  company_name: string | null;
  company_business_no: string | null;
  status: string;
  file_key: string | null;
  reject_reason: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationListResponse {
  items: VerificationRead[];
  total: number;
}
