"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/constants";
import type { ResumeListResponse, ResumeSummary } from "@/types/resume";

export function ApplyButton({ jobId, isOpen }: { jobId: string; isOpen: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleApplyClick = async () => {
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    setShowDialog(true);
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const data = await api.get<ResumeListResponse>("/me/resumes");
      setResumes(data.items);
    } catch {
      setError("이력서 목록을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (resumeId: string) => {
    setSubmitting(true);
    setError("");

    try {
      await api.post(`/jobs/${jobId}/apply`, { resume_id: resumeId });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        className="w-full"
        size="lg"
        disabled={!isOpen}
        onClick={handleApplyClick}
      >
        {isOpen ? "지원하기" : "마감된 공고"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {success ? "지원 완료" : "이력서 선택"}
            </DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="text-center py-4">
              <p className="text-lg font-medium mb-2">지원이 완료되었습니다</p>
              <p className="text-sm text-muted-foreground mb-4">
                지원 현황은 마이페이지에서 확인할 수 있습니다
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  닫기
                </Button>
                <Button onClick={() => router.push(ROUTES.ME_APPLICATIONS)}>
                  지원 현황 보기
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-muted-foreground">
              이력서 불러오는 중...
            </div>
          ) : resumes.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                지원에 사용할 이력서를 선택해주세요
              </p>
              {resumes.map((r) => (
                <Button
                  key={r.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  disabled={submitting}
                  onClick={() => handleSubmit(r.id)}
                >
                  <div className="text-left">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(r.updated_at).toLocaleDateString("ko-KR")} 수정
                    </p>
                  </div>
                </Button>
              ))}
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                등록된 이력서가 없습니다
              </p>
              <Button onClick={() => router.push(ROUTES.ME_RESUME)}>
                이력서 등록하기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
