import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export function MessageModal({ isOpen, onClose, message }: MessageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>메시지 내용</DialogTitle>
        </DialogHeader>
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <pre className="whitespace-pre-wrap text-sm">{message}</pre>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 