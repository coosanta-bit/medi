import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <Stethoscope className="h-5 w-5" />
              메디포닥
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              병원/의료기관 전용 구인구직 플랫폼
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">구직자</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/jobs" className="hover:text-primary">채용공고</Link></li>
              <li><Link href="/me/resume" className="hover:text-primary">이력서 관리</Link></li>
              <li><Link href="/me/applications" className="hover:text-primary">지원 현황</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">기업</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/biz/jobs/new" className="hover:text-primary">공고 등록</Link></li>
              <li><Link href="/biz/talents" className="hover:text-primary">인재 검색</Link></li>
              <li><Link href="/biz/billing" className="hover:text-primary">유료 서비스</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">고객지원</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-primary">고객센터</Link></li>
              <li><Link href="/help" className="hover:text-primary">자주 묻는 질문</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <p>&copy; 2026 메디포닥. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/help" className="hover:text-primary">이용약관</Link>
            <Link href="/help" className="hover:text-primary">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
