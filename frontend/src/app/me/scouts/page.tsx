"use client";

import { useEffect, useState } from "react";
import { Mail, Building2, Clock, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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

const RESPONDABLE_STATUSES = new Set(["SENT", "VIEWED", "HOLD"]);

export default function MyScoutsPage() {
  const [data, setData] = useState<ScoutListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedScout, setSelectedScout] = useState<ScoutRead | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responding, setResponding] = useState(false);

  const fetchScouts = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const result = await api.get<ScoutListResponse>(`/me/scouts${query}`);
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

  const handleViewDetail = async (scoutId: string) => {
    try {
      const detail = await api.get<ScoutRead>(`/me/scouts/${scoutId}`);
      setSelectedScout(detail);
      setShowDetail(true);
    } catch {
      alert("상세 정보를 불러올 수 없습니다");
    }
  };

  const handleRespond = async (status: string) => {
    if (!selectedScout) return;
    setResponding(true);
    try {
      const updated = await api.patch<ScoutRead>(
        `/me/scouts/${selectedScout.id}/respond`,
        { status }
      );
      setSelectedScout(updated);
      fetchScouts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "응답에 실패했습니다");
    } finally {
      setResponding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">받은 스카우트</h1>
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
              className="h-[90px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((scout) => (
            <Card
              key={scout.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetail(scout.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {scout.company_name || "기업명 비공개"}
                      </span>
                      {scout.status === "SENT" && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          NEW
                        </Badge>
                      )}
                    </div>
                    {scout.job_title && (
                      <p className="text-sm truncate flex items-center gap-1 mb-1">
                        <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                        {scout.job_title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(scout.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[scout.status] || "outline"}
                    className="shrink-0"
                  >
                    {getLabel(SCOUT_STATUSES, scout.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg mb-2">
            받은 스카우트가 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            이력서를 공개로 설정하면 스카우트를 받을 수 있습니다
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
                <span className="text-sm text-muted-foreground">기업</span>
                <span className="text-sm font-medium">
                  {selectedScout.company_name || "기업명 비공개"}
                </span>
              </div>
              {selectedScout.job_title && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    제안 공고
                  </span>
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {selectedScout.job_title}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">수신일</span>
                <span className="text-sm">
                  {new Date(selectedScout.created_at).toLocaleDateString(
                    "ko-KR"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">상태</span>
                <Badge
                  variant={STATUS_VARIANT[selectedScout.status] || "outline"}
                >
                  {getLabel(SCOUT_STATUSES, selectedScout.status)}
                </Badge>
              </div>

              {selectedScout.message && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      메시지
                    </p>
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedScout.message}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {RESPONDABLE_STATUSES.has(selectedScout.status) && (
                <>
                  <Separator />
                  <DialogFooter className="flex-row gap-2 sm:justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={responding}
                      onClick={() => handleRespond("REJECTED")}
                    >
                      거절
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={responding}
                      onClick={() => handleRespond("HOLD")}
                    >
                      보류
                    </Button>
                    <Button
                      size="sm"
                      disabled={responding}
                      onClick={() => handleRespond("ACCEPTED")}
                    >
                      수락
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
