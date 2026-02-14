"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Stethoscope } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ROUTES } from "@/lib/constants";

const publicNav = [
  { label: "채용공고", href: ROUTES.JOBS },
  { label: "고객센터", href: ROUTES.HELP },
];

export function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const userNav =
    user?.type === "COMPANY"
      ? [{ label: "기업 대시보드", href: ROUTES.BIZ }]
      : user
        ? [{ label: "마이페이지", href: ROUTES.ME }]
        : [];

  const allNav = [...publicNav, ...userNav];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Stethoscope className="h-6 w-6" />
          메디포닥
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {allNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email || user.role}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.LOGIN}>로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={ROUTES.SIGNUP}>회원가입</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[260px]">
            <nav className="flex flex-col gap-4 mt-8">
              {allNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-lg font-medium"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    로그아웃
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link href={ROUTES.LOGIN} onClick={() => setOpen(false)}>
                        로그인
                      </Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href={ROUTES.SIGNUP} onClick={() => setOpen(false)}>
                        회원가입
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
