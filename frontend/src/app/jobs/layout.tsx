import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채용공고 검색",
  description:
    "간호사, 치위생사, 물리치료사 등 의료 직군 채용공고를 검색하세요.",
  alternates: { canonical: "/jobs" },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
