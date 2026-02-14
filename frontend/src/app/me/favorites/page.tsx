import { Badge } from "@/components/ui/badge";

export default function FavoritesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">스크랩 / 관심기업</h1>
        <Badge variant="secondary">추후 구현</Badge>
      </div>
      <p className="text-muted-foreground">
        스크랩한 공고와 관심기업 목록을 관리할 수 있습니다.
      </p>
    </div>
  );
}
