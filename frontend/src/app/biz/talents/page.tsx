"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Send,
  Award,
  Briefcase,
  UserSearch,
} from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { JOB_CATEGORIES, REGIONS, getLabel } from "@/lib/constants";
import type { TalentListResponse, TalentSummary } from "@/types/scout";
import type { JobListResponse } from "@/types/job";

const PAGE_SIZE = 20;

interface Filters {
  keyword: string;
  desired_job: string;
  desired_region: string;
  is_experienced: string;
  page: number;
}

export default function TalentsPage() {
  const [filters, setFilters] = useState<Filters>({
    keyword: "",
    desired_job: "",
    desired_region: "",
    is_experienced: "",
    page: 1,
  });
  const [data, setData] = useState<TalentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Scout dialog state
  const [scoutTarget, setScoutTarget] = useState<TalentSummary | null>(null);
  const [scoutMessage, setScoutMessage] = useState("");
  const [scoutJobId, setScoutJobId] = useState("");
  const [sending, setSending] = useState(false);
  const [companyJobs, setCompanyJobs] = useState<
    { id: string; title: string }[]
  >([]);

  const fetchTalents = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.keyword) params.set("keyword", f.keyword);
      if (f.desired_job) params.set("desired_job", f.desired_job);
      if (f.desired_region) params.set("desired_region", f.desired_region);
      if (f.is_experienced) params.set("is_experienced", f.is_experienced);
      params.set("page", String(f.page));
      params.set("size", String(PAGE_SIZE));
      const result = await api.get<TalentListResponse>(
        `/biz/talents?${params}`
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTalents(filters);
  }, [filters, fetchTalents]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      keyword: "",
      desired_job: "",
      desired_region: "",
      is_experienced: "",
      page: 1,
    });
  };

  const activeFilterCount = [
    filters.desired_job,
    filters.desired_region,
    filters.is_experienced,
  ].filter(Boolean).length;

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const openScoutDialog = async (talent: TalentSummary) => {
    setScoutTarget(talent);
    setScoutMessage("");
    setScoutJobId("");
    try {
      const jobs = await api.get<JobListResponse>("/biz/jobs?size=100");
      setCompanyJobs(
        jobs.items
          .filter((j) => j.status === "PUBLISHED")
          .map((j) => ({ id: j.id, title: j.title }))
      );
    } catch {
      setCompanyJobs([]);
    }
  };

  const handleSendScout = async () => {
    if (!scoutTarget) return;
    setSending(true);
    try {
      await api.post("/biz/scouts", {
        resume_id: scoutTarget.id,
        job_post_id: scoutJobId || undefined,
        message: scoutMessage || undefined,
      });
      setScoutTarget(null);
      alert("스카우트를 보냈습니다");
    } catch (err) {
      alert(err instanceof Error ? err.message : "스카우트 발송에 실패했습니다");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="직종, 키워드로 인재 검색"
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="h-11 relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          필터
          {activeFilterCount > 0 && (
            <Badge className="ml-1.5 h-5 w-5 p-0 justify-center text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="border rounded-lg p-4 mb-4 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              value={filters.desired_job || "ALL"}
              onValueChange={(v) =>
                updateFilter("desired_job", v === "ALL" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="직군" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 직군</SelectItem>
                {JOB_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.desired_region || "ALL"}
              onValueChange={(v) =>
                updateFilter("desired_region", v === "ALL" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 지역</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.is_experienced || "ALL"}
              onValueChange={(v) =>
                updateFilter("is_experienced", v === "ALL" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="경력" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="true">경력</SelectItem>
                <SelectItem value="false">신입</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                필터 초기화
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active filter badges */}
      {!showFilters && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {filters.desired_job && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter("desired_job", "")}
            >
              {getLabel(JOB_CATEGORIES, filters.desired_job)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.desired_region && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter("desired_region", "")}
            >
              {getLabel(REGIONS, filters.desired_region)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.is_experienced && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter("is_experienced", "")}
            >
              {filters.is_experienced === "true" ? "경력" : "신입"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {data ? (
            <>
              총{" "}
              <span className="font-semibold text-foreground">
                {data.total.toLocaleString()}
              </span>
              명
            </>
          ) : (
            "검색 중..."
          )}
        </p>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((talent) => (
            <TalentCard
              key={talent.id}
              talent={talent}
              onScout={() => openScoutDialog(talent)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <UserSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">
            검색 결과가 없습니다
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            다른 검색어나 필터를 사용해보세요
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              필터 초기화
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {filters.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            다음
          </Button>
        </div>
      )}

      {/* Scout Dialog */}
      <Dialog
        open={!!scoutTarget}
        onOpenChange={(open) => !open && setScoutTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>스카우트 보내기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {companyJobs.length > 0 && (
              <div className="space-y-2">
                <Label>연결할 공고 (선택)</Label>
                <Select
                  value={scoutJobId || "NONE"}
                  onValueChange={(v) =>
                    setScoutJobId(v === "NONE" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="공고 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">선택 안함</SelectItem>
                    {companyJobs.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>메시지 (선택)</Label>
              <Textarea
                value={scoutMessage}
                onChange={(e) => setScoutMessage(e.target.value)}
                placeholder="인재에게 전달할 메시지를 작성해주세요..."
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {scoutMessage.length}/2000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScoutTarget(null)}
              disabled={sending}
            >
              취소
            </Button>
            <Button onClick={handleSendScout} disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? "보내는 중..." : "스카우트 보내기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TalentCard({
  talent,
  onScout,
}: {
  talent: TalentSummary;
  onScout: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {talent.desired_job && (
                <Badge variant="default" className="text-xs">
                  {getLabel(JOB_CATEGORIES, talent.desired_job)}
                </Badge>
              )}
              {talent.desired_region && (
                <Badge variant="outline" className="text-xs">
                  {getLabel(REGIONS, talent.desired_region)}
                </Badge>
              )}
              <Badge
                variant={talent.is_experienced ? "secondary" : "outline"}
                className="text-xs"
              >
                {talent.is_experienced ? "경력" : "신입"}
              </Badge>
            </div>

            {talent.license_types.length > 0 && (
              <div className="flex items-center gap-1 mb-1.5 text-xs text-muted-foreground">
                <Award className="h-3 w-3 shrink-0" />
                {talent.license_types.join(", ")}
              </div>
            )}

            {talent.career_count > 0 && (
              <div className="flex items-center gap-1 mb-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3 shrink-0" />
                경력 {talent.career_count}건
              </div>
            )}

            {talent.summary_preview && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {talent.summary_preview}
              </p>
            )}
          </div>

          <Button
            size="sm"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onScout();
            }}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            스카우트
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
