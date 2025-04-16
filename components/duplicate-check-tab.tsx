"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { Contact } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"

interface DuplicateCheckTabProps {
  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void
  phoneNumber?: string
}

export function DuplicateCheckTab({ contacts, setContacts, phoneNumber }: DuplicateCheckTabProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [defaultContact, setDefaultContact] = useState<string | null>(null)
  const [emailCheckbox, setEmailCheckbox] = useState(false)
  const [memoCheckbox, setMemoCheckbox] = useState(false)

  // 디버깅을 위한 console.log 추가
  console.log("DuplicateCheckTab 렌더링됨, phoneNumber:", phoneNumber)

  // 전화번호로 연락처 검색
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "경고",
        description: "검색할 전화번호를 입력해주세요.",
        variant: "destructive",
      })
      setSearchResults([])
      setHasSearched(false)
      return
    }

    // 전화번호 정규화
    const normalizedSearchTerm = searchTerm.replace(/[^0-9]/g, "")

    // 정확한 일치 검색
    const results = contacts.filter((contact) => {
      const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")
      return normalizedPhone === normalizedSearchTerm
    })

    if (results.length === 0) {
      toast({
        title: "알림",
        description: "검색된 연락처가 없습니다.",
      })
      setSearchResults([])
      setHasSearched(true)
      return
    }

    // 전화번호별로 그룹화하여 중복 확인
    const phoneGroups: Record<string, Contact[]> = {}
    results.forEach((contact) => {
      const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")
      if (normalizedPhone) {
        if (!phoneGroups[normalizedPhone]) {
          phoneGroups[normalizedPhone] = []
        }
        phoneGroups[normalizedPhone].push(contact)
      }
    })

    // 중복된 전화번호만 필터링
    const duplicatePhones = Object.keys(phoneGroups).filter((phone) => phoneGroups[phone].length > 1)

    let finalResults: Contact[] = []

    if (duplicatePhones.length === 0) {
      // 중복이 없는 경우 검색 결과 그대로 표시
      finalResults = results
    } else {
      // 중복된 전화번호를 가진 연락처만 표시
      duplicatePhones.forEach((phone) => {
        finalResults = [...finalResults, ...phoneGroups[phone]]
      })
    }

    setSearchResults(finalResults)
    setHasSearched(true)
    setSelectedRows([])
    setDefaultContact(null)
  }

  // 전화번호가 변경될 때마다 입력값 설정 및 검색 실행
  useEffect(() => {
    console.log("[디버깅] useEffect 실행됨, phoneNumber:", phoneNumber)
    
    // localStorage에서 전화번호 가져오기
    const storedPhone = localStorage.getItem('duplicateCheckPhone')
    const phoneToUse = phoneNumber || storedPhone
    
    if (phoneToUse) {
      // 탭 변경이 완료된 후 전화번호 처리
      setTimeout(() => {
        console.log("[디버깅] 탭 변경 완료 후 전화번호 처리 시작")
        setSearchTerm(phoneToUse)
        
        setTimeout(() => {
          console.log("[디버깅] 검색 실행 시작")
          handleSearch()
          localStorage.removeItem('duplicateCheckPhone')
          
          const searchInput = document.getElementById('phone-search')
          // 엔터 키 이벤트 시뮬레이션
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          })
          if (searchInput) {
            searchInput.dispatchEvent(enterEvent)
          }
          
          // 검색 버튼 클릭
          const searchButton = document.querySelector('[type="submit"]') as HTMLElement
          if (searchButton) {
            searchButton.click()
          }
        }, 1000)
      }, 200)
    }
  }, [phoneNumber])

  // 중복 정보 분석
  const duplicateInfo = useMemo(() => {
    if (searchResults.length === 0) return { totalDuplicates: 0, uniqueEmails: 0, uniqueMemos: 0 }

    // 전화번호별로 그룹화
    const phoneGroups: Record<string, Contact[]> = {}
    searchResults.forEach((contact) => {
      const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")
      if (normalizedPhone) {
        if (!phoneGroups[normalizedPhone]) {
          phoneGroups[normalizedPhone] = []
        }
        phoneGroups[normalizedPhone].push(contact)
      }
    })

    // 중복된 전화번호만 필터링
    const duplicatePhones = Object.keys(phoneGroups).filter((phone) => phoneGroups[phone].length > 1)

    if (duplicatePhones.length === 0) {
      return { totalDuplicates: 0, uniqueEmails: 0, uniqueMemos: 0 }
    }

    // 첫 번째 중복 전화번호에 대한 정보만 분석 (UI 단순화)
    const firstDuplicatePhone = duplicatePhones[0]
    const duplicateContacts = phoneGroups[firstDuplicatePhone]

    // 고유 이메일 및 메모 수 계산
    const uniqueEmails = new Set(duplicateContacts.map((c) => c.Email).filter(Boolean)).size
    const uniqueMemos = new Set(duplicateContacts.map((c) => c.Memo).filter(Boolean)).size

    return {
      totalDuplicates: duplicateContacts.length,
      uniqueEmails,
      uniqueMemos,
    }
  }, [searchResults])

  // 신속 처리 기능
  const handleQuickProcess = () => {
    if (searchResults.length === 0) {
      toast({
        title: "경고",
        description: "처리할 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    // 첫 번째 행을 기본값으로 설정
    if (searchResults.length > 0) {
      setDefaultContact(searchResults[0].ID)
    }

    // 조건부 체크박스 모두 선택
    setEmailCheckbox(true)
    setMemoCheckbox(true)

    // 자동으로 확인 버튼 클릭 (중복 제거 및 병합 처리)
    handleConfirm()
  }

  // 기본값으로 설정
  const handleSetAsDefault = () => {
    if (selectedRows.length === 0) {
      toast({
        title: "경고",
        description: "기본값으로 설정할 항목을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    if (selectedRows.length > 1) {
      toast({
        title: "경고",
        description: "기본값은 하나의 항목만 선택할 수 있습니다.",
        variant: "destructive",
      })
      return
    }

    setDefaultContact(selectedRows[0])

    toast({
      title: "성공",
      description: "선택된 항목이 기본값으로 설정되었습니다.",
    })
  }

  // 확인 버튼 (중복 제거 및 병합)
  const handleConfirm = () => {
    if (!defaultContact) {
      toast({
        title: "경고",
        description: "반드시 기본값을 설정해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      // 기본값으로 설정된 연락처 찾기
      const baseContact = searchResults.find((c) => c.ID === defaultContact)
      if (!baseContact) {
        toast({
          title: "에러",
          description: "기본값으로 설정된 데이터를 찾을 수 없습니다.",
          variant: "destructive",
        })
        return
      }

      // 기본값 연락처의 전화번호
      const basePhone = baseContact.Phone_Number.replace(/[^0-9]/g, "")

      // 같은 전화번호를 가진 연락처들
      const samePhoneContacts = searchResults.filter(
        (c) => c.Phone_Number.replace(/[^0-9]/g, "") === basePhone && c.ID !== baseContact.ID,
      )

      // 업데이트할 연락처 복사
      const updatedBaseContact = { ...baseContact }

      // 이메일 병합 처리
      if (emailCheckbox) {
        let emailCount = 2
        const baseEmail = updatedBaseContact.Email

        if (!baseEmail) {
          // 기본값 이메일이 비어있는 경우
          for (const contact of samePhoneContacts) {
            if (contact.Email) {
              if (emailCount === 2) {
                updatedBaseContact.Email = contact.Email
              } else {
                // 추가 이메일은 메모에 추가
                const emailNote = `추가 이메일${emailCount - 1}: ${contact.Email}`
                updatedBaseContact.Memo = updatedBaseContact.Memo
                  ? `${updatedBaseContact.Memo}\n${emailNote}`
                  : emailNote
              }
              emailCount++
            }
          }
        } else {
          // 기본값 이메일이 있는 경우
          for (const contact of samePhoneContacts) {
            if (contact.Email && contact.Email !== baseEmail) {
              // 추가 이메일은 메모에 추가
              const emailNote = `추가 이메일${emailCount - 1}: ${contact.Email}`
              updatedBaseContact.Memo = updatedBaseContact.Memo ? `${updatedBaseContact.Memo}\n${emailNote}` : emailNote
              emailCount++
            }
          }
        }
      }

      // 메모 병합 처리
      if (memoCheckbox) {
        let memoCount = 2
        const baseMemo = updatedBaseContact.Memo

        if (!baseMemo) {
          // 기본값 메모가 비어있는 경우
          for (const contact of samePhoneContacts) {
            if (contact.Memo) {
              if (memoCount === 2) {
                updatedBaseContact.Memo = contact.Memo
              } else {
                // 추가 메모 병합
                updatedBaseContact.Memo = updatedBaseContact.Memo
                  ? `${updatedBaseContact.Memo}\n추가 메모${memoCount - 1}: ${contact.Memo}`
                  : `추가 메모${memoCount - 1}: ${contact.Memo}`
              }
              memoCount++
            }
          }
        } else {
          // 기본값 메모가 있는 경우
          for (const contact of samePhoneContacts) {
            if (contact.Memo && contact.Memo !== baseMemo) {
              // 추가 메모 병합
              updatedBaseContact.Memo = `${updatedBaseContact.Memo}\n추가 메모${memoCount - 1}: ${contact.Memo}`
              memoCount++
            }
          }
        }
      }

      // 중복 항목 삭제 및 업데이트된 연락처 추가
      const updatedContacts = contacts
        .filter((contact) => {
          const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")
          return normalizedPhone !== basePhone || contact.ID === baseContact.ID
        })
        .map((contact) => {
          if (contact.ID === baseContact.ID) {
            return updatedBaseContact
          }
          return contact
        })

      // 연락처 업데이트
      setContacts(updatedContacts)

      // 검색 결과 초기화
      setSearchResults([])
      setHasSearched(false)
      setSelectedRows([])
      setDefaultContact(null)
      setEmailCheckbox(false)
      setMemoCheckbox(false)

      toast({
        title: "성공",
        description: "데이터가 성공적으로 병합되었습니다.",
      })
    } catch (error) {
      toast({
        title: "에러",
        description: `데이터 병합 중 오류가 발생했습니다: ${error}`,
        variant: "destructive",
      })
      console.error("데이터 병합 오류:", error)
    }
  }

  // 선택 삭제
  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) {
      toast({
        title: "경고",
        description: "삭제할 항목을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    // 선택된 연락처 삭제
    const updatedContacts = contacts.filter((contact) => !selectedRows.includes(contact.ID))
    setContacts(updatedContacts)

    // 검색 결과에서도 제거
    const updatedResults = searchResults.filter((contact) => !selectedRows.includes(contact.ID))
    setSearchResults(updatedResults)

    setSelectedRows([])

    toast({
      title: "성공",
      description: "선택된 항목이 삭제되었습니다.",
    })
  }

  // 수정 확인
  const handleAmendData = () => {
    toast({
      title: "성공",
      description: "데이터가 성공적으로 수정되었습니다.",
    })
  }

  // 체크박스 선택 처리
  const handleRowSelect = (contactId: string) => {
    setSelectedRows((prev) => {
      // 이미 선택된 경우 선택 해제
      if (prev.includes(contactId)) {
        return prev.filter((id) => id !== contactId)
      }
      // 새로 선택
      return [contactId]
    })
  }

  return (
    <div className="space-y-1">
      <Card className="p-1">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold">중복연락처 관리</h2>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Label htmlFor="phone-search" className="whitespace-nowrap">
            전화번호:
          </Label>
          <Input
            id="phone-search"
            placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-10 px-4 py-2 bg-green-500 hover:bg-green-600"
          >
            <Search className="h-4 w-4" />
            검색
          </Button>
          <Button onClick={handleQuickProcess} className="bg-blue-500 hover:bg-blue-600">
            신속
          </Button>

          {hasSearched && duplicateInfo.totalDuplicates > 0 && (
            <div className="px-3 py-1 bg-gray-100 rounded text-sm">
              중복 전화번호: 총 {duplicateInfo.totalDuplicates}개
              {duplicateInfo.uniqueEmails > 1 && ` / 이메일: ${duplicateInfo.uniqueEmails - 1}개 다름`}
              {duplicateInfo.uniqueMemos > 1 && ` / 메모: ${duplicateInfo.uniqueMemos - 1}개 다름`}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-450px)] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 50 }}>선택</TableHead>
                <TableHead style={{ width: 100 }}>그룹</TableHead>
                <TableHead style={{ width: 200 }}>대화창명</TableHead>
                <TableHead style={{ width: 100 }}>이름</TableHead>
                <TableHead style={{ width: 120 }}>전화번호</TableHead>
                <TableHead style={{ width: 200 }}>이메일</TableHead>
                <TableHead style={{ width: 300 }}>메모</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {hasSearched ? "검색된 연락처가 없습니다" : "전화번호를 검색하세요"}
                  </TableCell>
                </TableRow>
              ) : (
                searchResults.map((contact) => {
                  // 전화번호 정규화
                  const normalizedPhone = contact.Phone_Number.replace(/[^0-9]/g, "")

                  // 같은 전화번호를 가진 첫 번째 연락처 찾기
                  const firstContactWithSamePhone = searchResults.find(
                    (c) => c.Phone_Number.replace(/[^0-9]/g, "") === normalizedPhone,
                  )

                  // 이메일과 메모가 첫 번째 연락처와 다른지 확인
                  const isEmailDifferent =
                    firstContactWithSamePhone &&
                    contact.Email !== firstContactWithSamePhone.Email &&
                    contact.ID !== firstContactWithSamePhone.ID

                  const isMemoDifferent =
                    firstContactWithSamePhone &&
                    contact.Memo !== firstContactWithSamePhone.Memo &&
                    contact.ID !== firstContactWithSamePhone.ID

                  return (
                    <TableRow key={contact.ID}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(contact.ID)}
                          onCheckedChange={() => handleRowSelect(contact.ID)}
                        />
                      </TableCell>
                      <TableCell className={defaultContact === contact.ID ? "font-bold" : ""}>
                        {contact.Group} {defaultContact === contact.ID ? "(기본값)" : ""}
                      </TableCell>
                      <TableCell>{contact.Conversation}</TableCell>
                      <TableCell>{contact.Name}</TableCell>
                      <TableCell>{contact.Phone_Number}</TableCell>
                      <TableCell className={isEmailDifferent ? "bg-red-500 text-white" : "bg-yellow-100"}>
                        {contact.Email}
                      </TableCell>
                      <TableCell className={isMemoDifferent ? "bg-red-500 text-white" : "bg-yellow-100"}>
                        {contact.Memo}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">조건부 선택 체크</h3>

            <div className="flex items-center space-x-2">
              <Label className="flex-1">1. 총 이메일 {duplicateInfo.uniqueEmails}개</Label>
              <Checkbox
                id="email-checkbox"
                checked={emailCheckbox}
                onCheckedChange={(checked) => setEmailCheckbox(checked === true)}
                disabled={duplicateInfo.uniqueEmails <= 1}
              />
              <Label htmlFor="email-checkbox">기본값에 저장</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Label className="flex-1">2. 총 메모 {duplicateInfo.uniqueMemos}개</Label>
              <Checkbox
                id="memo-checkbox"
                checked={memoCheckbox}
                onCheckedChange={(checked) => setMemoCheckbox(checked === true)}
                disabled={duplicateInfo.uniqueMemos <= 1}
              />
              <Label htmlFor="memo-checkbox">기본값에 저장</Label>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSetAsDefault}>기본값으로 설정</Button>
            <Button onClick={handleConfirm}>확인</Button>
            <Button onClick={handleDeleteSelected} variant="destructive">
              선택 삭제
            </Button>
            <Button onClick={handleAmendData}>수정컨펌</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

