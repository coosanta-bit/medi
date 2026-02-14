"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard } from "@/components/jobs/job-card";
import { api } from "@/lib/api";
import {
  JOB_CATEGORIES,
  REGIONS,
  SHIFT_TYPES,
  EMPLOYMENT_TYPES,
  SORT_OPTIONS,
  ROUTES,
} from "@/lib/constants";
import type { JobListResponse, JobSearchParams } from "@/types/job";

const PAGE_SIZE = 20;

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[140px] rounded-lg border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse initial filters from URL
  const [filters, setFilters] = useState<JobSearchParams>({
    keyword: searchParams.get("keyword") || "",
    location_code: searchParams.get("location_code") || "",
    job_category: searchParams.get("job_category") || "",
    shift_type: searchParams.get("shift_type") || "",
    employment_type: searchParams.get("employment_type") || "",
    salary_min: searchParams.get("salary_min")
      ? Number(searchParams.get("salary_min"))
      : undefined,
    sort: searchParams.get("sort") || "LATEST",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    size: PAGE_SIZE,
  });

  const [data, setData] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Build query string from filters
  const buildQuery = useCallback((f: JobSearchParams): string => {
    const params = new URLSearchParams();
    if (f.keyword) params.set("keyword", f.keyword);
    if (f.location_code) params.set("location_code", f.location_code);
    if (f.job_category) params.set("job_category", f.job_category);
    if (f.shift_type) params.set("shift_type", f.shift_type);
    if (f.employment_type) params.set("employment_type", f.employment_type);
    if (f.salary_min) params.set("salary_min", String(f.salary_min));
    if (f.sort && f.sort !== "LATEST") params.set("sort", f.sort);
    if (f.page && f.page > 1) params.set("page", String(f.page));
    if (f.size && f.size !== PAGE_SIZE) params.set("size", String(f.size));
    return params.toString();
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(
    async (f: JobSearchParams) => {
      setLoading(true);
      try {
        const query = buildQuery(f);
        const result = await api.get<JobListResponse>(
          `/jobs${query ? `?${query}` : ""}`
        );
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  // Sync URL and fetch on filter change
  useEffect(() => {
    const query = buildQuery(filters);
    router.replace(`${ROUTES.JOBS}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
    fetchJobs(filters);
  }, [filters, buildQuery, fetchJobs, router]);

  const updateFilter = (key: keyof JobSearchParams, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      keyword: "",
      location_code: "",
      job_category: "",
      shift_type: "",
      employment_type: "",
      salary_min: undefined,
      sort: "LATEST",
      page: 1,
      size: PAGE_SIZE,
    });
  };

  const activeFilterCount = [
    filters.job_category,
    filters.location_code,
    filters.shift_type,
    filters.employment_type,
    filters.salary_min,
  ].filter(Boolean).length;

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="직종, 병원명으로 검색"
            value={filters.keyword || ""}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex gap-2">
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
          <Select
            value={filters.sort || "LATEST"}
            onValueChange={(v) => updateFilter("sort", v)}
          >
            <SelectTrigger className="w-[130px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 mb-4 bg-muted/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              value={filters.job_category || "ALL"}
              onValueChange={(v) =>
                updateFilter("job_category", v === "ALL" ? "" : v)
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
              value={filters.location_code || "ALL"}
              onValueChange={(v) =>
                updateFilter("location_code", v === "ALL" ? "" : v)
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
              value={filters.shift_type || "ALL"}
              onValueChange={(v) =>
                updateFilter("shift_type", v === "ALL" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="근무형태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 근무형태</SelectItem>
                {SHIFT_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.employment_type || "ALL"}
              onValueChange={(v) =>
                updateFilter("employment_type", v === "ALL" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="고용형태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 고용형태</SelectItem>
                {EMPLOYMENT_TYPES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
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

      {/* Active filter badges (when filter panel is closed) */}
      {!showFilters && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {filters.job_category && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter("job_category", "")}
            >
              {JOB_CATEGORIES.find((c) => c.value === filters.job_category)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.location_code && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter("location_code", "")}
            >
              {REGIONS.find((r) => r.value === filters.location_code)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.shift_type && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter("shift_type", "")}
            >
              {SHIFT_TYPES.find((s) => s.value === filters.shift_type)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.employment_type && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => updateFilter("employment_type", "")}
            >
              {EMPLOYMENT_TYPES.find((e) => e.value === filters.employment_type)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {data ? (
            <>
              총 <span className="font-semibold text-foreground">{data.total.toLocaleString()}</span>건
            </>
          ) : (
            "검색 중..."
          )}
        </p>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="grid gap-3">
          {data.items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
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
              setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
            }
          >
            이전
          </Button>
          {generatePageNumbers(filters.page || 1, totalPages).map((p, i) =>
            p === -1 ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === filters.page ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
            }
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: number[] = [];
  pages.push(1);

  if (current > 3) pages.push(-1); // ellipsis

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push(-1); // ellipsis

  pages.push(total);
  return pages;
}
