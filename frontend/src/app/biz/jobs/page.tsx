"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  getLabel,
  formatSalary,
  JOB_CATEGORIES,
  ROUTES,
} from "@/lib/constants";
import type { JobListResponse, JobPostSummary } from "@/types/job";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "작성중", variant: "secondary" },
  PUBLISHED: { label: "공개중", variant: "default" },
  CLOSED: { label: "마감", variant: "outline" },
  BLINDED: { label: "블라인드", variant: "destructive" },
};

export default function BizJobsPage() {
  const [data, setData] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get<JobListResponse>(`/biz/jobs?page=${page}&size=20`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  const handlePublish = async (jobId: string) => {
    try {
      await api.post(`/biz/jobs/${jobId}/publish`);
      // Refresh list
      const updated = await api.get<JobListResponse>(`/biz/jobs?page=${page}&size=20`);
      setData(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "공개에 실패했습니다");
    }
  };

  const handleClose = async (jobId: string) => {
    try {
      await api.post(`/biz/jobs/${jobId}/close`);
      const updated = await api.get<JobListResponse>(`/biz/jobs?page=${page}&size=20`);
      setData(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "마감에 실패했습니다");
    }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">공고 관리</h1>
        <Button asChild>
          <Link href={ROUTES.BIZ_JOBS_NEW}>
            <Plus className="h-4 w-4 mr-2" />
            새 공고 등록
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[100px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((job) => (
            <BizJobRow
              key={job.id}
              job={job}
              onPublish={handlePublish}
              onClose={handleClose}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg mb-2">
            등록된 공고가 없습니다
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            첫 번째 공고를 등록해보세요
          </p>
          <Button asChild>
            <Link href={ROUTES.BIZ_JOBS_NEW}>
              <Plus className="h-4 w-4 mr-2" />
              공고 등록
            </Link>
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

function BizJobRow({
  job,
  onPublish,
  onClose,
}: {
  job: JobPostSummary;
  onPublish: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const status = STATUS_MAP[job.status] || {
    label: job.status,
    variant: "outline" as const,
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
            {job.job_category && (
              <span className="text-xs text-muted-foreground">
                {getLabel(JOB_CATEGORIES, job.job_category)}
              </span>
            )}
          </div>
          <p className="font-medium truncate">{job.title}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatSalary(job.salary_type, job.salary_min, job.salary_max)}
            {job.view_count > 0 && (
              <span className="ml-3 inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {job.view_count}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.JOB_DETAIL(job.id)}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

          {job.status === "DRAFT" && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/biz/jobs/${job.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" onClick={() => onPublish(job.id)}>
                공개
              </Button>
            </>
          )}

          {job.status === "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClose(job.id)}
            >
              마감
            </Button>
          )}

          {job.status === "CLOSED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPublish(job.id)}
            >
              재공개
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
