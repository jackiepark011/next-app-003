"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Contact } from "@/lib/types"

interface EditConversationDialogProps {
  contact: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedContact: Contact) => void
}

export function EditConversationDialog({ contact, open, onOpenChange, onSave }: EditConversationDialogProps) {
  const [useExisting, setUseExisting] = useState<string>("existing")
  const [newConversation, setNewConversation] = useState("")
  const [showJsonModal, setShowJsonModal] = useState(false)
  const [jsonData, setJsonData] = useState("")
  const [filteredList, setFilteredList] = useState<Contact[]>([])

  // 모달이 열릴 때마다 초기 상태 설정
  useEffect(() => {
    if (open) {
      // 기존 카톡대화명이 있으면 'existing', 없으면 'new' 선택
      setUseExisting(contact.Dialogue_Name ? "existing" : "new")
      // 변경된 대화명이 있으면 해당 값으로, 없으면 빈 문자열로 초기화
      setNewConversation(contact.Change_Name || "")
    }
  }, [open, contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const updatedContact = { ...contact }

    if (useExisting === "existing") {
      updatedContact.Conversation = contact.Dialogue_Name
      updatedContact.Change_Name = ""
      updatedContact.Checklist = "일치"
      updatedContact.Whether_Or = "5"
      onSave(updatedContact)
      onOpenChange(false)
    } else {
      // 새로운 대화명 사용 시
      try {
        // 종업여부를 5으로 변경
        updatedContact.Conversation = newConversation
        updatedContact.Change_Name = newConversation
        updatedContact.Whether_Or = "3"

        // JSON 데이터 준비
        const jsonData = {
          contact: updatedContact
        }
        const jsonString = JSON.stringify(jsonData, null, 2)
        setJsonData(jsonString)

        // 필터링된 리스트를 상태에 저장하고 모달 표시
        setFilteredList([updatedContact])
        setShowJsonModal(true)
      } catch (error: any) {
        console.error('Error:', error)
        window.alert(`처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
      }
    }
  }

  const handleConfirmJson = async () => {
    try {
      // 3단계: make_list.json 파일 저장
      const response = await fetch('/api/save-kakao-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kakaoList: filteredList
        }),
      })

      const result = await response.json()

      if (result.success) {
        onSave(filteredList[0])
        setShowJsonModal(false)
        onOpenChange(false)
        window.alert(result.message)
      } else {
        window.alert(result.message)
      }
    } catch (error: any) {
      console.error('Error saving kakao list:', error)
      window.alert(`저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>대화명 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              <RadioGroup value={useExisting} onValueChange={setUseExisting} className="space-y-4">
                {/* 기존 카톡대화명 사용 옵션 */}
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="existing" id="existing" className="mt-1" />
                  <div className="grid gap-1.5 w-full">
                    <Label htmlFor="existing" className="font-medium">
                      기존 카톡대화명 사용
                    </Label>
                    <Input value={contact.Dialogue_Name || ""} readOnly className="bg-muted" />
                  </div>
                </div>

                {/* 새로운 대화명 사용 옵션 */}
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="new" id="new" className="mt-1" />
                  <div className="grid gap-1.5 w-full">
                    <Label htmlFor="new" className="font-medium">
                      새로운 대화명 사용
                    </Label>
                    <Input
                      value={newConversation}
                      onChange={(e) => setNewConversation(e.target.value)}
                      placeholder="새 대화명을 입력하세요"
                      disabled={useExisting === "existing"}
                    />
                  </div>
                </div>
              </RadioGroup>

              {/* 현재 대화창명 표시 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current" className="text-right">
                  현재 대화창명
                </Label>
                <Input id="current" value={contact.Conversation} readOnly className="col-span-3 bg-muted" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* JSON 데이터 확인 모달 */}
      <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>새로운 대화명 사용 진행</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              새로운 대화명을 사용하면 종업여부가 3으로 변경됩니다.
            </div>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <pre className="text-sm">{jsonData}</pre>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJsonModal(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmJson}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
