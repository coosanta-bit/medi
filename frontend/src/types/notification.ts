export interface NotificationItem {
  id: string;
  type: string;
  channel: string;
  payload: Record<string, string> | null;
  status: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
}
