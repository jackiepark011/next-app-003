"use client"

import { useState, useEffect } from "react"
import { MessageSender } from "@/components/message-sender"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { generateSampleData } from "@/lib/sample-data"
import type { Contact } from "@/lib/types"

export default function MessageSenderPage() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>("contacts", [])
  const [isDataInitialized, setIsDataInitialized] = useState(false)

  // Initialize with sample data if empty - only once
  useEffect(() => {
    if (!isDataInitialized && contacts.length === 0) {
      const { sampleContacts } = generateSampleData()
      setContacts(sampleContacts)
      setIsDataInitialized(true)
    }
  }, [contacts.length, setContacts, isDataInitialized])

  return (
    <main className="container mx-auto p-4 max-w-full h-[calc(100vh-2rem)]">
      <h1 className="text-2xl font-bold mb-6">메시지 발송</h1>
      <MessageSender contacts={contacts} />
    </main>
  )
}

