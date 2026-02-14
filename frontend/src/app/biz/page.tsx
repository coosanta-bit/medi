"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  UserCheck,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { getLabel, APPLICATION_STATUSES } from "@/lib/constants";
import { api } from "@/lib/api";

interface DashboardData {
  active_jobs: number;
  total_applicants: number;
  new_applicants: number;
  credit_balance: number;
  recent_applicants: {
    id: string;
    job_title: string;
    status: string;
    created_at: string | null;
  }[];
}

export default function BizDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>("/biz")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">기업 대시보드</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "활성 공고",
      value: data?.active_jobs ?? 0,
      icon: Briefcase,
      href: ROUTES.BIZ_JOBS,
      color: "text-blue-500",
    },
    {
      label: "전체 지원자",
      value: data?.total_applicants ?? 0,
      icon: Users,
      href: ROUTES.BIZ_APPLICANTS,
      color: "text-green-500",
    },
    {
      label: "신규 지원",
      value: data?.new_applicants ?? 0,
      icon: UserCheck,
      href: ROUTES.BIZ_APPLICANTS,
      color: "text-orange-500",
    },
    {
      label: "열람권 잔여",
      value: data?.credit_balance ?? 0,
      icon: CreditCard,
      href: ROUTES.BIZ_BILLING,
      color: "text-purple-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">기업 대시보드</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">최근 지원자</CardTitle>
            <Link
              href={ROUTES.BIZ_APPLICANTS}
              className="text-sm text-primary hover:underline"
            >
              전체보기
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data?.recent_applicants && data.recent_applicants.length > 0 ? (
            <div className="space-y-3">
              {data.recent_applicants.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {a.job_title}
                    </p>
                    {a.created_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      a.status === "RECEIVED"
                        ? "default"
                        : a.status === "HIRED"
                          ? "default"
                          : "secondary"
                    }
                    className="text-xs ml-2"
                  >
                    {getLabel(APPLICATION_STATUSES, a.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              아직 지원자가 없습니다
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
