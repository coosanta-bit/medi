"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

type UserType = "PERSON" | "COMPANY";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [userType, setUserType] = useState<UserType>("PERSON");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [businessNo, setBusinessNo] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreeTerms) {
      setError("이용약관에 동의해야 합니다");
      return;
    }
    setLoading(true);
    try {
      await signup({
        type: userType,
        email,
        password,
        phone: phone || undefined,
        name: userType === "PERSON" ? name : undefined,
        business_no: userType === "COMPANY" ? businessNo : undefined,
        company_name: userType === "COMPANY" ? companyName : undefined,
        agree_terms: agreeTerms,
        agree_marketing: agreeMarketing,
      });
      router.push(ROUTES.HOME);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("회원가입에 실패했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center py-8 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          {/* User Type Toggle */}
          <div className="flex rounded-md border mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-l-md transition-colors ${
                userType === "PERSON"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => setUserType("PERSON")}
            >
              개인 (구직자)
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-r-md transition-colors ${
                userType === "COMPANY"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => setUserType("COMPANY")}
            >
              기업 (채용담당자)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="8자 이상, 영문/숫자/특수문자 중 2종 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">휴대폰 번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {userType === "PERSON" && (
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {userType === "COMPANY" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">기업명 *</Label>
                  <Input
                    id="companyName"
                    placeholder="OO병원"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessNo">사업자등록번호 *</Label>
                  <Input
                    id="businessNo"
                    placeholder="000-00-00000"
                    value={businessNo}
                    onChange={(e) => setBusinessNo(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded"
                />
                <span>
                  <span className="text-red-500">[필수]</span> 이용약관에 동의합니다
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="rounded"
                />
                <span>[선택] 마케팅 정보 수신에 동의합니다</span>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
