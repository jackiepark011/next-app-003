import { Metadata } from "next"
import SendingResultsPage from "@/components/sending-results-page"

export const metadata: Metadata = {
  title: "전송 결과 조회",
  description: "SMS 전송 결과를 조회합니다.",
}

export default function SentResultsPage() {
  return <SendingResultsPage />
}
