"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { VerificationRead } from "@/types/verification";

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline"; label: string; color: string }
> = {
  PENDING: {
    icon: <Clock className="h-5 w-5" />,
    variant: "secondary",
    label: "심사중",
    color: "text-yellow-600",
  },
  APPROVED: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    variant: "default",
    label: "승인 완료",
    color: "text-green-600",
  },
  REJECTED: {
    icon: <XCircle className="h-5 w-5" />,
    variant: "destructive",
    label: "반려",
    color: "text-red-600",
  },
};

export default function BizVerifyPage() {
  const [verification, setVerification] = useState<VerificationRead | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileKey, setFileKey] = useState("");
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      const data = await api.get<VerificationRead | null>("/biz/verify");
      setVerification(data);
    } catch {
      // No verification yet
      setVerification(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async () => {
    if (!fileKey.trim()) {
      setError("사업자등록증 파일을 입력해주세요");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await api.post<VerificationRead>("/biz/verify", {
        file_key: fileKey.trim(),
      });
      setVerification(result);
      setFileKey("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "인증 요청에 실패했습니다"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">기업 인증</h1>
        <div className="h-[200px] rounded-lg border bg-muted/30 animate-pulse" />
      </div>
    );
  }

  const canSubmit =
    !verification ||
    verification.status === "REJECTED";

  const statusConfig = verification
    ? STATUS_CONFIG[verification.status]
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">기업 인증</h1>

      {/* Current status */}
      {verification && statusConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              인증 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <span className={statusConfig.color}>{statusConfig.icon}</span>
              <Badge variant={statusConfig.variant} className="text-sm">
                {statusConfig.label}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">신청일</span>
                <span>
                  {new Date(verification.created_at).toLocaleDateString(
                    "ko-KR"
                  )}
                </span>
              </div>
              {verification.file_key && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">제출 파일</span>
                  <span className="truncate max-w-[200px]">
                    {verification.file_key}
                  </span>
                </div>
              )}
              {verification.status === "REJECTED" &&
                verification.reject_reason && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium text-destructive mb-1">
                      반려 사유
                    </p>
                    <p className="text-sm">{verification.reject_reason}</p>
                  </div>
                )}
            </div>

            {verification.status === "PENDING" && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  인증 심사가 진행 중입니다. 영업일 기준 1~2일 내에 결과를
                  안내드립니다.
                </p>
              </div>
            )}

            {verification.status === "APPROVED" && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  인증이 완료되었습니다. 공고 게시, 인재 검색 등 모든 기업
                  기능을 이용하실 수 있습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit form */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {verification?.status === "REJECTED"
                ? "재신청"
                : "인증 신청"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  사업자등록증을 제출하여 기업 인증을 진행해 주세요. 인증이
                  완료되면 공고 게시, 인재 검색, 스카우트 발송 등 기업 기능을
                  이용할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileKey">사업자등록증 파일 키</Label>
                <Input
                  id="fileKey"
                  value={fileKey}
                  onChange={(e) => setFileKey(e.target.value)}
                  placeholder="업로드된 파일 키를 입력하세요"
                />
                <p className="text-xs text-muted-foreground">
                  * MVP에서는 파일 키를 직접 입력합니다. 추후 파일 업로드
                  기능으로 대체됩니다.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting || !fileKey.trim()}
              >
                {submitting ? "제출 중..." : "인증 신청"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No verification yet */}
      {!verification && !canSubmit && (
        <div className="text-center py-16">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">
            기업 인증 정보가 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
