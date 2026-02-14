import { Badge } from "@/components/ui/badge";

export default function ScoutsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">스카우트</h1>
        <Badge variant="secondary">추후 구현</Badge>
      </div>
      <p className="text-muted-foreground">
        인재에게 포지션 제안 발송 및 응답 관리 기능이 구현됩니다.
      </p>
    </div>
  );
}
