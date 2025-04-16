import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CombinedSmsItem } from "@/app/api/sms/services/sms"

interface SmsDetailsExpandProps {
  sms: CombinedSmsItem
}

export function SmsDetailsExpand({ sms }: SmsDetailsExpandProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-md mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>수신번호</TableHead>
            <TableHead>전송상태</TableHead>
            <TableHead>전송일시</TableHead>
            <TableHead>예약일시</TableHead>
            <TableHead>메시지 상세ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{sms.detail?.receiver || '-'}</TableCell>
            <TableCell>{sms.detail?.sms_state || '-'}</TableCell>
            <TableCell>
              {sms.detail?.send_date 
                ? format(new Date(sms.detail.send_date), "yyyy.MM.dd HH:mm", { locale: ko })
                : '-'}
            </TableCell>
            <TableCell>
              {sms.detail?.reserve_date 
                ? format(new Date(sms.detail.reserve_date), "yyyy.MM.dd HH:mm", { locale: ko })
                : '-'}
            </TableCell>
            <TableCell>{sms.detail?.mdid || '-'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
} 