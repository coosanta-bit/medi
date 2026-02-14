"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-2">오류 발생</h1>
      <p className="text-muted-foreground mb-2">
        페이지를 불러오는 중 문제가 발생했습니다.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        {error.message || "잠시 후 다시 시도해주세요."}
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
