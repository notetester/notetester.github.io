import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL("https://notetester.github.io"),
  title: {
    default: "개발 학습 아카이브 | NOTE TESTER",
    template: "%s | NOTE TESTER",
  },
  description:
    "Java·Spring·React·Python·AI를 개념, 코드, 실행 결과로 다시 꺼내 보는 공개 개발 학습자료입니다.",
  keywords: [
    "개발 학습",
    "Java",
    "Spring",
    "React",
    "Python",
    "Machine Learning",
    "RAG",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://notetester.github.io/",
    siteName: "NOTE TESTER 개발 학습 아카이브",
    title: "개발 학습 아카이브",
    description: "배웠던 개발 지식을 개념, 코드, 실행 결과로 다시 연결합니다.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "코드와 지식 연결망이 펼쳐진 NOTE TESTER 학습 아카이브",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "개발 학습 아카이브",
    description: "배웠던 개발 지식을 개념, 코드, 실행 결과로 다시 연결합니다.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">
          본문으로 바로가기
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
