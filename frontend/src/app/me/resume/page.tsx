"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import {
  getLabel,
  JOB_CATEGORIES,
  REGIONS,
  SHIFT_TYPES,
  SALARY_TYPES,
  RESUME_VISIBILITY,
} from "@/lib/constants";
import type {
  ResumeListResponse,
  ResumeSummary,
  ResumeDetail,
  ResumeLicenseInput,
  ResumeCareerInput,
} from "@/types/resume";

export default function ResumePage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResumeDetail | null>(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const data = await api.get<ResumeListResponse>("/me/resumes");
      setResumes(data.items);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleEdit = async (id: string) => {
    try {
      const detail = await api.get<ResumeDetail>(`/me/resumes/${id}`);
      setEditing(detail);
      setShowForm(true);
    } catch {
      alert("이력서를 불러올 수 없습니다");
    }
  };

  const handleNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchResumes();
  };

  const handleVisibilityToggle = async (resume: ResumeSummary) => {
    const next = resume.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    try {
      await api.post(`/me/resumes/${resume.id}/visibility`, {
        visibility: next,
      });
      fetchResumes();
    } catch {
      alert("변경에 실패했습니다");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">이력서 관리</h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />새 이력서
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-[80px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : resumes.length > 0 ? (
        <div className="space-y-3">
          {resumes.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{r.title}</p>
                    <Badge
                      variant={
                        r.visibility === "PUBLIC" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {getLabel(RESUME_VISIBILITY, r.visibility)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.desired_job
                      ? getLabel(JOB_CATEGORIES, r.desired_job)
                      : "직군 미설정"}
                    {" · "}
                    {r.is_experienced ? "경력" : "신입"}
                    {" · "}
                    {new Date(r.updated_at).toLocaleDateString("ko-KR")} 수정
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVisibilityToggle(r)}
                    title={
                      r.visibility === "PUBLIC"
                        ? "비공개로 전환"
                        : "공개로 전환"
                    }
                  >
                    {r.visibility === "PUBLIC" ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(r.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg mb-2">
            등록된 이력서가 없습니다
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            이력서를 등록하면 공고에 지원할 수 있습니다
          </p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            이력서 등록
          </Button>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "이력서 수정" : "새 이력서 등록"}
            </DialogTitle>
          </DialogHeader>
          <ResumeForm initial={editing} onSaved={handleSaved} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Resume Form ---

function ResumeForm({
  initial,
  onSaved,
}: {
  initial: ResumeDetail | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [visibility, setVisibility] = useState(initial?.visibility || "PRIVATE");
  const [desiredJob, setDesiredJob] = useState(initial?.desired_job || "");
  const [desiredRegion, setDesiredRegion] = useState(initial?.desired_region || "");
  const [desiredShift, setDesiredShift] = useState(initial?.desired_shift || "");
  const [desiredSalaryType, setDesiredSalaryType] = useState(initial?.desired_salary_type || "");
  const [desiredSalaryMin, setDesiredSalaryMin] = useState(
    initial?.desired_salary_min?.toString() || ""
  );
  const [summary, setSummary] = useState(initial?.summary || "");
  const [isExperienced, setIsExperienced] = useState(initial?.is_experienced || false);

  const [licenses, setLicenses] = useState<ResumeLicenseInput[]>(
    initial?.licenses.map((l) => ({
      license_type: l.license_type,
      issued_at: l.issued_at || undefined,
    })) || []
  );

  const [careers, setCareers] = useState<ResumeCareerInput[]>(
    initial?.careers.map((c) => ({
      org_name: c.org_name,
      role: c.role || undefined,
      department: c.department || undefined,
      start_at: c.start_at,
      end_at: c.end_at || undefined,
      description: c.description || undefined,
    })) || []
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("이력서 제목을 입력해주세요");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      title,
      visibility,
      desired_job: desiredJob || null,
      desired_region: desiredRegion || null,
      desired_shift: desiredShift || null,
      desired_salary_type: desiredSalaryType || null,
      desired_salary_min: desiredSalaryMin ? Number(desiredSalaryMin) : null,
      summary: summary || null,
      is_experienced: isExperienced,
      licenses: licenses.filter((l) => l.license_type),
      careers: careers.filter((c) => c.org_name && c.start_at),
    };

    try {
      if (initial) {
        await api.patch(`/me/resumes/${initial.id}`, payload);
      } else {
        await api.post("/me/resumes", payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const addLicense = () =>
    setLicenses([...licenses, { license_type: "" }]);
  const removeLicense = (i: number) =>
    setLicenses(licenses.filter((_, idx) => idx !== i));
  const updateLicense = (i: number, field: string, value: string) =>
    setLicenses(
      licenses.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );

  const addCareer = () =>
    setCareers([...careers, { org_name: "", start_at: "" }]);
  const removeCareer = (i: number) =>
    setCareers(careers.filter((_, idx) => idx !== i));
  const updateCareer = (i: number, field: string, value: string) =>
    setCareers(
      careers.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="r-title">제목 *</Label>
          <Input
            id="r-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 간호사 3년차 이력서"
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>공개 설정</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESUME_VISIBILITY.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>경력 여부</Label>
            <Select
              value={isExperienced ? "EXP" : "NEW"}
              onValueChange={(v) => setIsExperienced(v === "EXP")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">신입</SelectItem>
                <SelectItem value="EXP">경력</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Desired conditions */}
      <div className="space-y-3">
        <p className="font-medium text-sm">희망 조건</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>희망 직군</Label>
            <Select
              value={desiredJob || "NONE"}
              onValueChange={(v) => setDesiredJob(v === "NONE" ? "" : v)}
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
            <Label>희망 지역</Label>
            <Select
              value={desiredRegion || "NONE"}
              onValueChange={(v) => setDesiredRegion(v === "NONE" ? "" : v)}
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
            <Label>희망 근무형태</Label>
            <Select
              value={desiredShift || "NONE"}
              onValueChange={(v) => setDesiredShift(v === "NONE" ? "" : v)}
            >
              <SelectTrigger className="mt-1">
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
          <div>
            <Label>희망 급여 유형</Label>
            <Select
              value={desiredSalaryType || "NONE"}
              onValueChange={(v) => setDesiredSalaryType(v === "NONE" ? "" : v)}
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
        </div>
        <div>
          <Label htmlFor="r-salary-min">희망 최소 급여 (원)</Label>
          <Input
            id="r-salary-min"
            type="number"
            value={desiredSalaryMin}
            onChange={(e) => setDesiredSalaryMin(e.target.value)}
            placeholder="예: 35000000"
            className="mt-1 w-1/2"
          />
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <div>
        <Label>자기소개</Label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="간단한 자기소개를 작성해주세요"
          className="mt-1"
        />
      </div>

      <Separator />

      {/* Licenses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">면허/자격증</p>
          <Button type="button" variant="outline" size="sm" onClick={addLicense}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            추가
          </Button>
        </div>
        {licenses.map((lic, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">면허 종류</Label>
              <Input
                value={lic.license_type}
                onChange={(e) => updateLicense(i, "license_type", e.target.value)}
                placeholder="예: 간호사면허"
                className="mt-1"
              />
            </div>
            <div className="w-[140px]">
              <Label className="text-xs">취득일</Label>
              <Input
                type="date"
                value={lic.issued_at || ""}
                onChange={(e) => updateLicense(i, "issued_at", e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeLicense(i)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      {/* Careers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">경력</p>
          <Button type="button" variant="outline" size="sm" onClick={addCareer}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            추가
          </Button>
        </div>
        {careers.map((car, i) => (
          <Card key={i}>
            <CardContent className="p-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">기관명 *</Label>
                  <Input
                    value={car.org_name}
                    onChange={(e) => updateCareer(i, "org_name", e.target.value)}
                    placeholder="예: 서울대학교병원"
                    className="mt-1"
                  />
                </div>
                <div className="w-[120px]">
                  <Label className="text-xs">직무</Label>
                  <Input
                    value={car.role || ""}
                    onChange={(e) => updateCareer(i, "role", e.target.value)}
                    placeholder="간호사"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-end"
                  onClick={() => removeCareer(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">부서</Label>
                  <Input
                    value={car.department || ""}
                    onChange={(e) => updateCareer(i, "department", e.target.value)}
                    placeholder="정형외과"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">시작일 *</Label>
                  <Input
                    type="date"
                    value={car.start_at}
                    onChange={(e) => updateCareer(i, "start_at", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">종료일</Label>
                  <Input
                    type="date"
                    value={car.end_at || ""}
                    onChange={(e) => updateCareer(i, "end_at", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "저장 중..." : initial ? "수정 완료" : "이력서 등록"}
        </Button>
      </div>
    </form>
  );
}
