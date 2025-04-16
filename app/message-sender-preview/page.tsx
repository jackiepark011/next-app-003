import { MessageSenderPreview } from "@/components/message-sender-preview"

export default function MessageSenderPreviewPage() {
  return (
    <main className="container mx-auto p-4 max-w-full h-[calc(100vh-2rem)]">
      <h1 className="text-2xl font-bold mb-6">메시지 발송</h1>
      <MessageSenderPreview />
    </main>
  )
}

