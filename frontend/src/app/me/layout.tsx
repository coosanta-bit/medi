"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

const meNav = [
  { label: "이력서", href: ROUTES.ME_RESUME },
  { label: "지원 현황", href: ROUTES.ME_APPLICATIONS },
  { label: "스크랩", href: ROUTES.ME_FAVORITES },
  { label: "알림 설정", href: ROUTES.ME_NOTIFICATIONS },
];

export default function MeLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`${ROUTES.LOGIN}?redirect=/me`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-48 shrink-0">
          <h2 className="font-semibold mb-4">마이페이지</h2>
          <nav className="flex md:flex-col gap-2">
            {meNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-primary px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
