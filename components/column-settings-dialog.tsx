"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ColumnSetting {
  id: string
  name: string
  width: number
  visible: boolean
}

interface ColumnSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnSetting[]
  onSave: (columns: ColumnSetting[]) => void
}

export function ColumnSettingsDialog({ open, onOpenChange, columns, onSave }: ColumnSettingsDialogProps) {
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>(columns)

  useEffect(() => {
    setColumnSettings(columns)
  }, [columns])

  const handleToggleVisibility = (id: string, checked: boolean) => {
    setColumnSettings((prev) => prev.map((col) => (col.id === id ? { ...col, visible: checked } : col)))
  }

  const handleWidthChange = (id: string, width: string) => {
    const numWidth = Number.parseInt(width, 10)
    if (!isNaN(numWidth) && numWidth > 0) {
      setColumnSettings((prev) => prev.map((col) => (col.id === id ? { ...col, width: numWidth } : col)))
    }
  }

  const handleSubmit = () => {
    onSave(columnSettings)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>열 설정</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-12 font-medium mb-2 px-4">
              <div className="col-span-6">컬럼명</div>
              <div className="col-span-3 text-center">표시</div>
              <div className="col-span-3 text-center">너비 (px)</div>
            </div>
            {columnSettings.map((column) => (
              <div key={column.id} className="grid grid-cols-12 items-center gap-4 px-4 py-2 border-b">
                <Label htmlFor={`col-${column.id}`} className="col-span-6">
                  {column.name}
                </Label>
                <div className="col-span-3 flex justify-center">
                  <Checkbox
                    id={`col-${column.id}`}
                    checked={column.visible}
                    onCheckedChange={(checked) => handleToggleVisibility(column.id, checked === true)}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="20"
                    value={column.width}
                    onChange={(e) => handleWidthChange(column.id, e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

