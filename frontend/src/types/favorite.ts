export interface FavoriteRead {
  id: string;
  job_post_id: string;
  job_title: string;
  company_name: string;
  location_code: string | null;
  close_at: string | null;
  created_at: string;
}

export interface FavoriteListResponse {
  items: FavoriteRead[];
  total: number;
}
