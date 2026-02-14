"use client";

import { Lock, Search, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TalentsPage() {
  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-bold mb-2">인재 검색</h1>
      <p className="text-muted-foreground mb-8">
        곧 출시됩니다! 직군/경력/면허/지역 기반으로 인재를 검색하고
        <br />
        열람권을 사용하여 연락처를 확인할 수 있습니다.
      </p>

      <div className="grid gap-3 text-left">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Search className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">조건별 검색</p>
              <p className="text-xs text-muted-foreground">
                직군, 경력, 면허, 희망 지역으로 인재 필터링
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="h-5 w-5 text-yellow-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">열람권으로 상세보기</p>
              <p className="text-xs text-muted-foreground">
                크레딧을 사용하여 이력서 상세 및 연락처 열람
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
