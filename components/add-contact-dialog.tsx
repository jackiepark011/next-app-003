"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Contact } from "@/lib/types"

interface AddContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddContact: (contact: Omit<Contact, "ID">) => void
  groups: string[]
  selectedGroup?: string
}

export function AddContactDialog({ open, onOpenChange, onAddContact, groups, selectedGroup }: AddContactDialogProps) {
  const [formData, setFormData] = useState<Omit<Contact, "ID">>({
    Group: selectedGroup || (groups.length > 0 ? groups[0] : ""),
    Check: true,
    Conversation: "",
    Name: "",
    Phone_Number: "",
    Email: "",
    Definition1: "",
    Definition2: "",
    Definition3: "",
    Memo: "",
    Start_Or: "",
    Whether_Or: "",
    Checklist: "",
    Dialogue_Name: "",
    Change_Name: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddContact(formData)
    setFormData({
      Group: selectedGroup || (groups.length > 0 ? groups[0] : ""),
      Check: true,
      Conversation: "",
      Name: "",
      Phone_Number: "",
      Email: "",
      Definition1: "",
      Definition2: "",
      Definition3: "",
      Memo: "",
      Start_Or: "",
      Whether_Or: "",
      Checklist: "",
      Dialogue_Name: "",
      Change_Name: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 연락처 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Name" className="text-right">
                이름
              </Label>
              <Input
                id="Name"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Conversation" className="text-right">
                대화명
              </Label>
              <Input
                id="Conversation"
                name="Conversation"
                value={formData.Conversation}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Phone_Number" className="text-right">
                전화번호
              </Label>
              <Input
                id="Phone_Number"
                name="Phone_Number"
                value={formData.Phone_Number}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Email" className="text-right">
                이메일
              </Label>
              <Input
                id="Email"
                name="Email"
                type="email"
                value={formData.Email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Group" className="text-right">
                그룹
              </Label>
              <Select value={formData.Group} onValueChange={(value) => handleSelectChange("Group", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="그룹 선택" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Memo" className="text-right">
                메모
              </Label>
              <Textarea
                id="Memo"
                name="Memo"
                value={formData.Memo}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Definition1" className="text-right">
                정의 1
              </Label>
              <Input
                id="Definition1"
                name="Definition1"
                value={formData.Definition1}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Definition2" className="text-right">
                정의 2
              </Label>
              <Input
                id="Definition2"
                name="Definition2"
                value={formData.Definition2}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Definition3" className="text-right">
                정의 3
              </Label>
              <Input
                id="Definition3"
                name="Definition3"
                value={formData.Definition3}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Dialogue_Name" className="text-right">
                카톡대화명
              </Label>
              <Input
                id="Dialogue_Name"
                name="Dialogue_Name"
                value={formData.Dialogue_Name}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Change_Name" className="text-right">
                변경대화명
              </Label>
              <Input
                id="Change_Name"
                name="Change_Name"
                value={formData.Change_Name}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Start_Or" className="text-right">
                시작여부
              </Label>
              <Input
                id="Start_Or"
                name="Start_Or"
                value={formData.Start_Or}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Whether_Or" className="text-right">
                종업여부
              </Label>
              <Input
                id="Whether_Or"
                name="Whether_Or"
                value={formData.Whether_Or}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Checklist" className="text-right">
                체크리스트확인
              </Label>
              <Input
                id="Checklist"
                name="Checklist"
                value={formData.Checklist}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">연락처 추가</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

