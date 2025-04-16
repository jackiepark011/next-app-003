"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Contact, Group } from "@/lib/types"
import { GroupList } from "@/components/group-list"
import { ContactList } from "@/components/contact-list"
import { AddContactDialog } from "@/components/add-contact-dialog"
import { AddGroupDialog } from "@/components/add-group-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  RefreshCw,
  Settings,
  Save,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Globe,
  CheckSquare,
  MessageCircle,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColumnSettingsDialog, type ColumnSetting } from "@/components/column-settings-dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { defaultColumns } from "@/lib/constants"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

// isConversationEditEnabled 함수 구현
const isConversationEditEnabled = (contact: Contact) => {
  return contact.Checklist === "일치" || contact.Checklist === "불일치"
}

interface AddressBookTabProps {
  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void
  groups: Group[]
  setGroups: (groups: Group[]) => void
  onSendSelectedContacts?: (contacts: Contact[]) => void
  onTabChange: (tabId: string, phoneNumber?: string) => void
}

// 전역 타입 선언 추가
declare global {
  interface Window {
    handleConfirm: (button: HTMLButtonElement) => void;
    handleConfirmNew: (button: HTMLButtonElement) => void;
    handleNameChange: (input: HTMLInputElement, kakaoName: string) => void;
    handleFinalConfirm: (button: HTMLButtonElement) => void;
  }
}

export function AddressBookTab({ contacts, setContacts, groups, setGroups, onSendSelectedContacts, onTabChange }: AddressBookTabProps) {
  const { toast } = useToast()
  const [selectedGroup, setSelectedGroup] = useState<string>("전체")
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [autoSave, setAutoSave] = useState(true)
  const [selectAll, setSelectAll] = useState(false)
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [copiedContacts, setCopiedContacts] = useState<Contact[]>([])
  const [cutMode, setCutMode] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 100
  const [columns, setColumns] = useLocalStorage<ColumnSetting[]>("column-settings", defaultColumns)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [activeTab, setActiveTab] = useState("address-book")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showKakaoAddDialog, setShowKakaoAddDialog] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showKakaoListDialog, setShowKakaoListDialog] = useState(false)
  const [filteredKakaoList, setFilteredKakaoList] = useState<Contact[]>([])
  const [singleContact, setSingleContact] = useState<Contact | null>(null)
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false)
  const [dialogNameList, setDialogNameList] = useState<Contact[]>([])
  const [showMemoDialog, setShowMemoDialog] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<{id: string, memo: string} | null>(null)

  // Filter contacts based on selected group - memoized with useCallback
  const filterContacts = useCallback(() => {
    if (selectedGroup === "전체") {
      return contacts
    } else if (selectedGroup === "선택됨") {
      return contacts.filter((contact) => contact.Check)
    } else if (selectedGroup === "카톡친구추가") {
      return contacts.filter((contact) => contact.Checklist !== "일치" && contact.Checklist !== "불일치")
    } else if (selectedGroup === "대화명수정") {
      return contacts.filter(contact => 
        contact.Checklist !== "일치" && // 체크리스트가 "일치"가 아님
        isConversationEditEnabled(contact)     // 대화명 수정이 활성화된 경우
      )
    } else if (selectedGroup === "중복제거") {
      const phoneNumberCounts: Record<string, number> = {}
      contacts.forEach((contact) => {
        const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")
        if (normalizedPhone) {
          phoneNumberCounts[normalizedPhone] = (phoneNumberCounts[normalizedPhone] || 0) + 1
        }
      })
      return contacts.filter((contact) => {
        const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")
        return normalizedPhone && phoneNumberCounts[normalizedPhone] > 1
      })
    } else {
      return contacts.filter((contact) => contact.Group === selectedGroup)
    }
  }, [contacts, selectedGroup])

  // Update filtered contacts when dependencies change
  useEffect(() => {
    setFilteredContacts(filterContacts())
  }, [filterContacts])

  // Toggle all checkboxes in the current filtered view
  const handleToggleAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)

    const updatedContacts = contacts.map((contact) => {
      // Only update contacts in the current view
      if (
        selectedGroup === "전체" ||
        (selectedGroup === "선택됨" && contact.Check) ||
        contact.Group === selectedGroup
      ) {
        return { ...contact, Check: newSelectAll }
      }
      return contact
    })

    setContacts(updatedContacts)
    showStatusMessage(`${newSelectAll ? "선택됨" : "선택 해제됨"} 모든 연락처 (${selectedGroup} 그룹)`)
  }

  // Update selectAll state when filtered contacts change
  useEffect(() => {
    const currentFilteredContacts = filterContacts()
    const allChecked = currentFilteredContacts.length > 0 && currentFilteredContacts.every(contact => contact.Check)
    setSelectAll(allChecked)
  }, [filterContacts, contacts])

  // Delete selected contacts
  const handleDeleteSelected = () => {
    const selectedCount = contacts.filter((c) => c.Check).length
    if (selectedCount === 0) {
      showStatusMessage("삭제할 연락처가 선택되지 않았습니다", "error")
      return
    }

    const updatedContacts = contacts.filter((contact) => !contact.Check)
    setContacts(updatedContacts)
    showStatusMessage(`${selectedCount}개 연락처 삭제됨`)
  }

  // Copy selected contacts
  const handleCopySelected = () => {
    const selectedContacts = contacts.filter((c) => c.Check)
    if (selectedContacts.length === 0) {
      showStatusMessage("복사할 연락처가 선택되지 않았습니다", "error")
      return
    }

    setCopiedContacts(selectedContacts)
    setCutMode(false)
    showStatusMessage(`${selectedContacts.length}개 연락처 복사됨`)
  }

  // Cut selected contacts
  const handleCutSelected = () => {
    const selectedContacts = contacts.filter((c) => c.Check)
    if (selectedContacts.length === 0) {
      showStatusMessage("잘라낼 연락처가 선택되지 않았습니다", "error")
      return
    }

    setCopiedContacts(selectedContacts)
    setCutMode(true)
    showStatusMessage(`${selectedContacts.length}개 연락처 잘라내기됨`)
  }

  // Paste contacts to selected group
  const handlePasteContacts = () => {
    if (copiedContacts.length === 0) {
      showStatusMessage("붙여넣을 연락처가 없습니다", "error")
      return
    }

    if (selectedGroup === "전체" || selectedGroup === "선택됨") {
      showStatusMessage("붙여넣기할 특정 그룹을 선택해주세요", "error")
      return
    }

    // Create new contacts with updated group and new IDs
    const highestId = Math.max(...contacts.map((c) => Number.parseInt(c.ID)), 0)
    const newContacts = copiedContacts.map((contact, index) => ({
      ...contact,
      ID: (highestId + index + 1).toString(),
      Group: selectedGroup,
      Check: true,
    }))

    // If in cut mode, remove the original contacts
    let updatedContacts = [...contacts]
    if (cutMode) {
      updatedContacts = updatedContacts.filter((contact) => !copiedContacts.some((c) => c.ID === contact.ID))
    }

    // Add the new contacts
    setContacts([...updatedContacts, ...newContacts])
    setCopiedContacts([])
    setCutMode(false)
    showStatusMessage(`${newContacts.length}개 연락처가 ${selectedGroup} 그룹에 붙여넣기됨`)
  }

  // 상태 메시지 표시 함수
  const showStatusMessage = (message: string, type: "default" | "success" | "error" = "default") => {
    toast({
      title: type === "success" ? "성공" : type === "error" ? "오류" : "알림",
      description: message,
      variant: type === "error" ? "destructive" : "default",
    })
  }

  // Add a new contact
  const handleAddContact = (contact: Omit<Contact, "ID">) => {
    const newId = contacts.length > 0 ? Math.max(...contacts.map((c) => Number.parseInt(c.ID))) + 1 : 1
    const newContact = {
      ID: newId.toString(),
      ...contact,
    }

    setContacts([...contacts, newContact])
    showStatusMessage("연락처가 추가되었습니다")
  }

  // Add a new group
  const handleAddGroup = (groupName: string) => {
    if (groups.some((g) => g.name === groupName)) {
      showStatusMessage("그룹이 이미 존재합니다", "error")
      return
    }

    const newGroup = {
      id: groups.length > 0 ? Math.max(...groups.map((g) => g.id)) + 1 : 1,
      name: groupName,
    }

    setGroups([...groups, newGroup])
    showStatusMessage("그룹이 추가되었습니다")
  }

  // Delete a group
  const handleDeleteGroup = (groupId: number) => {
    const groupToDelete = groups.find((g) => g.id === groupId)
    if (!groupToDelete) return

    // Check if there are contacts in this group
    const contactsInGroup = contacts.filter((c) => c.Group === groupToDelete.name)
    if (contactsInGroup.length > 0) {
      showStatusMessage(`${contactsInGroup.length}개의 연락처가 있는 그룹은 삭제할 수 없습니다`, "error")
      return
    }

    // 그룹 삭제
    setGroups(groups.filter((g) => g.id !== groupId))
    
    // 해당 그룹의 연락처들의 그룹 정보를 "기타"로 변경
    const updatedContacts = contacts.map(contact => {
      if (contact.Group === groupToDelete.name) {
        return { ...contact, Group: "기타" }
      }
      return contact
    })
    setContacts(updatedContacts)
    
    showStatusMessage(`"${groupToDelete.name}" 그룹이 삭제되었습니다`)
  }

  // Toggle column settings dialog
  const handleToggleColumnSettings = () => {
    setShowColumnSettings(!showColumnSettings)
  }

  // 페이지네이션 관련 함수들
  const totalPages = Math.ceil(contacts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentContacts = contacts.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // 발송항목전송 버튼 클릭 시 처리
  const handleSendSelectedContacts = () => {
    const selectedContacts = contacts.filter(contact => contact.Check)
    if (!window.confirm('발송항목전송 / handleSendSelectedContacts address-book-tab.tsx')) {
      return;
    }
    if (selectedContacts.length === 0) {
      toast({
        title: "오류",
        description: "전송할 연락처가 선택되지 않았습니다",
        variant: "destructive",
      })
      return
    }

    // 안내창 표시
    // if (!window.confirm('하단 버튼')) {
    //   return
    // }
    onTabChange("message-sender")
    
    // 선택된 연락처의 ID만 추출
    const selectedContactIds = selectedContacts.map(contact => contact.ID)
    
    // localStorage에 선택된 연락처 ID 저장
    localStorage.setItem("selected-contacts-for-message", JSON.stringify(selectedContactIds))
    
    
    if (onSendSelectedContacts) {
      onSendSelectedContacts(selectedContacts)
      toast({
        title: "성공",
        description: `${selectedContacts.length}개의 연락처가 전송 목록에 추가되었습니다`,
      })
    }
  }

  const handleSingleContactSend = (contact: Contact) => {
    // localStorage에 선택된 연락처 ID 저장 , 컬럼 발송/카톡친구추가 목록에 버튼 클릭 시 처리
    localStorage.setItem("selected-contacts-for-message", JSON.stringify([contact.ID]))
    
    if (onSendSelectedContacts) {
      onSendSelectedContacts([contact])
      toast({
        title: "성공",
        description: `${contact.Name}님이 전송 목록에 추가되었습니다`,
      })
    }
    onTabChange("message-sender")
  }

  // const filterKakaoFriends = (contacts: Contact[]): Contact[] => {
  //   return contacts.filter(item => 
  //     item.Group === "카톡친구추가" &&
  //     item.Checklist !== "일치" &&
  //     item.Checklist !== "불일치" &&
  //     item.Phone_Number // 필수 필드 확인
  //   );
  // };

  const handleSendAll = async () => {
    try {
      // 1단계: 시작 안내
      if (!window.confirm('1단계: handleSendAll 함수를 실행하여 카카오톡 친구 추가 목록을 처리합니다.')) {
        return
      }

      // 2단계: 전체 목록에서 체크리스트 값이 '일치' 또는 '불일치'가 아닌 연락처 필터링
      const kakaoFriendsList = contacts.filter(item => {
        const isValidChecklist = item.Checklist !== "일치" && item.Checklist !== "불일치"
        const hasPhoneNumber = item.Phone_Number && item.Phone_Number.trim() !== ""
        
        return isValidChecklist && hasPhoneNumber
      })

      if (kakaoFriendsList.length === 0) {
        const message = contacts.length === 0 
          ? "연락처가 없습니다."
          : "체크리스트 값이 '일치' 또는 '불일치'가 아닌 연락처가 없습니다."
        
        showStatusMessage(message, "error")
        return
      }

      // 종업여부를 1로 변경
      const updatedContacts = contacts.map(contact => {
        if (kakaoFriendsList.some(k => k.ID === contact.ID)) {
          return { ...contact, Whether_Or: "1" }
        }
        return contact
      })
      setContacts(updatedContacts)

      // 필터링된 리스트를 상태에 저장하고 모달 표시
      setFilteredKakaoList(updatedContacts.filter(contact => 
        kakaoFriendsList.some(k => k.ID === contact.ID)
      ))
      setShowKakaoListDialog(true)

    } catch (error: any) {
      console.error('Error:', error)
      showStatusMessage(`처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, "error")
    }
  }

  const handleConfirmKakaoList = async () => {
    try {
      // 3단계: make_list.json 파일 저장
      const response = await fetch('/api/save-kakao-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kakaoList: filteredKakaoList
        }),
      })

      const result = await response.json()

      if (result.success) {
        showStatusMessage(result.message, "success")
        setShowKakaoListDialog(false)
      } else {
        showStatusMessage(result.message, "error")
      }
    } catch (error: any) {
      console.error('Error saving kakao list:', error)
      showStatusMessage(`저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, "error")
    }
  }

  const handleSendToDuplicateCheck = (phoneNumber?: string) => {
    // if (window.confirm('선택한 연락처를 중복 확인 탭으로 전달하시겠습니까?')) {
      if (phoneNumber) {
        // 전화번호를 localStorage에 저장
        localStorage.setItem('duplicateCheckPhone', phoneNumber)
        onTabChange("duplicate-check")
        // localStorage 내용 삭제
        // localStorage.removeItem('duplicateCheckPhone')
      }
      
      // 탭3 버튼 클릭
      const tabsList = document.querySelector('[role="tablist"]')
      if (tabsList) {
        const tab3Button = tabsList.querySelector('[value="duplicate-check"]') as HTMLElement
        if (tab3Button) {
          tab3Button.click()
        }
      }
    }
  // }

  const handleSearch = async (phone: string) => {
    if (!phone) return
    
    setIsSearching(true)
    try {
      // 검색 API 호출
      const response = await fetch(`/api/search?phone=${encodeURIComponent(phone)}`)
      if (!response.ok) {
        throw new Error('검색 중 오류가 발생했습니다.')
      }
      const results = await response.json()
      setSearchResults(results)
      // 검색 완료 안내창
      window.alert('검색이 완료되었습니다.')
    } catch (error) {
      console.error("검색 중 오류 발생:", error)
      window.alert('검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleTabChange = (tabId: string, phoneNumber?: string) => {
    // 탭 변경 로직 구현
    console.log(`Tab changed to ${tabId} with phone number: ${phoneNumber}`)
  }

  const handleSendOne = async (contactId: string) => {
    try {
      const contact = contacts.find(c => c.ID === contactId)
      if (!contact) {
        showStatusMessage("연락처를 찾을 수 없습니다", "error")
        return
      }

      // 종업여부를 1로 변경
      const updatedContact = { ...contact, Whether_Or: "1" }
      const updatedContacts = contacts.map(c => 
        c.ID === contactId ? updatedContact : c
      )
      setContacts(updatedContacts)

      // 단건 연락처를 상태에 저장하고 모달 표시
      setSingleContact(updatedContact)
      setShowKakaoAddDialog(true)

    } catch (error: any) {
      console.error('Error:', error)
      showStatusMessage(`처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, "error")
    }
  }

  const handleConfirmKakaoAdd = async () => {
    try {
      if (!singleContact) return

      // 3단계: make_list.json 파일 저장
      const response = await fetch('/api/save-kakao-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kakaoList: [singleContact]
        }),
      })

      const result = await response.json()

      if (result.success) {
        showStatusMessage(result.message, "success")
        setShowKakaoAddDialog(false)
        setSingleContact(null)
      } else {
        showStatusMessage(result.message, "error")
      }
    } catch (error: any) {
      console.error('Error saving kakao list:', error)
      showStatusMessage(`저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, "error")
    }
  }

  const handleDialogNameChangeBatch = async () => {
    try {
      // 1단계: 시작 안내
      if (!window.confirm('1단계: handleDialogNameChangeBatch 대화명 수정 목록을 처리합니다.')) {
        return
      }

      // 2단계: 전체 목록에서 대화명수정 컬럼이 "수정" 버튼인 연락처 필터링
      const filteredContacts = contacts.filter(contact => 
        contact.Checklist !== "일치" && // 체크리스트가 "일치"가 아님
        isConversationEditEnabled(contact)     // 대화명 수정이 활성화된 경우
      )

      if (filteredContacts.length === 0) {
        showStatusMessage("대화명 수정이 필요한 연락처가 없습니다.", "error")
        return
      }

      // 필터링된 리스트를 상태에 저장
      setDialogNameList(filteredContacts)

      

      // 연락처 업데이트
      const updatedContacts = contacts.map(contact => {
        if (filteredContacts.some(target => target.ID === contact.ID)) {
          return {
            ...contact,
            Conversation: contact.Dialogue_Name,
            Change_Name: "",
            Checklist: "일치",
            Whether_Or: "5"
          }
        }
        return contact
      })
      setContacts(updatedContacts)
      showStatusMessage("대화명이 수정되었습니다.")

    } catch (error: any) {
      console.error('Error:', error)
      showStatusMessage(`처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, "error")
    }
  }

  const handleDialogNameChangeNew = async () => {
    try {
      // 1단계: 시작 안내
      if (!window.confirm('1단계: handleDialogNameChangeNew 대화명 수정 목록을 처리합니다.')) {
        return
      }

      // 2단계: 전체 목록에서 대화명수정 컬럼이 "수정" 버튼인 연락처 필터링
      const filteredContacts = contacts.filter(contact => 
        contact.Checklist !== "일치" && // 체크리스트가 "일치"가 아님
        isConversationEditEnabled(contact)     // 대화명 수정이 활성화된 경우
      )

      if (filteredContacts.length === 0) {
        showStatusMessage("대화명 수정이 필요한 연락처가 없습니다.", "error")
        return
      }

      // 필터링된 리스트를 상태에 저장
      setDialogNameList(filteredContacts)

      // 대화상자 표시
      const dialogModal = document.createElement('div')
      dialogModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      dialogModal.innerHTML = `
        <div class="bg-white p-6 rounded-lg" style="min-width: 800px;">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">대화명 수정 (수정해야 할 대화명은 ${filteredContacts.length}개)</h2>
            <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">✕</button>
          </div>

          <div class="space-y-4">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-50">
                  <th class="p-2 text-center border">번호</th>
                  <th class="p-2 border">대화창명</th>
                  <th class="p-2 border">이름</th>
                  <th class="p-2 border">카톡대화명</th>
                  <th class="p-2 border">변경대화명(입력해주세요)</th>
                </tr>
              </thead>
              <tbody>
                ${filteredContacts.map((contact, index) => `
                  <tr>
                    <td class="p-2 text-center border">${index + 1}</td>
                    <td class="p-2 border">${contact.Conversation || ''}</td>
                    <td class="p-2 border">${contact.Name || ''}</td>
                    <td class="p-2 border">${contact.Dialogue_Name || ''}</td>
                    <td class="p-2 border bg-yellow-50">
                      <input type="text" 
                             class="w-full p-1 border rounded" 
                             value="${contact.Change_Name || ''}"
                             placeholder="변경할 대화명을 입력하세요"
                             onchange="handleNameChange(this, '${contact.Dialogue_Name || ''}')"
                             data-row="${index}">
                      <div class="text-red-500 text-sm hidden name-warning-${index}">
                        카톡대화명과 동일한 이름은 사용할 수 없습니다
                      </div>
                      <div class="text-red-500 text-sm hidden empty-warning-${index}">
                        변경할 대화명을 입력해주세요
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="flex justify-end space-x-2 mt-6">
            <button class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onclick="this.closest('.fixed').remove()">
              취소
            </button>
            <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="handleConfirmNew(this)">
              확인
            </button>
          </div>
        </div>
      `

      // 대화명 변경 핸들러 추가
      window.handleNameChange = (input: HTMLInputElement, kakaoName: string) => {
        const rowIndex = input.getAttribute('data-row')
        const warningDiv = document.querySelector(`.name-warning-${rowIndex}`) as HTMLElement
        const emptyWarningDiv = document.querySelector(`.empty-warning-${rowIndex}`) as HTMLElement
        if (!warningDiv || !emptyWarningDiv) return

        // 입력값이 비어있는 경우
        if (!input.value.trim()) {
          emptyWarningDiv.classList.remove('hidden')
          warningDiv.classList.add('hidden')
          input.classList.add('border-red-500')
          return
        }

        // 카톡대화명과 동일한 경우
        if (input.value === kakaoName) {
          warningDiv.classList.remove('hidden')
          emptyWarningDiv.classList.add('hidden')
          input.classList.add('border-red-500')
        } else {
          warningDiv.classList.add('hidden')
          emptyWarningDiv.classList.add('hidden')
          input.classList.remove('border-red-500')
        }
      }

      // 확인 버튼 클릭 핸들러
      window.handleConfirmNew = async (button: HTMLButtonElement) => {
        const modal = button.closest('.fixed')
        if (!modal) return

        const inputs = Array.from(modal.querySelectorAll('tbody input[type="text"]')) as HTMLInputElement[]
        const kakaoNames = filteredContacts.map(contact => contact.Dialogue_Name || '')
        
        // 유효성 검사
        let hasError = false
        inputs.forEach((input, index) => {
          const warningDiv = modal.querySelector(`.name-warning-${index}`) as HTMLElement
          const emptyWarningDiv = modal.querySelector(`.empty-warning-${index}`) as HTMLElement
          
          if (!input.value.trim()) {
            if (emptyWarningDiv) {
              emptyWarningDiv.classList.remove('hidden')
              warningDiv?.classList.add('hidden')
            }
            input.classList.add('border-red-500')
            hasError = true
          } else if (input.value === kakaoNames[index]) {
            if (warningDiv) {
              warningDiv.classList.remove('hidden')
              emptyWarningDiv?.classList.add('hidden')
            }
            input.classList.add('border-red-500')
            hasError = true
          }
        })

        if (hasError) {
          showStatusMessage("변경대화명을 확인해주세요. 비어있거나 카톡대화명과 동일한 이름이 있습니다.", "error")
          return
        }

        try {
          // 연락처 업데이트
          const newNames = inputs.map(input => input.value.trim())
          const updatedContacts = contacts.map((contact, index) => {
            if (filteredContacts.some(target => target.ID === contact.ID)) {
              return {
                ...contact,
                Whether_Or: "3",
                Change_Name: newNames[index]
              }
            }
            return contact
          })

          // 업데이트된 연락처 중 변경된 항목만 필터링
          const changedContacts = updatedContacts.filter(contact => 
            filteredContacts.some(target => target.ID === contact.ID)
          )

          // make_list.json 파일 저장
          const response = await fetch('/api/save-kakao-list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              kakaoList: changedContacts
            }),
          })

          const result = await response.json()

          if (result.success) {
            setContacts(updatedContacts)
            showStatusMessage(result.message, "success")
            modal.remove()
          } else {
            showStatusMessage(result.message, "error")
          }
        } catch (error: any) {
          console.error('Error saving list:', error)
          showStatusMessage(`저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, "error")
        }
      }

      document.body.appendChild(dialogModal)

    } catch (error: any) {
      console.error('Error:', error)
      showStatusMessage(`처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`, "error")
    }
  }

  // 메모 수정 핸들러
  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedMemo) {
      setSelectedMemo({...selectedMemo, memo: e.target.value})
    }
  }

  // 메모 저장 핸들러
  const handleSaveMemo = () => {
    if (selectedMemo) {
      const updatedContacts = contacts.map(contact => {
        if (contact.ID === selectedMemo.id) {
          return {...contact, Memo: selectedMemo.memo}
        }
        return contact
      })
      setContacts(updatedContacts)
      setShowMemoDialog(false)
      setSelectedMemo(null)
      showStatusMessage("메모가 저장되었습니다", "success")
    }
  }

  // 메모 보기 버튼 클릭 핸들러
  const handleMemoClick = (contact: Contact) => {
    setSelectedMemo({id: contact.ID, memo: contact.Memo || ''})
    setShowMemoDialog(true)
  }

  return (
    <div className="space-y-0 h-[calc(100%-40px)] flex flex-col">
      <Toaster />

      {/* Top controls */}
      <div className="flex items-center justify-between mb-0">
        <div className="flex items-center space-x-2">
          <Button
            variant={autoSave ? "default" : "destructive"}
            onClick={() => setAutoSave(!autoSave)}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {autoSave ? "자동저장 켜짐" : "자동저장 꺼짐"}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content - using flex layout for maximum width */}
      <div className="flex gap-2 h-full">
        {/* Left sidebar - Groups */}
        <Card className="w-[150px] flex flex-col">
          <div className="p-2 border-b">
            <h2 className="font-semibold">그룹</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <GroupList
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              onDeleteGroup={handleDeleteGroup}
              systemGroups={[
                { id: -1, name: "전체", icon: <Globe className="h-4 w-4 mr-2" /> },
                { id: -2, name: "선택됨", icon: <CheckSquare className="h-4 w-4 mr-2" /> },
                { id: -3, name: "카톡친구추가", icon: <MessageCircle className="h-4 w-4 mr-2" /> },
                { id: -4, name: "대화명수정", icon: <Edit className="h-4 w-4 mr-2" /> },
                { id: -5, name: "중복제거", icon: <Trash2 className="h-4 w-4 mr-2" /> },
              ]}
            />
          </div>
          <div className="p-2 border-t mt-auto">
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setAddGroupOpen(true)}>
                그룹 추가
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                if (selectedGroup === "전체" || selectedGroup === "선택됨" || selectedGroup === "카톡친구추가" || selectedGroup === "대화명수정" || selectedGroup === "중복제거") {
                  showStatusMessage("시스템 그룹은 삭제할 수 없습니다", "error")
                  return
                }

                const groupToDelete = groups.find((g) => g.name === selectedGroup)
                if (!groupToDelete) {
                  showStatusMessage("삭제할 그룹이 선택되지 않았습니다", "error")
                  return
                }

                // Check if there are contacts in this group
                const contactsInGroup = contacts.filter((c) => c.Group === groupToDelete.name)
                if (contactsInGroup.length > 0) {
                  showStatusMessage(`${contactsInGroup.length}개의 연락처가 있는 그룹은 삭제할 수 없습니다`, "error")
                  return
                }

                // 그룹 삭제
                setGroups(groups.filter((g) => g.id !== groupToDelete.id))
                showStatusMessage(`"${groupToDelete.name}" 그룹이 삭제되었습니다`)
              }}>
                그룹 삭제
              </Button>
            </div>
          </div>
        </Card>

        {/* Right content - Contacts */}
        <Card className="p-2 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium flex items-center gap-4">
              {selectedGroup} 목록 (체크됨: {contacts.filter((c) => c.Check).length} / 전체: {contacts.length})
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectAll} 
                  onCheckedChange={handleToggleAll} 
                />
                <Label htmlFor="select-all">전체 선택</Label>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="flex items-center">
                <Trash2 className="mr-2 h-4 w-4" />
                선택 삭제
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <ContactList
              contacts={filteredContacts}
              setContacts={setContacts}
              showStatus={showStatusMessage}
              showColumnSettings={showColumnSettings}
              onToggleColumnSettings={() => setShowColumnSettings(false)}
              onSingleContactSend={handleSingleContactSend}
              onTabChange={handleTabChange}
              handleSendToDuplicateCheck={handleSendToDuplicateCheck}
              handleSendAll={handleSendAll}
              handleSendOne={handleSendOne}
              onMemoClick={handleMemoClick}
              groups={groups.map(g => g.name)}
            />
          </div>

          <Separator className="my-4" />

          {/* Bottom buttons */}
          <div className="grid grid-cols-5 gap-1">
            <Button variant="outline" onClick={() => setAddContactOpen(true)}>
              연락처 추가
            </Button>

            <Button variant="outline" onClick={handleCopySelected}>
              <Copy className="mr-2 h-4 w-4" />
              복사
            </Button>

            <Button variant="outline" onClick={handleCutSelected}>
              <Scissors className="mr-2 h-4 w-4" />
              잘라내기
            </Button>

            <Button variant="outline" onClick={handlePasteContacts} disabled={copiedContacts.length === 0}>
              <Clipboard className="mr-2 h-4 w-4" />
              붙여넣기
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const updatedContacts = contacts.map((c) => ({ ...c, Check: false }))
                setContacts(updatedContacts)
                setSelectAll(false)
                showStatusMessage("모든 연락처 체크 해제됨")
              }}
            >
              전체 체크 해제
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-1 mt-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSendSelectedContacts}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full"
            >
              <MessageCircle className="h-4 w-4" />
              발송항목전송
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendAll}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full"
            >
              <MessageCircle className="h-4 w-4" />
              친구추가전송
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDialogNameChangeBatch}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full"
            >
              <Edit className="h-4 w-4" />
              대화명수정전송(기존명 사용)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDialogNameChangeNew}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full"
            >
              <Edit className="h-4 w-4" />
              대화명수정전송(New)
            </Button>
            <Button variant="outline" size="sm">체크그룹이동</Button>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <AddContactDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        onAddContact={handleAddContact}
        groups={groups.map((g) => g.name).filter((name) => name !== "전체" && name !== "선택됨")}
        selectedGroup={selectedGroup !== "전체" && selectedGroup !== "선택됨" ? selectedGroup : undefined}
      />

      <AddGroupDialog open={addGroupOpen} onOpenChange={setAddGroupOpen} onAddGroup={handleAddGroup} />

      <ColumnSettingsDialog
        open={showColumnSettings}
        onOpenChange={() => setShowColumnSettings(false)}
        columns={columns}
        onSave={setColumns}
      />

      {/* 발송 확인 다이얼로그 */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>발송항목전송</DialogTitle>
            <DialogDescription>
              선택된 {selectedContacts.length}개의 연락처를 메시지전송 탭의 발송대상 목록으로 전송하겠습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSendSelectedContacts}>
              전송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카카오 리스트 확인 다이얼로그 */}
      <Dialog open={showKakaoListDialog} onOpenChange={setShowKakaoListDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>카카오톡 친구 추가 대상 목록</DialogTitle>
            <DialogDescription>
              총 {filteredKakaoList.length}개의 연락처가 필터링되었습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto my-4 bg-gray-100 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(filteredKakaoList, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKakaoListDialog(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmKakaoList}>
              확인 및 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카카오 단건 추가 확인 다이얼로그 */}
      <Dialog open={showKakaoAddDialog} onOpenChange={setShowKakaoAddDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>카카오톡 친구 추가 대상</DialogTitle>
            <DialogDescription>
              선택한 연락처를 카카오톡 친구 추가 목록에 추가하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto my-4 bg-gray-100 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(singleContact, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKakaoAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmKakaoAdd}>
              확인 및 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메모 다이얼로그 */}
      <Dialog open={showMemoDialog} onOpenChange={setShowMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메모</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={selectedMemo?.memo || ''}
              onChange={handleMemoChange}
              placeholder="메모를 입력하세요"
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemoDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSaveMemo}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

