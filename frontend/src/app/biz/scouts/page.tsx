"use client";

import { useEffect, useState } from "react";
import { Send, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { SCOUT_STATUSES, getLabel } from "@/lib/constants";
import type { ScoutListResponse, ScoutRead } from "@/types/scout";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SENT: "secondary",
  VIEWED: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
  HOLD: "outline",
};

export default function ScoutsPage() {
  const [data, setData] = useState<ScoutListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedScout, setSelectedScout] = useState<ScoutRead | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchScouts = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const result = await api.get<ScoutListResponse>(`/biz/scouts${query}`);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScouts();
  }, [statusFilter]);

  const handleViewDetail = async (scout: ScoutRead) => {
    try {
      const detail = await api.get<ScoutRead>(`/biz/scouts/${scout.id}`);
      setSelectedScout(detail);
      setShowDetail(true);
    } catch {
      alert("상세 정보를 불러올 수 없습니다");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">스카우트 관리</h1>
        <Select
          value={statusFilter || "ALL"}
          onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {SCOUT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data && (
        <p className="text-sm text-muted-foreground mb-4">
          총 {data.total}건
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[80px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((scout) => (
            <Card
              key={scout.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetail(scout)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={STATUS_VARIANT[scout.status] || "outline"}
                      className="text-xs"
                    >
                      {getLabel(SCOUT_STATUSES, scout.status)}
                    </Badge>
                    {scout.job_title && (
                      <span className="text-sm font-medium truncate">
                        {scout.job_title}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {scout.message
                      ? scout.message.slice(0, 50) +
                        (scout.message.length > 50 ? "..." : "")
                      : "메시지 없음"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(scout.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">
            발송한 스카우트가 없습니다
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            인재 검색에서 스카우트를 보내보세요
          </p>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>스카우트 상세</DialogTitle>
          </DialogHeader>
          {selectedScout && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">상태</span>
                <Badge
                  variant={STATUS_VARIANT[selectedScout.status] || "outline"}
                >
                  {getLabel(SCOUT_STATUSES, selectedScout.status)}
                </Badge>
              </div>
              {selectedScout.job_title && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    연결 공고
                  </span>
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {selectedScout.job_title}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">발송일</span>
                <span className="text-sm">
                  {new Date(selectedScout.created_at).toLocaleDateString(
                    "ko-KR"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  마지막 업데이트
                </span>
                <span className="text-sm">
                  {new Date(selectedScout.updated_at).toLocaleDateString(
                    "ko-KR"
                  )}
                </span>
              </div>
              {selectedScout.message && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">메시지</p>
                  <div className="bg-muted/50 rounded p-3">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedScout.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
