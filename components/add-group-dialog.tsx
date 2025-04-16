"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddGroup: (groupName: string) => void
}

export function AddGroupDialog({ open, onOpenChange, onAddGroup }: AddGroupDialogProps) {
  const [groupName, setGroupName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (groupName.trim()) {
      onAddGroup(groupName.trim())
      setGroupName("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 그룹 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="groupName" className="text-right">
                그룹 이름
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">그룹 추가</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

