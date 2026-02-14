"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type {
  NotificationListResponse,
  NotificationItem,
} from "@/types/notification";

const TYPE_LABELS: Record<string, string> = {
  APPLICATION_RECEIVED: "새 지원",
  STATUS_CHANGED: "상태 변경",
  SCOUT_RECEIVED: "스카우트",
  SYSTEM: "시스템",
};

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const result = await api.get<NotificationListResponse>(
        "/me/notifications"
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/me/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/me/notifications/read-all");
      fetchNotifications();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">알림</h1>
          {data && data.unread_count > 0 && (
            <span className="text-sm text-muted-foreground">
              {data.unread_count}개 읽지 않음
            </span>
          )}
        </div>
        {data && data.unread_count > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            모두 읽음
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[60px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-2">
          {data.items.map((notif) => (
            <NotificationCard
              key={notif.id}
              notif={notif}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">알림이 없습니다</p>
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notif,
  onMarkRead,
}: {
  notif: NotificationItem;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = !notif.read_at;
  const typeLabel = TYPE_LABELS[notif.type] || notif.type;

  const getMessage = (): string => {
    if (!notif.payload) return typeLabel;

    if (notif.type === "APPLICATION_RECEIVED") {
      return `"${notif.payload.job_title || "공고"}"에 새로운 지원이 접수되었습니다`;
    }
    if (notif.type === "STATUS_CHANGED") {
      const from = notif.payload.from_status || "";
      const to = notif.payload.to_status || "";
      return `지원 상태가 ${from} → ${to}(으)로 변경되었습니다`;
    }
    return typeLabel;
  };

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isUnread ? "bg-primary/5 border-primary/20" : ""
      }`}
      onClick={() => isUnread && onMarkRead(notif.id)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={`shrink-0 ${isUnread ? "text-primary" : "text-muted-foreground"}`}
        >
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm truncate ${isUnread ? "font-medium" : "text-muted-foreground"}`}
          >
            {getMessage()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(notif.created_at).toLocaleString("ko-KR")}
          </p>
        </div>
        {isUnread && (
          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
        )}
      </CardContent>
    </Card>
  );
}
