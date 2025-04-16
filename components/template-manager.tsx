"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { X } from "lucide-react"

interface Template {
  id: string
  title: string
  message: string
  fileType: "묶음" | "개별"
  files: string[]
}

interface TemplateManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateManager({ open, onOpenChange }: TemplateManagerProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useLocalStorage<Template[]>("message-templates", [])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [fileType, setFileType] = useState<"묶음" | "개별">("묶음")
  const [files, setFiles] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [focusedTemplateIndex, setFocusedTemplateIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  // 템플릿 데이터 초기화
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
  }, [open]) // 다이얼로그가 열릴 때마다 데이터 새로고침

  // 템플릿 선택 시 폼 업데이트
  useEffect(() => {
    if (selectedTemplate) {
      setTitle(selectedTemplate.title)
      setMessage(selectedTemplate.message)
      setFileType(selectedTemplate.fileType)
      setFiles(selectedTemplate.files)
      setIsEditing(true)
    } else {
      resetForm()
    }
  }, [selectedTemplate])

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
          handleSelectTemplate(template)
        }
        break
    }
  }

  // 포커스된 템플릿이 변경될 때 스크롤 조정
  useEffect(() => {
    if (focusedTemplateIndex !== null && tableRef.current) {
      const rows = tableRef.current.getElementsByTagName("tr")
      if (rows[focusedTemplateIndex + 1]) { // +1은 테이블 헤더를 고려
        rows[focusedTemplateIndex + 1].scrollIntoView({ block: "nearest" })
      }
    }
  }, [focusedTemplateIndex])

  const resetForm = () => {
    setTitle("")
    setMessage("")
    setFileType("묶음")
    setFiles([])
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handleSelectTemplate = (template: Template) => {
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null)
    } else {
      setSelectedTemplate(template)
    }
  }

  const handleAddNewTemplate = () => {
    if (!title.trim()) {
      toast({
        title: "오류",
        description: "템플릿 제목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: "오류",
        description: "메시지 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    const newTemplate: Template = {
      id: Date.now().toString(),
      title,
      message,
      fileType,
      files,
    }

    setTemplates([...templates, newTemplate])
    toast({
      title: "성공",
      description: "새 템플릿이 추가되었습니다.",
    })

    // 폼 초기화
    setTitle("")
    setMessage("")
    setFileType("묶음")
    setFiles([])
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handleAddTemplate = () => {
    if (!title.trim()) {
      toast({
        title: "오류",
        description: "템플릿 제목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: "오류",
        description: "메시지 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    const newTemplate: Template = {
      id: isEditing && selectedTemplate ? selectedTemplate.id : Date.now().toString(),
      title,
      message,
      fileType,
      files,
    }

    if (isEditing && selectedTemplate) {
      // 기존 템플릿 수정
      const updatedTemplates = templates.map((t) => (t.id === selectedTemplate.id ? newTemplate : t))
      setTemplates(updatedTemplates)
      toast({
        title: "성공",
        description: "템플릿이 수정되었습니다.",
      })
    } else {
      // 새 템플릿 추가
      setTemplates([...templates, newTemplate])
      toast({
        title: "성공",
        description: "새 템플릿이 추가되었습니다.",
      })
    }

    // 폼 초기화
    setTitle("")
    setMessage("")
    setFileType("묶음")
    setFiles([])
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) {
      toast({
        title: "알림",
        description: "삭제할 템플릿을 선택해주세요.",
      })
      return
    }

    setTemplates(templates.filter((t) => t.id !== selectedTemplate.id))
    resetForm()
    toast({
      title: "성공",
      description: "템플릿이 삭제되었습니다.",
    })
  }

  const handleInsertVariable = (variable: string) => {
    setMessage((prev) => prev + variable)
  }

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => file.name)

      // 파일 타입에 따른 제한 확인
      if (fileType === "묶음" && newFiles.length > 2) {
        toast({
          title: "경고",
          description: "묶음 모드에서는 최대 2개의 폴더만 선택할 수 있습니다.",
          variant: "destructive",
        })
        return
      }

      if (fileType === "개별" && newFiles.length > 10) {
        toast({
          title: "경고",
          description: "개별 모드에서는 최대 10개의 파일만 선택할 수 있습니다.",
          variant: "destructive",
        })
        return
      }

      setFiles(newFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => file.name)

      // 파일 타입에 따른 제한 확인
      if (fileType === "묶음" && newFiles.length > 2) {
        toast({
          title: "경고",
          description: "묶음 모드에서는 최대 2개의 폴더만 선택할 수 있습니다.",
          variant: "destructive",
        })
        return
      }

      if (fileType === "개별" && newFiles.length > 10) {
        toast({
          title: "경고",
          description: "개별 모드에서는 최대 10개의 파일만 선택할 수 있습니다.",
          variant: "destructive",
        })
        return
      }

      setFiles(newFiles)
    }
  }

  const handleDeleteFiles = () => {
    setFiles([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-lg">템플릿</DialogTitle>
          <DialogClose className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="p-0">
          {/* 상단 버튼 영역 */}
          <div className="flex space-x-2 p-2 bg-gray-50">
            <Button 
              variant="default" 
              size="sm" 
              className="bg-blue-500 hover:bg-blue-600 text-white" 
              onClick={handleAddNewTemplate}
            >
              템플릿 추가
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteTemplate}
            >
              템플릿 삭제
            </Button>
          </div>

          {/* 템플릿 목록 테이블 - 상단 */}
          <div className="border-t border-b">
            <ScrollArea className="h-[200px]">
              <Table ref={tableRef} onKeyDown={handleKeyDown} tabIndex={0}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">제목</TableHead>
                    <TableHead className="w-1/3">메시지</TableHead>
                    <TableHead className="w-1/6">사진종류</TableHead>
                    <TableHead className="w-1/4">파일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-2">
                        등록된 템플릿이 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template, index) => (
                      <TableRow
                        key={template.id}
                        className={`cursor-pointer ${
                          selectedTemplate?.id === template.id ? "bg-gray-100" : ""
                        } ${
                          focusedTemplateIndex === index ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => {
                          handleSelectTemplate(template)
                          setFocusedTemplateIndex(index)
                        }}
                      >
                        <TableCell className="truncate">{template.title}</TableCell>
                        <TableCell className="truncate">{template.message}</TableCell>
                        <TableCell>{template.fileType}</TableCell>
                        <TableCell className="truncate">{template.files.join(", ")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* 하단 편집 영역 - 두 열로 나누기 */}
          <div className="grid grid-cols-2 gap-4 p-4">
            {/* 왼쪽: 제목, 메시지 */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-sm font-medium">
                  제목
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="템플릿 제목을 입력하세요"
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="message" className="text-sm font-medium">
                  메시지
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="메시지 내용을 입력하세요"
                  className="min-h-[200px] border-gray-300"
                />
              </div>
            </div>

            {/* 오른쪽: 어태치 파일 */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">어태치 파일</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={fileType === "묶음" ? "default" : "outline"}
                    className={fileType === "묶음" ? "bg-blue-500 hover:bg-blue-600 text-white w-full" : "w-full"}
                    onClick={() => setFileType("묶음")}
                  >
                    묶음
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={fileType === "개별" ? "default" : "outline"}
                    className={fileType === "개별" ? "bg-blue-500 hover:bg-blue-600 text-white w-full" : "w-full"}
                    onClick={() => setFileType("개별")}
                  >
                    개별
                  </Button>
                </div>

                <div
                  className={`border-2 border-dashed rounded-md p-4 min-h-[200px] flex items-center justify-center ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple={fileType === "개별"}
                    className="hidden"
                  />
                  <div className="text-center text-gray-500">
                    {files.length > 0 ? (
                      <ul className="list-disc list-inside text-left">
                        {files.map((file, index) => (
                          <li key={index}>{file}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        이미지 파일을 이곳에 끌어다 놓으세요.{" "}
                        {fileType === "묶음" ? "(최대 2개 폴더, 폴더당 최대 30개 이미지)" : "(최대 10개 이미지)"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                    onClick={handleFileUpload}
                  >
                    등록
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full text-gray-700 border-gray-300"
                    onClick={handleDeleteFiles}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 최하단: 변수 버튼 영역과 등록 버튼 */}
          <div className="p-4 pt-0 space-y-3">
            {/* 변수 버튼 영역 */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                onClick={() => handleInsertVariable("{{이름}}")}
              >
                이름
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                onClick={() => handleInsertVariable("{{정의1}}")}
              >
                정의1
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                onClick={() => handleInsertVariable("{{정의2}}")}
              >
                정의2
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                onClick={() => handleInsertVariable("{{정의3}}")}
              >
                정의3
              </Button>
            </div>

            {/* 등록/수정 버튼 */}
            <div className="flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="default"
                className="bg-blue-500 hover:bg-blue-600 text-white w-1/3"
                onClick={handleAddTemplate}
              >
                {isEditing ? "수정" : "등록"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

