"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileWarning,
  Briefcase,
  Users,
  ClipboardList,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { getLabel, VERIFICATION_STATUSES, USER_TYPES, USER_STATUSES } from "@/lib/constants";
import type {
  AdminDashboard,
  ReportRead,
  ReportListResponse,
  JobModerationItem,
  JobModerationListResponse,
  UserAdminRead,
  UserAdminListResponse,
} from "@/types/admin";
import type {
  VerificationRead,
  VerificationListResponse,
} from "@/types/verification";

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AdminDashboard>("/admin")
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">관리자 콘솔</h1>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[80px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="인증 대기"
            value={dashboard.pending_verifications}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <StatCard
            label="신고 대기"
            value={dashboard.pending_reports}
            icon={<FileWarning className="h-4 w-4" />}
          />
          <StatCard
            label="게시 공고"
            value={dashboard.published_jobs}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <StatCard
            label="전체 회원"
            value={dashboard.total_users}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="오늘 지원"
            value={dashboard.today_applications}
            icon={<ClipboardList className="h-4 w-4" />}
          />
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs defaultValue="verifications">
        <TabsList className="mb-4">
          <TabsTrigger value="verifications">기업 인증</TabsTrigger>
          <TabsTrigger value="reports">신고 관리</TabsTrigger>
          <TabsTrigger value="jobs">공고 검수</TabsTrigger>
          <TabsTrigger value="users">회원 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="verifications">
          <VerificationsTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="jobs">
          <JobsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

// --- Verifications Tab ---

function VerificationsTab() {
  const [data, setData] = useState<VerificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<VerificationRead | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get<VerificationListResponse>(
        "/admin/verifications"
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async () => {
    if (!reviewTarget || !reviewStatus) return;
    setProcessing(true);
    try {
      await api.patch(`/admin/verifications/${reviewTarget.id}`, {
        status: reviewStatus,
        reject_reason:
          reviewStatus === "REJECTED" ? rejectReason || null : null,
      });
      setReviewTarget(null);
      setReviewStatus("");
      setRejectReason("");
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "처리에 실패했습니다");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        총 {data?.total || 0}건
      </p>

      {data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {v.company_name || "기업명 없음"}
                    </p>
                    <Badge
                      variant={
                        v.status === "PENDING"
                          ? "secondary"
                          : v.status === "APPROVED"
                            ? "default"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {getLabel(VERIFICATION_STATUSES, v.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    사업자번호: {v.company_business_no || "-"} · 신청:{" "}
                    {new Date(v.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                {v.status === "PENDING" && (
                  <Button
                    size="sm"
                    onClick={() => setReviewTarget(v)}
                  >
                    심사
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="대기 중인 인증 요청이 없습니다" />
      )}

      <Dialog
        open={!!reviewTarget}
        onOpenChange={(open) => !open && setReviewTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>인증 심사</DialogTitle>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">기업명</span>
                  <span className="font-medium">
                    {reviewTarget.company_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">사업자번호</span>
                  <span>{reviewTarget.company_business_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">파일</span>
                  <span className="truncate max-w-[200px]">
                    {reviewTarget.file_key}
                  </span>
                </div>
              </div>

              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="결정 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">승인</SelectItem>
                  <SelectItem value="REJECTED">반려</SelectItem>
                </SelectContent>
              </Select>

              {reviewStatus === "REJECTED" && (
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  rows={3}
                />
              )}

              <Button
                onClick={handleReview}
                disabled={!reviewStatus || processing}
                className="w-full"
              >
                {processing ? "처리 중..." : "확인"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Reports Tab ---

function ReportsTab() {
  const [data, setData] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const result = await api.get<ReportListResponse>(
        `/admin/reports${query}`
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleProcess = async (
    reportId: string,
    action: string,
    note?: string
  ) => {
    try {
      await api.patch(`/admin/reports/${reportId}`, {
        action,
        note: note || null,
      });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "처리에 실패했습니다");
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 {data?.total || 0}건
        </p>
        <Select
          value={statusFilter || "ALL"}
          onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="PENDING">대기</SelectItem>
            <SelectItem value="PROCESSED">처리완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {r.target_type}
                    </Badge>
                    <Badge
                      variant={
                        r.status === "PENDING" ? "secondary" : "default"
                      }
                      className="text-xs"
                    >
                      {r.status === "PENDING" ? "대기" : "처리완료"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="text-sm mb-1">
                  사유: <span className="font-medium">{r.reason_code}</span>
                </p>
                {r.detail && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {r.detail}
                  </p>
                )}
                {r.status === "PENDING" && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleProcess(r.id, "BLIND")}
                    >
                      블라인드
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProcess(r.id, "WARN")}
                    >
                      경고
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProcess(r.id, "DISMISS")}
                    >
                      기각
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="신고 내역이 없습니다" />
      )}
    </div>
  );
}

// --- Jobs Tab ---

function JobsTab() {
  const [data, setData] = useState<JobModerationListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get<JobModerationListResponse>(
        "/admin/moderation/jobs"
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBlind = async (jobId: string) => {
    try {
      await api.post(`/admin/moderation/jobs/${jobId}/blind`);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "블라인드 처리에 실패했습니다");
    }
  };

  const handleUnblind = async (jobId: string) => {
    try {
      await api.post(`/admin/moderation/jobs/${jobId}/unblind`);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "블라인드 해제에 실패했습니다");
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        총 {data?.total || 0}건
      </p>

      {data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{job.title}</p>
                    <Badge
                      variant={
                        job.status === "BLINDED" ? "destructive" : "default"
                      }
                      className="text-xs shrink-0"
                    >
                      {job.status}
                    </Badge>
                    {job.report_count > 0 && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        신고 {job.report_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.company_name || "기업명 없음"} · 조회{" "}
                    {job.view_count.toLocaleString()}
                    {job.published_at &&
                      ` · ${new Date(job.published_at).toLocaleDateString("ko-KR")}`}
                  </p>
                </div>
                {job.status === "BLINDED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnblind(job.id)}
                  >
                    <EyeOff className="h-3.5 w-3.5 mr-1" />
                    해제
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBlind(job.id)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    블라인드
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="검수할 공고가 없습니다" />
      )}
    </div>
  );
}

// --- Users Tab ---

function UsersTab() {
  const [data, setData] = useState<UserAdminListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const query = params.toString() ? `?${params.toString()}` : "";
      const result = await api.get<UserAdminListResponse>(
        `/admin/users${query}`
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  const handleStatusChange = async (
    userId: string,
    newStatus: string
  ) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        status: newStatus,
      });
      fetchData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "상태 변경에 실패했습니다"
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          placeholder="이메일 검색"
          className="w-[200px]"
        />
        <Button size="sm" variant="outline" onClick={fetchData}>
          검색
        </Button>
        <Select
          value={typeFilter || "ALL"}
          onValueChange={(v) => setTypeFilter(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {USER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "ALL"}
          onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {USER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        총 {data?.total || 0}명
      </p>

      {loading ? (
        <LoadingSkeleton />
      ) : data && data.items.length > 0 ? (
        <div className="space-y-2">
          {data.items.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate">{u.email}</p>
                    <Badge variant="outline" className="text-xs">
                      {getLabel(USER_TYPES, u.type)}
                    </Badge>
                    <Badge
                      variant={
                        u.status === "ACTIVE"
                          ? "default"
                          : u.status === "SUSPENDED"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {getLabel(USER_STATUSES, u.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.role} ·{" "}
                    {new Date(u.created_at).toLocaleDateString("ko-KR")} 가입
                  </p>
                </div>
                {u.status === "ACTIVE" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(u.id, "SUSPENDED")}
                  >
                    <UserX className="h-3.5 w-3.5 mr-1" />
                    정지
                  </Button>
                ) : u.status === "SUSPENDED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(u.id, "ACTIVE")}
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                    복구
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="회원이 없습니다" />
      )}
    </div>
  );
}

// --- Shared ---

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] rounded-lg border bg-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
