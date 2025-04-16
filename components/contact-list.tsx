"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { Contact } from "@/lib/types"
// 파일 상단의 import 문에서 필요한 아이콘들을 import
import { Trash2, MessageSquare, UserCheck, MessageCircle, Check, Edit, Send, Phone, Mail, FileText, Search } from "lucide-react"
import { EditContactDialog } from "@/components/edit-contact-dialog"
import { EditConversationDialog } from "@/components/edit-conversation-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ColumnSettingsDialog, type ColumnSetting } from "./column-settings-dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ContactListProps {
  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void
  showStatus: (message: string, type?: "default" | "success" | "error") => void
  showColumnSettings: boolean
  onToggleColumnSettings: () => void
  onSingleContactSend?: (contact: Contact) => void
  onTabChange: (tabId: string, phoneNumber?: string) => void
  handleSendToDuplicateCheck: (phoneNumber?: string) => void
  handleSendAll?: () => void
  handleSendOne?: (contactId: string) => void
  onMemoClick?: (contact: Contact) => void
  groups: string[]
}

// defaultColumns 배열에서 세 개의 중복 컬럼을 제거하고 하나의 중복확인 컬럼으로 대체
const defaultColumns: ColumnSetting[] = [
  { id: "ID", name: "ID", width: 60, visible: true },
  { id: "Group", name: "그룹", width: 100, visible: true },
  { id: "Check", name: "체크", width: 60, visible: true },
  { id: "Conversation", name: "대화창명", width: 150, visible: true },
  { id: "Name", name: "이름", width: 120, visible: true },
  { id: "Phone_Number", name: "전화번호", width: 120, visible: true },
  { id: "Email", name: "이메일", width: 150, visible: true },
  { id: "Definition1", name: "정의1", width: 100, visible: true },
  { id: "Definition2", name: "정의2", width: 120, visible: true },
  { id: "Definition3", name: "정의3", width: 120, visible: true },
  { id: "Memo", name: "메모", width: 150, visible: true },
  { id: "Start_Or", name: "시작여부", width: 100, visible: true },
  { id: "Whether_Or", name: "종업여부", width: 100, visible: true },
  { id: "Checklist", name: "체크리스트확인", width: 120, visible: true },
  { id: "Dialogue_Name", name: "카톡대화명", width: 120, visible: true },
  { id: "Change_Name", name: "변경대화명", width: 120, visible: true },
  { id: "kakao_add", name: "카톡친구추가", width: 120, visible: true },
  { id: "edit_conversation", name: "대화명수정", width: 120, visible: true },
  { id: "send", name: "발송", width: 100, visible: true },
  { id: "duplicate_check", name: "중복확인", width: 150, visible: true },
  { id: "actions", name: "작업", width: 100, visible: true },
]

export function ContactList({
  contacts,
  setContacts,
  showStatus,
  showColumnSettings,
  onToggleColumnSettings,
  onSingleContactSend,
  onTabChange,
  handleSendToDuplicateCheck,
  handleSendAll,
  handleSendOne,
  onMemoClick,
  groups
}: ContactListProps) {
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingConversation, setEditingConversation] = useState<Contact | null>(null)
  const [resizingColumnIndex, setResizingColumnIndex] = useState<number | null>(null)
  const [startX, setStartX] = useState(0)
  const tableRef = useRef<HTMLTableElement>(null)
  const [kakaoAddDialogOpen, setKakaoAddDialogOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [openAlert, setOpenAlert] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  // const [sendDialogOpen, setSendDialogOpen] = useState(false)
  // const [sendTargetId, setSendTargetId] = useState<string | null>(null)

  // Use localStorage to persist column settings
  const [columns, setColumns] = useLocalStorage<ColumnSetting[]>("column-settings", defaultColumns)
  const [columnWidths, setColumnWidths] = useState<number[]>([])

  // Initialize column widths from saved settings
  useEffect(() => {
    setColumnWidths(columns.map((col) => col.width))
  }, [columns])

  // 전화번호 기준 중복 정보 계산
  const getDuplicateInfo = (contactId: string) => {
    const contact = contacts.find((c) => c.ID === contactId)
    if (!contact) return { phoneCount: 0, emailCount: 0, memoCount: 0 }

    const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")
    if (!normalizedPhone) return { phoneCount: 0, emailCount: 0, memoCount: 0 }

    // 같은 전화번호를 가진 연락처들
    const samePhoneContacts = contacts.filter((c) => c.Phone_Number.replace(/[^0-9]/g, "") === normalizedPhone)

    // 중복된 전화번호 수
    const phoneCount = samePhoneContacts.length

    // 다른 이메일 주소 수 (중복 제외)
    const uniqueEmails = new Set(samePhoneContacts.map((c) => c.Email.toLowerCase().trim()).filter(Boolean))
    const emailCount = uniqueEmails.size

    // 다른 메모 수 (중복 제외)
    const uniqueMemos = new Set(samePhoneContacts.map((c) => c.Memo.trim()).filter(Boolean))
    const memoCount = uniqueMemos.size

    return { phoneCount, emailCount, memoCount }
  }

  // Update the handleCheckChange function to be reusable for row clicks
  const handleCheckChange = (checked: boolean | "indeterminate", contactId: string) => {
    const updatedContacts = contacts.map((contact) => {
      if (contact.ID === contactId) {
        return { ...contact, Check: checked === true }
      }
      return contact
    })
    setContacts(updatedContacts)
  }

  // Add a new function to toggle check when clicking on a row
  const handleRowClick = (contactId: string) => {
    const contact = contacts.find((c) => c.ID === contactId)
    if (contact) {
      handleCheckChange(!contact.Check, contactId)
    }
  }

  const handleDelete = (contactId: string) => {
    setOpenAlert(true)
    setDeleteTargetId(contactId)
  }

  const confirmDelete = () => {
    if (deleteTargetId) {
      const updatedContacts = contacts.filter((contact) => contact.ID !== deleteTargetId)
      setContacts(updatedContacts)
      showStatus("연락처가 삭제되었습니다")
      setOpenAlert(false)
      setDeleteTargetId(null)
    }
  }

  const cancelDelete = () => {
    setOpenAlert(false)
    setDeleteTargetId(null)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
  }

  const handleEditConversation = (contact: Contact) => {
    if (window.confirm('대화명수정\n components/edit-conversation-dialog.tsx 의 EditConversationDialog 함수에서')) {
      setEditingConversation(contact)
    }
  }

  const handleSaveEdit = (updatedContact: Contact) => {
    const updatedContacts = contacts.map((contact) => {
      if (contact.ID === updatedContact.ID) {
        return updatedContact
      }
      return contact
    })
    setContacts(updatedContacts)
    setEditingContact(null)
    showStatus("연락처가 업데이트되었습니다")
  }

  const handleSaveConversation = (updatedContact: Contact) => {
    const updatedContacts = contacts.map((contact) => {
      if (contact.ID === updatedContact.ID) {
        return updatedContact
      }
      return contact
    })
    setContacts(updatedContacts)
    setEditingConversation(null)
    showStatus("대화명이 업데이트되었습니다")
  }

  // Column resizing handlers
  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    setResizingColumnIndex(index)
    setStartX(e.clientX)

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumnIndex !== null) {
        const deltaX = e.clientX - startX
        const newWidths = [...columnWidths]
        newWidths[index] = Math.max(50, columnWidths[index] + deltaX)
        setColumnWidths(newWidths)
        setStartX(e.clientX)

        // Update the column settings with the new width
        const newColumns = [...columns]
        newColumns[index].width = newWidths[index]
        setColumns(newColumns)
      }
    }

    const handleMouseUp = () => {
      setResizingColumnIndex(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Save column settings
  const handleSaveColumnSettings = (newColumns: ColumnSetting[]) => {
    setColumns(newColumns)
    setColumnWidths(newColumns.map((col) => col.width))
    showStatus("열 설정이 저장되었습니다")
  }

  // Handle KakaoTalk friend add button click
  const handleKakaoAddClick = (contactId: string) => {
     {
      handleSendOne?.(contactId)
    }
  }

  // Process KakaoTalk friend add confirmation
  const handleKakaoAddConfirm = () => {
    if (!selectedContactId) return

    const updatedContacts = contacts.map((contact) => {
      if (contact.ID === selectedContactId) {
        // Update Whether_Or to "1"
        const updatedContact = { ...contact, Whether_Or: "1" }

        // Save contact data as JSON (in a real app, this would save to a file)
        try {
          const contactData = JSON.stringify(updatedContact, null, 2)
          // In a real app, you would save this to a file
          console.log("Saving contact data:", contactData)

          // For demonstration, we'll just show a success message
          showStatus(`카톡친구 추가 완료: ${updatedContact.Name}`, "success")
        } catch (error) {
          console.error("Error saving contact data:", error)
          showStatus("카톡친구 추가 중 오류가 발생했습니다", "error")
        }

        return updatedContact
      }
      return contact
    })

    setContacts(updatedContacts)
    setKakaoAddDialogOpen(false)
    setSelectedContactId(null)
  }

  // 발송 버튼 클릭 처리 함수를 수정합니다
  const handleSendClick = (contactId: string) => {
    // 확인 대화상자 없이 바로 처리
    const contact = contacts.find((c) => c.ID === contactId)
    if (!contact) return

    // 연락처의 Start_Or 필드를 업데이트하지 않음 (완료 표시 안함)
    // 대신 선택한 연락처를 localStorage에 저장
    localStorage.setItem("selected-contact-for-message", contactId)

    // 메시지 전송 탭으로 이동
    const tabsList = document.querySelector('[role="tablist"]')
    if (tabsList) {
      const messageSenderTab = tabsList.children[1] as HTMLElement
      if (messageSenderTab) {
        messageSenderTab.click()
      }
    }

    showStatus(`${contact.Name}님에게 메시지 발송 준비 완료`, "success")
  }

  // Check if KakaoTalk add button should be disabled
  const isKakaoAddDisabled = (contact: Contact) => {
    return contact.Checklist === "일치" || contact.Checklist === "불일치"
  }

  // Get KakaoTalk add button text
  const getKakaoAddButtonText = (contact: Contact) => {
    return isKakaoAddDisabled(contact) ? "Done" : "추가"
  }

  // Check if Send button should be disabled
  const isSendDisabled = (contact: Contact) => {
    return contact.Start_Or === "발송완료"
  }

  // Get Send button text
  const getSendButtonText = (contact: Contact) => {
    return contact.Start_Or === "발송완료" ? "완료" : "발송"
  }

  // Filter visible columns
  const visibleColumns = columns.filter((col) => col.visible)

  // Check for new columns that might have been added in updates
  useEffect(() => {
    // Check if there are any default columns that don't exist in the saved columns
    const savedColumnIds = new Set(columns.map((col) => col.id))
    const newColumns = defaultColumns.filter((col) => !savedColumnIds.has(col.id))

    if (newColumns.length > 0) {
      // Add the new columns to the saved columns
      setColumns([...columns, ...newColumns])
      showStatus("새로운 열이 추가되었습니다", "success")
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 발송 버튼 렌더링 부분
  const renderSendButton = (contact: Contact) => {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (window.confirm('이 버튼은 handleSingleContactSend 함수를 사용하고 있습니다. 계속하시겠습니까?')) {
            onSingleContactSend?.(contact);
          }
        }}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full"
      >
        <MessageCircle className="h-4 w-4" />
        발송
      </Button>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden flex-1 flex flex-col">
        <ScrollArea className="h-[calc(100vh-400px)] flex-1">
          <div className="overflow-x-auto w-full h-full">
            <Table ref={tableRef} className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column, index) => (
                    <TableHead
                      key={column.id}
                      style={{
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        position: "relative",
                      }}
                    >
                      {column.name}
                      <div
                        className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-gray-300 active:bg-gray-400"
                        onMouseDown={(e) => handleResizeStart(index, e)}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="text-center py-4">
                      연락처가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.ID} onDoubleClick={() => handleEdit(contact)} className="cursor-pointer h-8">
                      {visibleColumns.map((column) => {
                        if (column.id === "Check") {
                          return (
                            <TableCell
                              key={column.id}
                              style={{
                                width: `${column.width}px`,
                                maxWidth: `${column.width}px`,
                              }}
                              className="py-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCheckChange(!contact.Check, contact.ID)
                              }}
                            >
                              <Checkbox
                                checked={contact.Check}
                                onCheckedChange={(checked) => handleCheckChange(checked, contact.ID)}
                              />
                            </TableCell>
                          )
                        } else if (column.id === "actions") {
                          return (
                            <TableCell
                              key={column.id}
                              style={{
                                width: `${column.width}px`,
                                maxWidth: `${column.width}px`,
                              }}
                              className="py-1"
                            >
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(contact.ID)
                                  }}
                                  title="삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(contact)
                                  }}
                                  title="편집"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMemoClick?.(contact)
                                  }}
                                  title="메모 보기"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )
                        } else if (column.id === "kakao_add") {
                          return (
                            <TableCell
                              key={column.id}
                              style={{
                                width: `${column.width}px`,
                                maxWidth: `${column.width}px`,
                              }}
                              className="py-1"
                            >
                              <Button
                                variant={isKakaoAddDisabled(contact) ? "outline" : "default"}
                                size="sm"
                                disabled={isKakaoAddDisabled(contact)}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleKakaoAddClick(contact.ID)
                                }}
                                className="w-full"
                              >
                                {isKakaoAddDisabled(contact) ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : (
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                )}
                                {getKakaoAddButtonText(contact)}
                              </Button>
                            </TableCell>
                          )
                        } else if (column.id === "edit_conversation") {
                          // 버튼 상태 확인
                          const isWaitState = contact.Checklist !== "일치" && contact.Checklist !== "불일치"
                          const isDoneState = contact.Checklist === "일치"
                          const isEditState = contact.Checklist === "불일치"

                          return (
                            <TableCell
                              key={column.id}
                              style={{
                                width: `${column.width}px`,
                                maxWidth: `${column.width}px`,
                              }}
                              className="py-1"
                            >
                              <Button
                                variant={isWaitState || isDoneState ? "outline" : "default"}
                                size="sm"
                                disabled={!isEditState}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditConversation(contact)
                                }}
                                className={`w-full ${isWaitState ? 'bg-yellow-100 hover:bg-yellow-200' : ''}`}
                              >
                                {isWaitState ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : isDoneState ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : (
                                  <Edit className="h-4 w-4 mr-1" />
                                )}
                                {isWaitState ? "Wait" : isDoneState ? "Done" : "수정"}
                              </Button>
                            </TableCell>
                          )
                        } else if (column.id === "send") {
                          return (
                            <TableCell
                              key={column.id}
                              style={{
                                width: `${column.width}px`,
                                maxWidth: `${column.width}px`,
                              }}
                              className="py-1"
                            >
                              {renderSendButton(contact)}
                            </TableCell>
                          )
                        } else if (column.id === "duplicate_check") {
                          const { phoneCount, emailCount, memoCount } = getDuplicateInfo(contact.ID)
                          const hasDuplicates = phoneCount > 1 || emailCount > 1 || memoCount > 1
                          const showNone = phoneCount <= 1 && emailCount <= 1 && memoCount <= 1

                          return (
                            <TableCell
                              key={column.id}
                              style={{
                                width: `${column.width}px`,
                                maxWidth: `${column.width}px`,
                              }}
                              className="py-1"
                            >
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant={hasDuplicates ? "default" : "outline"}
                                  size="sm"
                                  className="w-full px-1"
                                  disabled={!hasDuplicates}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendToDuplicateCheck(contact.Phone_Number)
                                  }}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    {showNone ? (
                                      <span className="text-xs">None</span>
                                    ) : (
                                      <>
                                        <div className="flex items-center">
                                          <Phone className="h-3 w-3" />
                                          <span className="text-xs">{phoneCount > 1 ? phoneCount : "-"}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Mail className="h-3 w-3" />
                                          <span className="text-xs">{emailCount > 1 ? emailCount : "-"}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <FileText className="h-3 w-3" />
                                          <span className="text-xs">{memoCount > 1 ? memoCount : "-"}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </Button>
                              </div>
                            </TableCell>
                          )
                        } else {
                          return (
                            <TableCell
                              key={column.id}
                              style={{
                                width: `${column.width}px`,
                                maxWidth: `${column.width}px`,
                              }}
                              className="py-1"
                              onClick={() => handleRowClick(contact.ID)}
                            >
                              <div className="truncate">{contact[column.id as keyof Contact]}</div>
                            </TableCell>
                          )
                        }
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>

      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => {
            if (!open) setEditingContact(null)
          }}
          onSave={handleSaveEdit}
          groups={groups}
        />
      )}

      {editingConversation && (
        <EditConversationDialog
          contact={editingConversation}
          open={!!editingConversation}
          onOpenChange={(open) => {
            if (!open) setEditingConversation(null)
          }}
          onSave={handleSaveConversation}
        />
      )}

      <ColumnSettingsDialog
        open={showColumnSettings}
        onOpenChange={onToggleColumnSettings}
        columns={columns}
        onSave={handleSaveColumnSettings}
      />

      {/* KakaoTalk Add Confirmation Dialog */}
      <AlertDialog open={kakaoAddDialogOpen} onOpenChange={setKakaoAddDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카톡친구 추가</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 연락처에 카톡친구 추가 작업을 수행하시겠습니까? 이 작업은 종업여부를 1로 변경하고 연락처 데이터를
              저장합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleKakaoAddConfirm}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation Dialog */}
      {/* <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메시지 발송</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 연락처에 메시지를 발송하시겠습니까? 이 작업은 시작여부를 '발송완료'로 변경합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendConfirm}>발송</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>연락처 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 연락처를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

