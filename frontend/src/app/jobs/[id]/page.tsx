import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  Clock,
  Building2,
  Eye,
  Briefcase,
  DollarSign,
  Calendar,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getLabel,
  formatSalary,
  JOB_CATEGORIES,
  REGIONS,
  SHIFT_TYPES,
  EMPLOYMENT_TYPES,
  ROUTES,
} from "@/lib/constants";
import { ApplyButton } from "@/components/jobs/apply-button";
import { ScrapButton } from "@/components/jobs/scrap-button";
import type { JobPostDetail } from "@/types/job";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchJob(id: string): Promise<JobPostDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchJob(id);

  if (!job) {
    return { title: "공고를 찾을 수 없습니다" };
  }

  const location = getLabel(REGIONS, job.location_code);
  const category = getLabel(JOB_CATEGORIES, job.job_category);
  const salary = formatSalary(job.salary_type, job.salary_min, job.salary_max);

  return {
    title: `${job.title} | ${job.company_name || "메디포닥"}`,
    description: `${job.company_name || "의료기관"} - ${category} 채용 | ${location} | ${salary}`,
    openGraph: {
      title: job.title,
      description: `${job.company_name || "의료기관"} - ${category} 채용`,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await fetchJob(id);

  if (!job) notFound();

  const isOpen = job.status === "PUBLISHED";
  const isClosed = job.status === "CLOSED";

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back button */}
      <Link
        href={ROUTES.JOBS}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        공고 목록
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span>{job.company_name || "기업명 비공개"}</span>
              {isClosed && (
                <Badge variant="destructive" className="text-xs">
                  마감
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.job_category && (
                <Badge variant="secondary">
                  {getLabel(JOB_CATEGORIES, job.job_category)}
                </Badge>
              )}
              {job.employment_type && (
                <Badge variant="outline">
                  {getLabel(EMPLOYMENT_TYPES, job.employment_type)}
                </Badge>
              )}
              {job.shift_type && (
                <Badge variant="outline">
                  {getLabel(SHIFT_TYPES, job.shift_type)}
                </Badge>
              )}
            </div>
          </div>

          {/* Key info */}
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label="급여"
                  value={formatSalary(
                    job.salary_type,
                    job.salary_min,
                    job.salary_max
                  )}
                />
                <InfoItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="근무지"
                  value={
                    job.location_detail ||
                    getLabel(REGIONS, job.location_code)
                  }
                />
                <InfoItem
                  icon={<Briefcase className="h-4 w-4" />}
                  label="진료과"
                  value={job.department || job.specialty || "-"}
                />
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="마감일"
                  value={
                    job.close_at
                      ? new Date(job.close_at).toLocaleDateString("ko-KR")
                      : "상시채용"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Job description */}
          {job.body && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">상세 내용</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {job.body}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact info */}
          {job.contact_visible && job.contact_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">담당자 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{job.contact_name}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply card */}
          <Card className="sticky top-20">
            <CardContent className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {formatSalary(
                    job.salary_type,
                    job.salary_min,
                    job.salary_max
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {job.close_at
                    ? `마감: ${new Date(job.close_at).toLocaleDateString("ko-KR")}`
                    : "상시채용"}
                </p>
              </div>

              <Separator />

              <ApplyButton jobId={job.id} isOpen={isOpen} />

              <div className="flex gap-2">
                <ScrapButton jobId={job.id} />
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  조회 {job.view_count.toLocaleString()}
                </span>
                {job.published_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(job.published_at).toLocaleDateString("ko-KR")} 게시
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">기업 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {job.company_name || "기업명 비공개"}
              </p>
              {job.company_type && (
                <p className="text-sm text-muted-foreground mt-1">
                  {job.company_type}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
