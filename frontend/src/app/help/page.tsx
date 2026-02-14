import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Mail } from "lucide-react";

export const metadata = {
  title: "고객센터",
};

const faqs = [
  {
    q: "회원가입은 어떻게 하나요?",
    a: '우측 상단의 "회원가입" 버튼을 눌러 개인(구직자) 또는 기업 회원으로 가입할 수 있습니다. 이메일, 비밀번호, 약관 동의만 있으면 됩니다.',
  },
  {
    q: "기업 인증은 어떻게 진행되나요?",
    a: '기업 회원 가입 후 "기업 관리 > 기업 인증" 메뉴에서 사업자등록증을 제출하면 운영팀이 검토 후 승인합니다. 승인 후 공고 게시 등 모든 기능을 이용할 수 있습니다.',
  },
  {
    q: "공고는 어떻게 등록하나요?",
    a: '기업 인증이 완료된 계정으로 로그인 후 "기업 관리 > 공고 관리 > 새 공고 작성"에서 공고를 작성합니다. 저장 후 "게시" 버튼을 눌러야 구직자에게 노출됩니다.',
  },
  {
    q: "지원은 어떻게 하나요?",
    a: '관심 있는 공고 상세 페이지에서 "지원하기" 버튼을 누르면 됩니다. 이력서를 미리 등록해두면 기업에서 더 빠르게 확인할 수 있습니다.',
  },
  {
    q: "상단노출(BOOST) 상품은 무엇인가요?",
    a: "상단노출 상품을 구매하면 해당 기간 동안 공고가 목록 상단에 우선 노출됩니다. 7일권, 14일권을 제공합니다.",
  },
  {
    q: "열람권(크레딧)은 무엇인가요?",
    a: "열람권을 사용하면 구직자의 상세 이력서와 연락처를 확인할 수 있습니다. 10회/30회/100회 패키지로 구매 가능합니다.",
  },
  {
    q: "결제는 어떻게 하나요?",
    a: '"기업 관리 > 결제/상품" 메뉴에서 원하는 상품을 선택하고 주문하면 됩니다. 현재 MVP 버전에서는 웹훅 기반으로 결제가 확정됩니다.',
  },
  {
    q: "부적절한 공고나 사용자를 신고하고 싶어요.",
    a: "각 공고 상세 페이지에서 신고 기능을 이용하거나, 아래 이메일로 직접 문의해주세요. 운영팀이 확인 후 조치합니다.",
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">고객센터</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            자주 묻는 질문 (FAQ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            직접 문의
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            FAQ에서 답을 찾지 못하셨나요? 아래 이메일로 문의해 주세요.
          </p>
          <p className="text-sm font-medium">support@medifordoc.com</p>
          <p className="text-xs text-muted-foreground mt-1">
            영업일 기준 1~2일 이내 답변드립니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
