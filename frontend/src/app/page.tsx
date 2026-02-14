"use client";

import Link from "next/link";
import { Search, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES, JOB_CATEGORIES, REGIONS } from "@/lib/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (region) params.set("location_code", region);
    router.push(`${ROUTES.JOBS}?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            의료기관 전용
            <br />
            <span className="text-primary">구인구직 플랫폼</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            간호사, 치위생사, 물리치료사 등 의료 직군에 특화된 채용 플랫폼.
            <br />
            교대, 급여, 진료과 등 핵심 조건으로 빠르게 매칭하세요.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 mx-auto max-w-2xl flex flex-col sm:flex-row gap-2"
          >
            <Input
              placeholder="직종, 병원명으로 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 h-12"
            />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-12 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">전체 지역</option>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button type="submit" size="lg" className="h-12 px-8">
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </form>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">직군별 채용공고</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {JOB_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`${ROUTES.JOBS}?job_category=${cat.value}`}
              >
                <Badge
                  variant="secondary"
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {cat.label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            왜 메디포닥인가요?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">의료 특화 검색</h3>
                <p className="text-sm text-muted-foreground">
                  교대, 진료과, 면허 등 의료 직군에 맞는 상세 필터로 정확한 매칭
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Building2 className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">검증된 의료기관</h3>
                <p className="text-sm text-muted-foreground">
                  사업자 인증을 거친 병원/의원만 공고를 등록할 수 있어 안전합니다
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <UserCheck className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">간편한 지원 관리</h3>
                <p className="text-sm text-muted-foreground">
                  이력서 기반 원클릭 지원, 실시간 진행 상태 확인
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-bold mb-2">구직자이신가요?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  이력서를 등록하고 맞춤 공고를 받아보세요
                </p>
                <Button asChild>
                  <Link href={ROUTES.SIGNUP}>무료 회원가입</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-bold mb-2">채용을 원하시나요?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  공고를 등록하고 적합한 인재를 찾아보세요
                </p>
                <Button variant="outline" asChild>
                  <Link href={ROUTES.SIGNUP}>기업 회원가입</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
