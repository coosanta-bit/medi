"use client";

import { Lock, Send, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ScoutsPage() {
  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-bold mb-2">스카우트</h1>
      <p className="text-muted-foreground mb-8">
        곧 출시됩니다! 원하는 인재에게 직접 포지션 제안을 보내고
        <br />
        수락/거절 응답을 관리할 수 있습니다.
      </p>

      <div className="grid gap-3 text-left">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Send className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">포지션 제안 발송</p>
              <p className="text-xs text-muted-foreground">
                검색한 인재에게 공고와 함께 스카우트 메시지 발송
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">응답 관리</p>
              <p className="text-xs text-muted-foreground">
                수락/거절/대기 중 상태별 스카우트 이력 관리
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
