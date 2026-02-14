import { Badge } from "@/components/ui/badge";

export default function TalentsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">인재 검색</h1>
        <Badge variant="secondary">추후 구현</Badge>
      </div>
      <p className="text-muted-foreground">
        직군/경력/면허/지역 기반 인재 검색 및 열람권(크레딧) 사용 기능이 구현됩니다.
      </p>
    </div>
  );
}
