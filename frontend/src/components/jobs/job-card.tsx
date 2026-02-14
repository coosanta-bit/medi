import Link from "next/link";
import { MapPin, Clock, Building2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getLabel,
  formatSalary,
  JOB_CATEGORIES,
  REGIONS,
  SHIFT_TYPES,
  EMPLOYMENT_TYPES,
  ROUTES,
} from "@/lib/constants";
import type { JobPostSummary } from "@/types/job";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export function JobCard({ job }: { job: JobPostSummary }) {
  return (
    <Link href={ROUTES.JOB_DETAIL(job.id)}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            {/* Company & date */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.company_name || "기업명 비공개"}
              </span>
              <span>{timeAgo(job.published_at)}</span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base line-clamp-2">{job.title}</h3>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {job.job_category && (
                <Badge variant="secondary" className="text-xs">
                  {getLabel(JOB_CATEGORIES, job.job_category)}
                </Badge>
              )}
              {job.employment_type && (
                <Badge variant="outline" className="text-xs">
                  {getLabel(EMPLOYMENT_TYPES, job.employment_type)}
                </Badge>
              )}
              {job.shift_type && (
                <Badge variant="outline" className="text-xs">
                  {getLabel(SHIFT_TYPES, job.shift_type)}
                </Badge>
              )}
            </div>

            {/* Info row */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {job.location_code && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {getLabel(REGIONS, job.location_code)}
                </span>
              )}
              <span className="font-medium text-foreground">
                {formatSalary(job.salary_type, job.salary_min, job.salary_max)}
              </span>
              {job.close_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{new Date(job.close_at).toLocaleDateString("ko-KR")}
                </span>
              )}
              <span className="flex items-center gap-1 ml-auto">
                <Eye className="h-3.5 w-3.5" />
                {job.view_count}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
