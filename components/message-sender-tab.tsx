"use client"

import React, { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import type { Contact } from '@/lib/types'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditContactDialog } from "@/components/edit-contact-dialog"
import { Edit } from "lucide-react"

interface MessageSenderTabProps {
  contacts: Contact[]
  onSendSelectedContacts?: (contacts: Contact[]) => void
  setContacts: (contacts: Contact[]) => void
}

export function MessageSenderTab({ contacts, onSendSelectedContacts, setContacts }: MessageSenderTabProps) {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [message, setMessage] = useState("")
  const { toast } = useToast()
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // 선택된 연락처를 받아 처리
  useEffect(() => {
    if (onSendSelectedContacts) {
      onSendSelectedContacts(selectedContacts)
    }
  }, [selectedContacts, onSendSelectedContacts])

  // 연락처 추가
  const handleAddContact = (contact: Contact) => {
    if (!selectedContacts.some(c => c.ID === contact.ID)) {
      setSelectedContacts([...selectedContacts, contact])
      toast({
        title: "연락처 추가됨",
        description: `${contact.Name}이(가) 전송 목록에 추가되었습니다.`,
      })
    }
  }

  // 연락처 제거
  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.ID !== contactId))
  }

  // 여러 연락처 추가
  const handleAddMultipleContacts = (newContacts: Contact[]) => {
    const uniqueContacts = newContacts.filter(
      newContact => !selectedContacts.some(existing => existing.ID === newContact.ID)
    )
    setSelectedContacts([...selectedContacts, ...uniqueContacts])
    toast({
      title: "연락처 추가됨",
      description: `${uniqueContacts.length}개의 연락처가 전송 목록에 추가되었습니다.`,
    })
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
  }

  const handleSaveContact = (updatedContact: Contact) => {
    const updatedContacts = contacts.map(contact =>
      contact.ID === updatedContact.ID ? updatedContact : contact
    )
    setContacts(updatedContacts)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>대화창명</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>전화번호</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>정의1</TableHead>
              <TableHead>정의2</TableHead>
              <TableHead>정의3</TableHead>
              <TableHead>메모</TableHead>
              <TableHead>시작여부</TableHead>
              <TableHead>종업여부</TableHead>
              <TableHead>체크리스트확인</TableHead>
              <TableHead>카톡대화명</TableHead>
              <TableHead>변경대화명</TableHead>
              <TableHead className="w-[100px]">편집</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.ID}>
                <TableCell>{contact.Conversation}</TableCell>
                <TableCell>{contact.Name}</TableCell>
                <TableCell>{contact.Phone_Number}</TableCell>
                <TableCell>{contact.Email}</TableCell>
                <TableCell>{contact.Definition1}</TableCell>
                <TableCell>{contact.Definition2}</TableCell>
                <TableCell>{contact.Definition3}</TableCell>
                <TableCell>{contact.Memo}</TableCell>
                <TableCell>{contact.Start_Or}</TableCell>
                <TableCell>{contact.Whether_Or}</TableCell>
                <TableCell>{contact.Checklist}</TableCell>
                <TableCell>{contact.Dialogue_Name}</TableCell>
                <TableCell>{contact.Change_Name}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditContact(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          onSave={handleSaveContact}
        />
      )}
    </div>
  )
} 