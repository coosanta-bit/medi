"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  UserCheck,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from "@/lib/api";
import {
  ROUTES,
  JOB_CATEGORIES,
  REGIONS,
  EMPLOYMENT_TYPES,
  getLabel,
  formatSalary,
} from "@/lib/constants";
import type { JobListResponse, JobPostSummary } from "@/types/job";

const CHIPS = ["병동", "응급", "외래", "주간/교대", "협의형"];

const FEATURES = [
  {
    title: "병원 중심 공개 채용",
    desc: "병동별, 직무별, 근무 형태별로 공고를 정렬해 의료진에게 적합한 채용만 한 번에 노출합니다.",
    icon: Building2,
  },
  {
    title: "원클릭 지원 준비",
    desc: "기본 지원서 양식과 스크리닝 항목을 단일 화면에서 관리해 지원 흐름을 간단하게 유지할 수 있습니다.",
    icon: ClipboardList,
  },
  {
    title: "지원자·공고 분리 관리",
    desc: "구직자는 관심 공고를 관리하고, 병원은 지원자 상태를 단계별로 추적할 수 있는 인터페이스를 제공합니다.",
    icon: UserCheck,
  },
];

const STEPS = [
  "회원가입 후 역할(구직자/병원)을 선택합니다.",
  "원하는 조건으로 채용 공고를 검색하고 저장합니다.",
  "지원 상태와 면접일정을 한 곳에서 확인합니다.",
  "병원과의 일정 협의, 채용 완료까지 진행 상태를 추적합니다.",
];

const FAQS = [
  {
    q: "채용 공고는 실제 채용 정보인가요?",
    a: "네. 병원/의료기관에서 직접 등록한 실제 채용 공고입니다. 사업자 인증을 거친 기관만 공고를 등록할 수 있습니다.",
  },
  {
    q: "병원 담당자용 페이지는 어떤 점이 다른가요?",
    a: "병원 역할 로그인 시 공고 등록, 지원자 목록, 인재 검색, 스카우트 등 채용 전용 대시보드를 제공합니다.",
  },
  {
    q: "이력서를 공개하면 어떤 정보가 노출되나요?",
    a: "공개 설정 시 희망 직군, 지역, 경력 여부, 자격증 종류, 경력 수 등 익명화된 요약 정보만 노출됩니다. 개인 연락처는 노출되지 않습니다.",
  },
  {
    q: "스카우트 기능은 어떻게 작동하나요?",
    a: "기업 회원이 인재 검색 후 관심 있는 구직자에게 포지션 제안 메시지를 보낼 수 있습니다. 수락/보류/거절로 응답할 수 있습니다.",
  },
];

type TabKey = "all" | "latest" | "popular";

export default function HomePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [jobType, setJobType] = useState("");

  const [jobs, setJobs] = useState<JobPostSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("size", "6");
    if (activeTab === "latest") params.set("sort", "LATEST");
    if (activeTab === "popular") params.set("sort", "VIEWS");
    api
      .get<JobListResponse>(`/jobs?${params}`)
      .then((res) => setJobs(res.items))
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (region) params.set("location_code", region);
    if (jobType) params.set("job_category", jobType);
    router.push(`${ROUTES.JOBS}?${params.toString()}`);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "latest", label: "신규" },
    { key: "popular", label: "인기" },
  ];

  return (
    <div className="relative">
      {/* Aurora background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(120deg, rgba(24,128,255,0.06), transparent 55%), linear-gradient(220deg, rgba(27,203,211,0.04), transparent 45%)",
        }}
      />

      {/* Hero */}
      <section className="relative py-8 md:py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start rounded-3xl border border-border bg-gradient-to-br from-white to-amber-50/40 shadow-lg p-6 md:p-10">
            {/* Hero copy */}
            <div>
              <span className="inline-flex items-center rounded-full bg-accent/15 border border-accent/30 px-3 py-1 text-xs font-bold text-accent-foreground">
                병원·의료진 매칭 전문 플랫폼
              </span>
              <h1 className="mt-4 text-2xl md:text-4xl font-extrabold leading-tight tracking-tight">
                메디포닥에서 병원 채용 공고와
                <br />
                의료진 구직을 한 번에 확인하세요.
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                지역·직무·근무형태를 한 번에 검색하고, 원하는 조건에 맞는
                공고를 빠르게 비교할 수 있습니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border bg-white/70 px-3.5 py-1 text-sm text-foreground/80"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Search card */}
            <form
              onSubmit={handleSearch}
              className="rounded-2xl border border-border bg-gradient-to-b from-amber-50/60 to-orange-50/40 p-5 space-y-3"
            >
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  키워드
                </label>
                <Input
                  placeholder="직무명 또는 병원명 입력"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="bg-white/90"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  지역
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border border-input bg-white/90 px-3 py-2.5 text-sm"
                >
                  <option value="">전체</option>
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  직군
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full rounded-lg border border-input bg-white/90 px-3 py-2.5 text-sm"
                >
                  <option value="">전체</option>
                  {JOB_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-full text-sm font-bold"
              >
                <Search className="h-4 w-4 mr-2" />
                채용 공고 검색
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { label: "누적 등록 공고", value: "1,840+" },
              { label: "실시간 지원 건수", value: "420+" },
              { label: "신규 채용 매칭", value: "24건/일" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-gradient-to-b from-amber-50/60 to-orange-50/30 p-4"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-xl md:text-2xl font-extrabold">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="relative mt-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl md:text-2xl font-bold">최신 채용 공고</h2>
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold border transition-colors ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-primary to-accent text-white border-transparent"
                      : "border-border bg-white/70 text-foreground hover:bg-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {jobsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[130px] rounded-xl border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={ROUTES.JOB_DETAIL(job.id)}
                  className="block"
                >
                  <div className="rounded-xl border border-border bg-gradient-to-b from-amber-50/60 to-orange-50/30 p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold truncate">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.company_name} · {getLabel(REGIONS, job.location_code)}
                      {job.employment_type &&
                        ` · ${getLabel(EMPLOYMENT_TYPES, job.employment_type)}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      급여:{" "}
                      {formatSalary(
                        job.salary_type,
                        job.salary_min,
                        job.salary_max
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.job_category && (
                        <span className="rounded-full border border-border bg-white/60 text-xs px-2.5 py-0.5">
                          {getLabel(JOB_CATEGORIES, job.job_category)}
                        </span>
                      )}
                      {job.shift_type && (
                        <span className="rounded-full border border-border bg-white/60 text-xs px-2.5 py-0.5">
                          {job.shift_type}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              등록된 공고가 없습니다
            </p>
          )}

          <div className="text-center mt-6">
            <Button variant="outline" asChild className="rounded-full">
              <Link href={ROUTES.JOBS}>
                전체 공고 보기
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="rounded-xl border border-border bg-gradient-to-b from-amber-50/60 to-orange-50/30 p-5"
              >
                <feat.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold">{feat.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Guide: 4 Steps */}
      <section className="relative mt-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            이용 가이드: 4단계
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-gradient-to-b from-amber-50/60 to-orange-50/30 p-4"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border bg-white/70 text-sm font-bold mb-2">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="relative mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-b from-amber-50/60 to-orange-50/30 p-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                병원 전용 또는 구직 전용 기능이 필요하신가요?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                메디포닥에서 병원 채용과 구직 업무를 통합해 효율적으로
                관리하세요.
              </p>
            </div>
            <Button asChild className="shrink-0 rounded-full px-6">
              <Link href={ROUTES.SIGNUP}>지금 시작하기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative mt-12 pb-12">
        <div className="container mx-auto px-4">
          <div className="rounded-xl border border-border bg-gradient-to-b from-amber-50/60 to-orange-50/30 p-5 md:p-6">
            <h2 className="text-xl font-bold mb-3">자주 묻는 질문</h2>
            <Accordion type="single" collapsible>
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm font-medium text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
