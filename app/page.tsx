import type { Metadata } from "next"
import Image from "next/image"
import { LandingPage } from "@/components/landing-page"

export const metadata: Metadata = {
  title: "주소록 관리 시스템",
  description: "효율적인 연락처 관리와 메시지 전송을 위한 통합 솔루션",
  keywords: ["주소록", "연락처 관리", "메시지 전송", "중복 확인"],
  openGraph: {
    title: "주소록 관리 시스템",
    description: "효율적인 연락처 관리와 메시지 전송을 위한 통합 솔루션",
    type: "website",
  },
}

export default function Home() {
  return <LandingPage />
}

