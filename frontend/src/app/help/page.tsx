import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "고객센터",
};

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">고객센터</h1>
        <Badge variant="secondary">추후 구현</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">자주 묻는 질문 (FAQ)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              카테고리별 FAQ 검색 기능이 구현됩니다.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1:1 문의</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              회원/비회원 문의 접수 및 처리 상태 확인 기능이 구현됩니다.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">공지사항</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              서비스 공지 및 업데이트 안내가 표시됩니다.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">신고하기</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              공고/기업/사용자 신고 접수 기능이 구현됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
