"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ClipboardList,
  Heart,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { api } from "@/lib/api";

interface MeStats {
  resumeCount: number;
  applicationCount: number;
  unreadNotifications: number;
}

export default function MePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MeStats>({
    resumeCount: 0,
    applicationCount: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get<{ items: unknown[] }>("/me/resumes").catch(() => ({ items: [] })),
      api
        .get<{ items: unknown[]; total: number }>("/me/applications")
        .catch(() => ({ items: [], total: 0 })),
      api
        .get<{ unread_count: number }>("/me/notifications?size=1")
        .catch(() => ({ unread_count: 0 })),
    ]).then(([resumes, apps, notifs]) => {
      setStats({
        resumeCount: resumes.items.length,
        applicationCount: (apps as { total: number }).total || apps.items.length,
        unreadNotifications: (notifs as { unread_count: number }).unread_count || 0,
      });
    });
  }, []);

  const quickLinks = [
    {
      label: "이력서 관리",
      href: ROUTES.ME_RESUME,
      icon: FileText,
      stat: `${stats.resumeCount}건`,
      desc: "이력서 작성 및 수정",
    },
    {
      label: "지원 현황",
      href: ROUTES.ME_APPLICATIONS,
      icon: ClipboardList,
      stat: `${stats.applicationCount}건`,
      desc: "지원한 공고 확인",
    },
    {
      label: "스크랩",
      href: ROUTES.ME_FAVORITES,
      icon: Heart,
      stat: "",
      desc: "관심 공고 모아보기",
    },
    {
      label: "알림",
      href: ROUTES.ME_NOTIFICATIONS,
      icon: Bell,
      stat: stats.unreadNotifications > 0 ? `${stats.unreadNotifications}건 안읽음` : "",
      desc: "지원 결과 및 알림",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

      {user && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <p className="text-lg font-semibold">{user.email || "-"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {user.role === "PERSON" ? "개인 회원" : user.role}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2.5">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.label}</p>
                    {item.stat && (
                      <span className="text-xs text-primary font-medium">
                        {item.stat}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
