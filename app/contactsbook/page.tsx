"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddressBookTab } from "@/components/address-book-tab"
import { DuplicateCheckTab } from "@/components/duplicate-check-tab"
import type { Contact, Group } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { generateSampleData } from "@/lib/sample-data"

// MessageSender 컴포넌트 가져오기
import { MessageSender } from "@/components/message-sender"
import { Button } from "@/components/ui/button"

export default function ContactsBook() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>("contacts", [])
  const [groups, setGroups] = useLocalStorage<Group[]>("groups", [])
  const [isDataInitialized, setIsDataInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState("address-book")

  // Initialize with sample data if empty - only once
  useEffect(() => {
    if (!isDataInitialized && (contacts.length === 0 || groups.length === 0)) {
      const { sampleContacts, sampleGroups } = generateSampleData()

      // 연락처가 비어있으면 샘플 데이터로 채웁니다
      if (contacts.length === 0) {
        setContacts(sampleContacts)
      }

      if (groups.length === 0) {
        setGroups(sampleGroups)
      }

      setIsDataInitialized(true)
    }
  }, [contacts.length, groups.length, setContacts, setGroups, isDataInitialized])

  return (
    <main className="container mx-auto p-4 max-w-full h-[calc(100vh-2rem)]">
      <h1 className="text-2xl font-bold mb-6">주소록</h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full h-[calc(100%-4rem)] flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="address-book">주소록</TabsTrigger>
          <TabsTrigger value="message-sender">메시지 전송</TabsTrigger>
          <TabsTrigger value="duplicate-check">중복 확인</TabsTrigger>
        </TabsList>

        <TabsContent value="address-book" className="flex-1 h-full">
          <div className="flex flex-col h-full">
            <AddressBookTab 
              contacts={contacts} 
              setContacts={setContacts} 
              groups={groups} 
              setGroups={setGroups} 
              onTabChange={setActiveTab}
            />
          </div>
        </TabsContent>

        <TabsContent value="message-sender" className="flex-1 h-full">
          <MessageSender contacts={contacts} />
        </TabsContent>

        <TabsContent value="duplicate-check" className="flex-1 h-full">
          <DuplicateCheckTab contacts={contacts} setContacts={setContacts} />
        </TabsContent>
      </Tabs>
    </main>
  )
}

