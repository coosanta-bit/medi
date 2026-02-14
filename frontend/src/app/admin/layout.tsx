"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/lib/constants";

const ADMIN_ROLES = ["ADMIN", "CS", "SALES"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
    if (!isLoading && user && !ADMIN_ROLES.includes(user.role)) {
      router.push(ROUTES.HOME);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  );
}
