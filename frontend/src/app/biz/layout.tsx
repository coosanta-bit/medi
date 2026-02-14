"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

const bizNav = [
  { label: "대시보드", href: ROUTES.BIZ },
  { label: "기업 인증", href: ROUTES.BIZ_VERIFY },
  { label: "공고 관리", href: ROUTES.BIZ_JOBS },
  { label: "지원자 관리", href: ROUTES.BIZ_APPLICANTS },
  { label: "인재 검색", href: ROUTES.BIZ_TALENTS },
  { label: "스카우트", href: ROUTES.BIZ_SCOUTS },
  { label: "결제/상품", href: ROUTES.BIZ_BILLING },
];

export default function BizLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`${ROUTES.LOGIN}?redirect=/biz`);
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
        <aside className="w-full md:w-52 shrink-0">
          <h2 className="font-semibold mb-4">기업 관리</h2>
          <nav className="flex md:flex-col gap-1">
            {bizNav.map((item) => (
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
