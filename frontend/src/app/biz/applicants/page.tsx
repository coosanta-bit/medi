"use client";

import { useEffect, useState } from "react";
import { Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { getLabel, APPLICATION_STATUSES } from "@/lib/constants";
import type {
  ApplicationListResponse,
  ApplicationRead,
  ApplicationDetail,
} from "@/types/application";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  RECEIVED: "secondary",
  REVIEWING: "outline",
  INTERVIEW: "default",
  OFFERED: "default",
  HIRED: "default",
  REJECTED: "destructive",
  ON_HOLD: "outline",
};

const CHANGEABLE_STATUSES = APPLICATION_STATUSES.filter(
  (s) => s.value !== "RECEIVED"
);

export default function ApplicantsPage() {
  const [data, setData] = useState<ApplicationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const result = await api.get<ApplicationListResponse>(
        `/biz/applicants${query}`
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [statusFilter]);

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await api.get<ApplicationDetail>(
        `/biz/applicants/${id}`
      );
      setSelectedApp(detail);
      setShowDetail(true);
    } catch {
      alert("상세 정보를 불러올 수 없습니다");
    }
  };

  const handleStatusChange = async (
    appId: string,
    newStatus: string,
    note?: string
  ) => {
    try {
      await api.patch(`/biz/applicants/${appId}/status`, {
        status: newStatus,
        note: note || null,
      });
      fetchApplicants();
      if (selectedApp && selectedApp.id === appId) {
        const updated = await api.get<ApplicationDetail>(
          `/biz/applicants/${appId}`
        );
        setSelectedApp(updated);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "상태 변경에 실패했습니다");
    }
  };

  const handleAddNote = async (appId: string, noteText: string) => {
    try {
      await api.post(`/biz/applicants/${appId}/notes`, { note: noteText });
      if (selectedApp && selectedApp.id === appId) {
        const updated = await api.get<ApplicationDetail>(
          `/biz/applicants/${appId}`
        );
        setSelectedApp(updated);
      }
    } catch {
      alert("메모 추가에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">지원자 관리</h1>
        <Select
          value={statusFilter || "ALL"}
          onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data && (
        <p className="text-sm text-muted-foreground mb-4">
          총 {data.total}명
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
          {data.items.map((app) => (
            <Card
              key={app.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetail(app.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {app.applicant_name || "이름 미등록"}
                    </p>
                    <Badge
                      variant={STATUS_VARIANT[app.status] || "outline"}
                      className="text-xs"
                    >
                      {getLabel(APPLICATION_STATUSES, app.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {app.job_title || "공고"}
                    {" · "}
                    {new Date(app.created_at).toLocaleDateString("ko-KR")} 지원
                  </p>
                </div>
                <Select
                  value={app.status}
                  onValueChange={(v) => {
                    // Prevent click propagation
                    handleStatusChange(app.id, v);
                  }}
                >
                  <SelectTrigger
                    className="w-[110px] shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANGEABLE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">
            지원자가 없습니다
          </p>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>지원자 상세</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <ApplicantDetail
              app={selectedApp}
              onStatusChange={handleStatusChange}
              onAddNote={handleAddNote}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicantDetail({
  app,
  onStatusChange,
  onAddNote,
}: {
  app: ApplicationDetail;
  onStatusChange: (id: string, status: string, note?: string) => void;
  onAddNote: (id: string, note: string) => void;
}) {
  const [noteText, setNoteText] = useState("");

  const handleSubmitNote = () => {
    if (!noteText.trim()) return;
    onAddNote(app.id, noteText.trim());
    setNoteText("");
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">지원자</span>
          <span className="text-sm font-medium">
            {app.applicant_name || "이름 미등록"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">공고</span>
          <span className="text-sm font-medium truncate max-w-[200px]">
            {app.job_title}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">지원일</span>
          <span className="text-sm">
            {new Date(app.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">상태</span>
          <Select
            value={app.status}
            onValueChange={(v) => onStatusChange(app.id, v)}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANGEABLE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Status history */}
      {app.status_history.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">상태 변경 이력</p>
          <div className="space-y-1.5">
            {app.status_history.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="shrink-0">
                  {new Date(h.created_at).toLocaleString("ko-KR")}
                </span>
                <span>
                  {h.from_status
                    ? `${getLabel(APPLICATION_STATUSES, h.from_status)} → `
                    : ""}
                  <span className="font-medium text-foreground">
                    {getLabel(APPLICATION_STATUSES, h.to_status)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Notes */}
      <div>
        <p className="text-sm font-medium mb-2">
          <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
          내부 메모
        </p>
        {app.notes.length > 0 ? (
          <div className="space-y-2 mb-3">
            {app.notes.map((n) => (
              <div key={n.id} className="bg-muted/50 rounded p-2">
                <p className="text-sm">{n.note}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">
            아직 메모가 없습니다
          </p>
        )}
        <div className="flex gap-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="내부 메모 추가..."
            rows={2}
            className="flex-1"
          />
          <Button
            size="sm"
            className="self-end"
            disabled={!noteText.trim()}
            onClick={handleSubmitNote}
          >
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}
