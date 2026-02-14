"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getLabel, APPLICATION_STATUSES, ROUTES } from "@/lib/constants";
import type { ApplicationListResponse, ApplicationRead } from "@/types/application";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  RECEIVED: "secondary",
  REVIEWING: "outline",
  INTERVIEW: "default",
  OFFERED: "default",
  HIRED: "default",
  REJECTED: "destructive",
  ON_HOLD: "outline",
};

export default function ApplicationsPage() {
  const [data, setData] = useState<ApplicationListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApplicationListResponse>("/me/applications")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">지원 현황</h1>

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
          {data.items.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg mb-2">
            지원 내역이 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            관심있는 공고에 지원해보세요
          </p>
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app }: { app: ApplicationRead }) {
  const variant = STATUS_VARIANT[app.status] || "outline";

  return (
    <Link href={ROUTES.JOB_DETAIL(app.job_post_id)}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {app.company_name || "기업명 비공개"}
                </span>
              </div>
              <p className="font-medium truncate">
                {app.job_title || "공고 제목 없음"}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(app.created_at).toLocaleDateString("ko-KR")} 지원
                </span>
              </div>
            </div>
            <Badge variant={variant} className="shrink-0">
              {getLabel(APPLICATION_STATUSES, app.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
