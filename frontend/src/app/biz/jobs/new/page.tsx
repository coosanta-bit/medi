"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  JOB_CATEGORIES,
  REGIONS,
  SHIFT_TYPES,
  EMPLOYMENT_TYPES,
  SALARY_TYPES,
  ROUTES,
} from "@/lib/constants";
import type { JobPostDetail } from "@/types/job";

interface JobFormData {
  title: string;
  body: string;
  job_category: string;
  department: string;
  specialty: string;
  employment_type: string;
  shift_type: string;
  salary_type: string;
  salary_min: string;
  salary_max: string;
  location_code: string;
  location_detail: string;
  contact_name: string;
  contact_visible: boolean;
  close_at: string;
}

const initialForm: JobFormData = {
  title: "",
  body: "",
  job_category: "",
  department: "",
  specialty: "",
  employment_type: "",
  shift_type: "",
  salary_type: "",
  salary_min: "",
  salary_max: "",
  location_code: "",
  location_detail: "",
  contact_name: "",
  contact_visible: false,
  close_at: "",
};

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState<JobFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key: keyof JobFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("공고 제목을 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        body: form.body || null,
        job_category: form.job_category || null,
        department: form.department || null,
        specialty: form.specialty || null,
        employment_type: form.employment_type || null,
        shift_type: form.shift_type || null,
        salary_type: form.salary_type || null,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        location_code: form.location_code || null,
        location_detail: form.location_detail || null,
        contact_name: form.contact_name || null,
        contact_visible: form.contact_visible,
        close_at: form.close_at || null,
      };

      await api.post<JobPostDetail>("/biz/jobs", payload);
      router.push(ROUTES.BIZ_JOBS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "공고 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">새 공고 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">공고 제목 *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="예: 서울 강남 정형외과 간호사 모집"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>직군</Label>
                <Select
                  value={form.job_category || "NONE"}
                  onValueChange={(v) =>
                    updateField("job_category", v === "NONE" ? "" : v)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">선택 안함</SelectItem>
                    {JOB_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>고용형태</Label>
                <Select
                  value={form.employment_type || "NONE"}
                  onValueChange={(v) =>
                    updateField("employment_type", v === "NONE" ? "" : v)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">선택 안함</SelectItem>
                    {EMPLOYMENT_TYPES.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">진료과</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder="예: 정형외과"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="specialty">전문 분야</Label>
                <Input
                  id="specialty"
                  value={form.specialty}
                  onChange={(e) => updateField("specialty", e.target.value)}
                  placeholder="예: 수술실"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">근무 조건</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>근무형태</Label>
              <Select
                value={form.shift_type || "NONE"}
                onValueChange={(v) =>
                  updateField("shift_type", v === "NONE" ? "" : v)
                }
              >
                <SelectTrigger className="mt-1 w-full sm:w-1/2">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">선택 안함</SelectItem>
                  {SHIFT_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>급여 유형</Label>
                <Select
                  value={form.salary_type || "NONE"}
                  onValueChange={(v) =>
                    updateField("salary_type", v === "NONE" ? "" : v)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">선택 안함</SelectItem>
                    {SALARY_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary_min">최소 급여 (원)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => updateField("salary_min", e.target.value)}
                  placeholder="예: 35000000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="salary_max">최대 급여 (원)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => updateField("salary_max", e.target.value)}
                  placeholder="예: 45000000"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">근무지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>지역</Label>
                <Select
                  value={form.location_code || "NONE"}
                  onValueChange={(v) =>
                    updateField("location_code", v === "NONE" ? "" : v)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">선택 안함</SelectItem>
                    {REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location_detail">상세 주소</Label>
                <Input
                  id="location_detail"
                  value={form.location_detail}
                  onChange={(e) =>
                    updateField("location_detail", e.target.value)
                  }
                  placeholder="예: 서울시 강남구 역삼동"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상세 내용</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.body}
              onChange={(e) => updateField("body", e.target.value)}
              placeholder="근무 환경, 복리후생, 지원 자격 등을 상세히 작성해주세요"
              rows={10}
            />
          </CardContent>
        </Card>

        {/* Contact & closing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기타</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_name">담당자명</Label>
                <Input
                  id="contact_name"
                  value={form.contact_name}
                  onChange={(e) => updateField("contact_name", e.target.value)}
                  placeholder="채용 담당자 이름"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="close_at">마감일</Label>
                <Input
                  id="close_at"
                  type="date"
                  value={form.close_at}
                  onChange={(e) => updateField("close_at", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.contact_visible}
                onChange={(e) =>
                  updateField("contact_visible", e.target.checked)
                }
                className="rounded border-input"
              />
              담당자 정보를 공고에 공개
            </label>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.BIZ_JOBS)}
          >
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "공고 등록 (초안 저장)"}
          </Button>
        </div>
      </form>
    </div>
  );
}
