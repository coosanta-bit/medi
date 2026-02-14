"use client";

import { useAuth } from "@/components/providers/auth-provider";

export default function MePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">마이페이지</h1>
      {user && (
        <div className="space-y-2 text-sm">
          <p>역할: {user.role}</p>
          <p>이메일: {user.email || "-"}</p>
        </div>
      )}
    </div>
  );
}
