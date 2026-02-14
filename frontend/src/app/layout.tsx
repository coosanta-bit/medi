import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://medifordoc.com"
  ),
  title: {
    default: "메디포닥 - 병원/의료기관 전용 구인구직",
    template: "%s | 메디포닥",
  },
  description:
    "의료기관 전용 채용 플랫폼. 간호사, 치위생사, 물리치료사 등 의료 직군 채용/구직.",
  openGraph: {
    title: "메디포닥",
    description: "병원/의료기관 전용 구인구직 플랫폼",
    type: "website",
    siteName: "메디포닥",
    locale: "ko_KR",
    url: "/",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "메디포닥" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "메디포닥 - 병원/의료기관 전용 구인구직",
    description: "의료기관 전용 채용 플랫폼",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
