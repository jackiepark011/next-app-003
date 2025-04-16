"use client"
//  적용 
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { TemplateManager } from "@/components/template-manager"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Send, X, Trash2, Edit, History, Loader2 } from "lucide-react"
import type { Contact } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { EditContactDialog } from "@/components/edit-contact-dialog"
import { PhoneNumberManager } from './PhoneNumberManager'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { AligoClient } from '@/lib/api/aligo-client';

interface Template {
  id: string
  title: string
  message: string
  fileType: "묶음" | "개별"
  files: string[]
}

interface SenderContact extends Contact {
  messageContent?: string
  fileType?: "묶음" | "개별"
  files?: string[]
  isConfigured?: boolean
}

export function MessageSender({ contacts }: { contacts: Contact[] }) {
  const { toast } = useToast()
  const [templates, setTemplates] = useLocalStorage<Template[]>("message-templates", [])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [fileType, setFileType] = useState<"묶음" | "개별">("묶음")
  const [files, setFiles] = useState<string[]>([])
  const [senderContacts, setSenderContacts] = useState<SenderContact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)  // 선택된 행의 ID (하나만 가능)
  const [sendDelay, setSendDelay] = useState([5, 10])
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [focusedTemplateIndex, setFocusedTemplateIndex] = useState<number | null>(null)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateTitle, setTemplateTitle] = useState("")
  const [editingContact, setEditingContact] = useState<SenderContact | null>(null)
  const [showPhoneNumberManager, setShowPhoneNumberManager] = useState(false)
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('')
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['010-9114-7875'])
  const [entries, setEntries] = useState<{ phone: string }[]>([])
  const [sendMethod, setSendMethod] = useState<'문자' | '카톡'>('문자')
  const [sendTime, setSendTime] = useState<'즉시' | '예약'>('즉시')
  const [reservationDate, setReservationDate] = useState<Date | null>(null)
  const [reservationTime, setReservationTime] = useState<string>('')
  const [showResultModal, setShowResultModal] = useState(false)
  const [sendResult, setSendResult] = useState<{
    success: number
    error: number
    message: string
  } | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressStep, setProgressStep] = useState<{
    step: number
    message: string
  } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [apiClient] = useState(() => new AligoClient())
  const [showJsonDialog, setShowJsonDialog] = useState(false)
  const [jsonData, setJsonData] = useState("")

  // 초기화: 발송 대상 목록은 비어 있음
  // 주소록에서 "발송" 버튼 클릭 시에만 데이터를 받아옴
  useEffect(() => {
    // localStorage에서 선택된 연락처 ID를 가져옵니다
    const selectedContactIds = localStorage.getItem("selected-contacts-for-message")
    if (selectedContactIds) {
      try {
        const contactIds = JSON.parse(selectedContactIds)
        // 선택된 연락처들을 찾습니다
        const selectedContacts = contacts.filter((c) => contactIds.includes(c.ID))
        
        if (selectedContacts.length > 0) {
          // 메시지 입력창 초기화
          setMessage("")
          setFiles([])
          setSelectedTemplateId(null)
          
          // 선택된 연락처들을 발송 대상 목록에 추가합니다
          const senderContacts: SenderContact[] = selectedContacts.map((contact) => ({
            ...contact,
            messageContent: "",
            fileType: "묶음",
            files: [],
            isConfigured: false,
          }))

          // 발송 대상 목록을 업데이트합니다
          setSenderContacts(senderContacts)

          // 선택된 연락처를 selectedContacts 배열에 추가합니다
          setSelectedContacts(contactIds)

          // localStorage에서 선택된 연락처 정보를 삭제합니다
          localStorage.removeItem("selected-contacts-for-message")

          toast({
            title: "연락처 추가됨",
            description: `${selectedContacts.length}명이 발송 대상에 추가되었습니다.`,
          })
        }
      } catch (error) {
        console.error("선택된 연락처 데이터 파싱 오류:", error)
      }
    }
  }, [contacts, toast])

  // 템플릿 매니저에서 저장된 템플릿 목록을 가져옵니다
  useEffect(() => {
    const savedTemplates = localStorage.getItem("message-templates")
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates)
        if (Array.isArray(parsedTemplates)) {
          setTemplates(parsedTemplates)
        }
      } catch (error) {
        console.error("템플릿 데이터 파싱 오류:", error)
      }
    }
  }, [])

  // 템플릿 선택 시 내용 로드
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        setMessage(template.message)
        setFileType(template.fileType)
        setFiles(template.files)
      }
    }
  }, [selectedTemplateId, templates])

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (templates.length === 0) return

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        setFocusedTemplateIndex((prev) => {
          if (prev === null || prev === 0) {
            return templates.length - 1
          }
          return prev - 1
        })
        break
      case "ArrowDown":
        e.preventDefault()
        setFocusedTemplateIndex((prev) => {
          if (prev === null || prev === templates.length - 1) {
            return 0
          }
          return prev + 1
        })
        break
      case "Enter":
        if (focusedTemplateIndex !== null) {
          const template = templates[focusedTemplateIndex]
          setSelectedTemplateId(template.id)
        }
        break
    }
  }

  // 포커스된 템플릿이 변경될 때 선택된 템플릿 ID 업데이트
  useEffect(() => {
    if (focusedTemplateIndex !== null) {
      const template = templates[focusedTemplateIndex]
      setSelectedTemplateId(template.id)
    }
  }, [focusedTemplateIndex, templates])

  // 체크박스 전체 선택/해제 처리
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedContacts(senderContacts.map((c) => c.ID))
    } else {
      setSelectedContacts([])
    }
  }

  // 개별 체크박스 처리
  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts((prev) => [...prev, contactId])
    } else {
      setSelectedContacts((prev) => prev.filter((id) => id !== contactId))
    }
  }

  // 행 선택 처리 (하나만 가능)
  const handleRowClick = (contact: SenderContact) => {
    // 이전에 선택된 행과 같은 행을 클릭한 경우 선택 해제
    if (selectedRow === contact.ID) {
      setSelectedRow(null)
      setMessage("")
      setFileType("묶음")
      setFiles([])
      return
    }

    // 새로운 행 선택
    setSelectedRow(contact.ID)
    
    // 메시지 내용 설정
    setMessage(contact.messageContent || "")
    // 파일 타입 설정
    setFileType(contact.fileType || "묶음")
    // 파일 목록 설정
    setFiles(contact.files || [])
  }

  const handleInsertVariable = (variable: string) => {
    setMessage((prev) => prev + variable)
  }

  const handleFileUpload = () => {
    // 실제 구현에서는 파일 업로드 로직 구현
    // 여기서는 예시로 가상의 파일 경로를 추가
    const newFile = `/uploads/file_${Date.now()}.jpg`
    setFiles((prev) => [...prev, newFile])
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveTemplate = () => {
    if (!message.trim()) {
      toast({
        title: "오류",
        description: "저장할 메시지 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setShowSaveTemplateDialog(true)
  }

  const handleSaveTemplateConfirm = () => {
    if (!templateTitle.trim()) {
      toast({
        title: "오류",
        description: "템플릿 제목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    const newTemplate: Template = {
      id: Date.now().toString(),
      title: templateTitle,
      message,
      fileType,
      files,
    }

    // localStorage에 템플릿 저장
    const updatedTemplates = [...templates, newTemplate]
    setTemplates(updatedTemplates)
    setShowSaveTemplateDialog(false)
    setTemplateTitle("")

    toast({
      title: "성공",
      description: "템플릿이 저장되었습니다.",
    })
  }

  const handleOpenTemplate = () => {
    setShowTemplateManager(true)
  }

  const handleClearMessage = () => {
    setMessage("")
    setFiles([])
    setSelectedTemplateId(null)
  }

  const replaceMessageVariables = (messageTemplate: string, contact: Contact): string => {
    return messageTemplate
      .replace(/{{이름}}/g, contact.Name || "")
      .replace(/{{정의1}}/g, contact.Definition1 || "")
      .replace(/{{정의2}}/g, contact.Definition2 || "")
      .replace(/{{정의3}}/g, contact.Definition3 || "")
  }

  const handleApplyTemplate = () => {
    if (!message.trim()) {
      toast({
        title: "오류",
        description: "적용할 메시지 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "오류",
        description: "메시지를 적용할 연락처를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    const updatedContacts = senderContacts.map((contact) => {
      if (selectedContacts.includes(contact.ID)) {
        return {
          ...contact,
          messageContent: replaceMessageVariables(message, contact),
          fileType,
          files,
          isConfigured: true,  // 적용 시 세팅 상태를 완료로 변경
        }
      }
      return contact
    })

    setSenderContacts(updatedContacts)

    toast({
      title: "성공",
      description: `${selectedContacts.length}개 연락처에 메시지가 적용되었습니다.`,
    })
  }

  // 발송 완료 후 Start_Or 필드 업데이트
  const handleStartSending = async () => {
    if (!apiClient) return;

    const configuredContacts = senderContacts.filter(
      (contact) => selectedContacts.includes(contact.ID) && contact.isConfigured,
    );

    if (configuredContacts.length === 0) {
      toast({
        title: "오류",
        description: "발송할 설정된 연락처가 없습니다. 먼저 템플릿을 적용해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (sendMethod === '카톡') {
      // 카톡 발송 시 단계별 확인
      if (!window.confirm('1단계: 카카오톡 메시지 발송을 시작합니다. 계속하시겠습니까?')) {
        return
      }

      if (!window.confirm(`2단계: ${configuredContacts.length}개의 연락처가 선택되었습니다. 발송대상 목록을 확인하시겠습니까?`)) {
        return
      }

      try {
        // 3단계: 발송대상 목록을 JSON 파일로 저장
        const response = await fetch('/api/save-sender-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            senderList: configuredContacts
          }),
        });

        const result = await response.json();

        if (result.success) {
          setJsonData(JSON.stringify(configuredContacts, null, 2))
          setShowJsonDialog(true)
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        toast({
          title: "오류",
          description: error instanceof Error ? error.message : "발송대상 목록 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
      return
    }

    // 문자 발송 시 바로 진행
    setIsSending(true);
    setShowProgressModal(true);

    try {
      setProgressStep({
        step: 1,
        message: "파라미터 설정을 진행중입니다...",
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      let result;
      if (configuredContacts.length === 1) {
        const params = {
          receiver: configuredContacts[0].Phone_Number,
          msg: configuredContacts[0].messageContent || message,
          msg_type: message.length <= 90 ? 'SMS' as const : 'LMS' as const,
          title: message.length > 90 ? '알림' : undefined,
        };

        result = await apiClient.sendSMS(params);
      } else {
        const contacts = configuredContacts.map(contact => ({
          phone: contact.Phone_Number,
          message: contact.messageContent || message,
        }));

        const params = {
          contacts,
          msg_type: message.length <= 90 ? 'SMS' as const : 'LMS' as const,
          title: message.length > 90 ? '알림' : undefined,
          rdate: sendTime === '예약' ? format(reservationDate || new Date(), 'yyyyMMdd') : undefined,
          rtime: sendTime === '예약' ? (reservationTime || '0000').replace(':', '') : undefined,
        };

        result = await apiClient.sendBulkSMS(params);
      }
      
      if (result.result_code > 0) {
        setSendResult({
          success: result.success_cnt,
          error: result.error_cnt,
          message: result.message || '발송이 완료되었습니다.',
        });
        setShowResultModal(true);
      } else {
        throw new Error(result.message);
      }

      setProgressStep({
        step: 4,
        message: "상태를 업데이트중입니다...",
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedContacts = senderContacts.map((contact) => {
        if (selectedContacts.includes(contact.ID) && contact.isConfigured) {
          return {
            ...contact,
            Start_Or: "발송완료",
          };
        }
        return contact;
      });

      setSenderContacts(updatedContacts);

    } catch (error) {
      toast({
        title: "발송 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setShowProgressModal(false);
      setProgressStep(null);
    }
  };

  const handleJsonDialogSend = async () => {
    const configuredContacts = senderContacts.filter(
      (contact) => selectedContacts.includes(contact.ID) && contact.isConfigured,
    );

 

    setIsSending(true);

    try {
      // 카톡 전송
      // TODO: 카톡 API 연동

      const updatedContacts = senderContacts.map((contact) => {
        if (selectedContacts.includes(contact.ID) && contact.isConfigured) {
          return {
            ...contact,
            Start_Or: "발송완료",
          };
        }
        return contact;
      });

      setSenderContacts(updatedContacts);

    } catch (error) {
      toast({
        title: "발송 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setShowJsonDialog(false);
    }
  };

  const handleClearAllData = () => {
    // 선택된 연락처 초기화
    setSelectedContacts([])
    setSelectAll(false)

    // 메시지 내용 초기화
    setMessage("")
    setFiles([])
    setSelectedTemplateId(null)

    // 발송 대상 데이터 초기화
    setSenderContacts([])

    // localStorage에서 선택된 연락처 정보 삭제
    localStorage.removeItem("selected-contacts-for-message")

    toast({
      title: "초기화 완료",
      description: "모든 메시지 전송 데이터가 초기화되었습니다.",
    })
  }

  // 연락처 추가 함수
  const handleAddContact = (contactId: string) => {
    // 이미 발송 대상 목록에 있는지 확인
    if (senderContacts.some((c) => c.ID === contactId)) {
      toast({
        title: "알림",
        description: "이미 발송 대상 목록에 있는 연락처입니다.",
      })
      return
    }

    // 연락처 찾기
    const contact = contacts.find((c) => c.ID === contactId)
    if (!contact) return

    // 발송 대상 목록에 추가
    const senderContact: SenderContact = {
      ...contact,
      messageContent: "",
      fileType: "묶음",
      files: [],
      isConfigured: false,
    }

    setSenderContacts((prev) => [...prev, senderContact])
    setSelectedContacts((prev) => [...prev, contactId])

    toast({
      title: "연락처 추가됨",
      description: `${contact.Name}님이 발송 대상에 추가되었습니다.`,
    })
  }

  const handleEditContact = (contact: SenderContact) => {
    setEditingContact(contact)
  }

  const handleSaveContact = (updatedContact: SenderContact) => {
    const updatedContacts = senderContacts.map(contact =>
      contact.ID === updatedContact.ID ? updatedContact : contact
    )
    setSenderContacts(updatedContacts)
    setEditingContact(null)
  }

  const handlePhoneNumberSelect = (phoneNumber: string) => {
    setSelectedPhoneNumber(phoneNumber);
    setShowPhoneNumberManager(false);
  };

  useEffect(() => {
    // 발신번호 관리에서 전화번호 목록을 가져옵니다
    setPhoneNumbers(entries.map(entry => entry.phone));
  }, [entries]);

  const handleViewResults = () => {
    window.open('/sent-results', '_blank');
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-1 h-[80vh]">
      {/* 왼쪽 패널: 메시지 작성 */}
      <Card className="p-1 md:col-span-1 flex flex-col">
        <div className="font-medium mb-1">메시지 및 파일 입력</div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleClearMessage} className="w-full">
            메시지 작성
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenTemplate} className="w-full">
            템플릿 열기
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveTemplate} className="w-full">
            템플릿 저장
          </Button>
        </div>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력해 주세요"
          className="min-h-[200px] mb-4"
        />

        {sendMethod === '문자' && (
          <div className="flex justify-between items-center mb-2">
            <span>{message.length} / {message.length <= 90 ? '90byte' : '2000byte'}</span>
            <Button variant="outline" size="sm" className="w-20 text-pink-500 border-pink-500">
              {files.length > 0 ? '그림' : (message.length <= 90 ? '단문' : '장문')}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => handleInsertVariable("{{이름}}")}>
            이름
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={() => handleInsertVariable("{{정의1}}")}>
            정의1
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={() => handleInsertVariable("{{정의2}}")}>
            정의2
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={() => handleInsertVariable("{{정의3}}")}>
            정의3
          </Button>
        </div>

        <div className="mb-4">
          <Label className="font-medium mb-2 block">파일 등록</Label>
          <ToggleGroup
            type="single"
            value={fileType}
            onValueChange={(value) => {
              if (value) setFileType(value as "묶음" | "개별")
            }}
            className="mb-2 w-full grid grid-cols-2"
          >
            <ToggleGroupItem value="묶음" className="w-full">
              묶음
            </ToggleGroupItem>
            <ToggleGroupItem value="개별" className="w-full">
              개별
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="border rounded-md p-2 min-h-[120px] mb-2">
            {files.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">첨부된 파일이 없습니다</div>
            ) : (
              <ul className="space-y-1">
                {files.slice(0, 3).map((file, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="truncate">{file.split("/").pop()}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1" onClick={handleFileUpload}>
              등록
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setFiles([])}>
              삭제
            </Button>
          </div>
        </div>

        <div className="mt-auto">
          <Label className="font-medium mb-2 block">템플릿 목록</Label>
          <ScrollArea 
            className="h-[100px] border rounded-md p-2"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {templates.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">저장된 템플릿이 없습니다</div>
            ) : (
              <div className="space-y-1">
                {templates.map((template, index) => (
                  <div
                    key={template.id}
                    className={`p-2 rounded cursor-pointer hover:bg-muted ${
                      selectedTemplateId === template.id ? "bg-muted" : ""
                    } ${
                      focusedTemplateIndex === index ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedTemplateId(template.id)
                      setFocusedTemplateIndex(index)
                    }}
                  >
                    <div className="font-medium">{template.title}</div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Button className="w-full mt-2" onClick={handleApplyTemplate}>
            적용
          </Button>
        </div>
      </Card>

      {/* 오른쪽 패널: 발송 대상 */}
      <Card className="p-4 md:col-span-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="font-medium">
            발송대상 (선택: {selectedContacts.length}명 / 전체: {senderContacts.length}명)
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label>전송방법</Label>
              <div className="flex items-center space-x-2">
                <Button variant={sendMethod === '문자' ? 'default' : 'outline'} onClick={() => setSendMethod('문자')} className="bg-teal-500 text-white">문자</Button>
                <Button variant={sendMethod === '카톡' ? 'default' : 'outline'} onClick={() => setSendMethod('카톡')}>카톡</Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label>발신번호</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center bg-gray-100 px-2 py-1 rounded cursor-pointer">
                    <span className="text-blue-600">{selectedPhoneNumber || '010-9114-7875'}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {phoneNumbers.map((number, index) => (
                    <DropdownMenuItem key={index} onSelect={() => setSelectedPhoneNumber(number)}>
                      {number}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="ml-2" onClick={() => setShowPhoneNumberManager(true)}>번호등록</Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  />
                </TableHead>
                <TableHead>카톡대화명</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>메시지내용</TableHead>
                <TableHead>첨부타입</TableHead>
                <TableHead>첨부파일</TableHead>
                <TableHead>세팅</TableHead>
                <TableHead className="w-[100px]">편집</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senderContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    발송 대상이 없습니다. 주소록에서 "발송" 버튼을 클릭하여 연락처를 추가하세요.
                  </TableCell>
                </TableRow>
              ) : (
                senderContacts.map((contact) => (
                  <TableRow 
                    key={contact.ID}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedRow === contact.ID ? "bg-muted" : ""
                    }`}
                    onClick={() => handleRowClick(contact)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedContacts.includes(contact.ID)}
                        onCheckedChange={(checked) => handleSelectContact(contact.ID, checked === true)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {selectedRow === contact.ID && (
                          <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                        )}
                        {contact.Conversation}
                      </div>
                    </TableCell>
                    <TableCell>{contact.Phone_Number}</TableCell>
                    <TableCell className="max-w-[150px]">
                      <div className="truncate">{contact.messageContent || "-"}</div>
                    </TableCell>
                    <TableCell>{contact.fileType || "-"}</TableCell>
                    <TableCell className="max-w-[150px]">
                      <div className="truncate">
                        {contact.files && contact.files.length > 0
                          ? contact.files.map((f) => f.split("/").pop()).join(", ")
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-center ${contact.isConfigured ? "text-blue-500" : "text-red-500"}`}>
                        {contact.isConfigured ? "완료" : "미완료"}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditContact(contact)}
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <Label>전송시간</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={sendTime === '즉시' ? 'default' : 'outline'} 
                  onClick={() => setSendTime('즉시')}
                  className="bg-teal-500 text-white"
                >
                  즉시
                </Button>
                <Button 
                  variant={sendTime === '예약' ? 'default' : 'outline'} 
                  onClick={() => {
                    setSendTime('예약');
                    document.getElementById('calendar-trigger')?.click();
                  }}
                  disabled={sendMethod === '카톡'}
                  className={sendMethod === '카톡' ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  예약
                </Button>
                {sendTime === '예약' && sendMethod !== '카톡' && (
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="calendar-trigger"
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !reservationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reservationDate ? format(reservationDate, "yyyy-MM-dd") : "날짜 선택"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={reservationDate || undefined}
                          onSelect={(date) => {
                            setReservationDate(date || null);
                            if (date) {
                              const timeInput = document.getElementById('time-input') as HTMLInputElement;
                              if (timeInput) {
                                timeInput.focus();
                                timeInput.showPicker();
                              }
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Input
                      id="time-input"
                      type="time"
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewResults}
                className="flex items-center"
              >
                <History className="h-4 w-4 mr-1" />
                발송결과보기
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAllData} 
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                데이터 초기화
              </Button>
            </div>
          </div>

          <Button
            className="w-full h-16 text-lg font-bold"
            onClick={handleStartSending}
            disabled={senderContacts.length === 0 || selectedContacts.length === 0}
          >
            <Send className="mr-2 h-5 w-5" />
            시작하기
          </Button>
        </div>
      </Card>

      {/* 템플릿 관리자 다이얼로그 */}
      <TemplateManager open={showTemplateManager} onOpenChange={setShowTemplateManager} />

      {/* 템플릿 저장 다이얼로그 */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>템플릿 저장</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-title">템플릿 제목</Label>
              <Input
                id="template-title"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="템플릿 제목을 입력하세요"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSaveTemplateConfirm}>저장</Button>
          </div>
        </DialogContent>
      </Dialog>

      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          onSave={handleSaveContact}
        />
      )}

      <PhoneNumberManager open={showPhoneNumberManager} onOpenChange={setShowPhoneNumberManager} onSelect={handlePhoneNumberSelect} onEntriesChange={setEntries} />

      {/* 진행 상태 모달 */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>메시지 발송 진행중</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {progressStep && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">진행 단계</div>
                    <div className="text-2xl font-bold text-blue-600">[{progressStep.step}/4]</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {progressStep.message}
                </div>
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 발송 결과 모달 */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>발송 결과</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {sendResult && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">성공</div>
                    <div className="text-2xl font-bold text-green-600">{sendResult.success}건</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">실패</div>
                    <div className="text-2xl font-bold text-red-600">{sendResult.error}건</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {sendResult.message}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowResultModal(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 발송 결과 모달 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>발송 결과</DialogTitle>
          </DialogHeader>
          {/* MessageHistory component will be rendered here */}
        </DialogContent>
      </Dialog>

      {/* 발송대상 JSON 모달 */}
      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>3단계: 발송대상 목록 확인</DialogTitle>
            <DialogDescription>
              선택된 {selectedContacts.length}개의 연락처가 발송대상으로 선택되었습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto my-4 bg-gray-100 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">
              {jsonData}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJsonDialog(false)}>
              닫기
            </Button>
            <Button onClick={handleJsonDialogSend}>
              발송하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


