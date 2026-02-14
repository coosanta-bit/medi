import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Stethoscope className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-8">
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/jobs">채용공고 보기</Link>
        </Button>
      </div>
    </div>
  );
}
