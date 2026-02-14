import { Badge } from "@/components/ui/badge";

export default function BizDashboardPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">기업 대시보드</h1>
        <Badge variant="secondary">추후 구현</Badge>
      </div>
      <p className="text-muted-foreground">
        공고/지원자 현황 요약, 결제 상태, KPI 지표가 표시됩니다.
      </p>
    </div>
  );
}
