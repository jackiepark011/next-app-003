"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp } from "lucide-react"
import { CustomDateRangePicker } from "./custom-date-range-picker"
import { getSmsHistory, getSmsDetail, CombinedSmsItem, SmsHistoryItem, SmsDetailItem } from "@/app/api/sms/services/sms"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { MessageModal } from "@/components/ui/message-modal"
import React from "react"

export default function SendingResultsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [messageType, setMessageType] = useState<'all' | 'SMS' | 'LMS' | 'MMS'>('all')
  const [viewTab, setViewTab] = useState<'all' | 'kakao' | 'email'>('all')
  const [sortDirection, setSortDirection] = useState<{
    [key: string]: "asc" | "desc" | null
  }>({
    sendTime: null,
    sendNumber: null,
    recipient: null,
    messageType: null,
    sendingTime: null,
  })
  const [smsList, setSmsList] = useState<CombinedSmsItem[]>([])
  const [filteredSmsList, setFilteredSmsList] = useState<CombinedSmsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedDetails, setExpandedDetails] = useState<{
    [key: string]: SmsDetailItem[];
  }>({});
  const [totalCount, setTotalCount] = useState(0)
  const [searchType, setSearchType] = useState<'all' | 'content' | 'recipient'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [kakaoHistory, setKakaoHistory] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStartDate(new Date("2025-01-12"))
      setEndDate(new Date("2025-04-11"))
    }
  }, [])

  const fetchSmsList = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('API 호출 파라미터:', {
        page: "1",
        page_size: "500",
        start_date: startDate ? format(startDate, "yyyyMMdd") : undefined,
        limit_day: endDate ? format(endDate, "yyyyMMdd") : undefined,
      })
      
      // 1. 전송내역 조회
      const historyResponse = await getSmsHistory({
        page: "1",
        page_size: "500",
        start_date: startDate ? format(startDate, "yyyyMMdd") : undefined,
        limit_day: endDate ? format(endDate, "yyyyMMdd") : undefined,
      })

      console.log('API 응답:', historyResponse)

      if (historyResponse.result_code > 0 && historyResponse.list.length > 0) {
        setTotalCount(historyResponse.total_count || 0)
        console.log('전체 건수:', historyResponse.total_count)
        
        // 2. 각 메시지의 상세 정보 조회
        const detailPromises = historyResponse.list.map(async (sms: SmsHistoryItem) => {
          try {
            const detailResponse = await getSmsDetail(sms.mid)
            const combinedItem: CombinedSmsItem = {
              ...sms,
              detail: detailResponse.result_code > 0 ? detailResponse.list[0] : undefined
            }
            
            // 상세 정보가 2개 이상인 경우 저장
            if (detailResponse.result_code > 0 && detailResponse.list.length > 1) {
              setExpandedDetails(prev => ({
                ...prev,
                [sms.mid]: detailResponse.list.slice(1)
              }))
            }
            
            return combinedItem
          } catch (err) {
            console.error(`Failed to fetch detail for mid ${sms.mid}:`, err)
            const combinedItem: CombinedSmsItem = { ...sms }
            return combinedItem
          }
        })

        const combinedList = await Promise.all(detailPromises)
        setSmsList(combinedList)
        console.log('현재 페이지:', 1)
        console.log('페이지 크기:', 500)
        console.log('전체 페이지 수:', Math.ceil(historyResponse.total_count / 500))
      } else {
        setError(historyResponse.message || '발송결과를 가져오는 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError("발송결과를 가져오는 중 오류가 발생했습니다.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchSmsList()
    }
  }, [startDate, endDate])

  useEffect(() => {
    if (messageType === 'all') {
      setFilteredSmsList(smsList)
    } else {
      const filtered = smsList.filter(sms => sms.type === messageType)
      setFilteredSmsList(filtered)
    }
  }, [messageType, smsList])

  useEffect(() => {
    // 카카오톡 발송내역 데이터 로드
    const loadKakaoHistory = async () => {
      try {
        const response = await fetch('/data/history_kakao.json')
        const data = await response.json()
        setKakaoHistory(data)
      } catch (error) {
        console.error('카카오톡 발송내역 로드 중 오류 발생:', error)
      }
    }

    if (viewTab === 'kakao') {
      loadKakaoHistory()
    }
  }, [viewTab])

  const handleSort = (column: string) => {
    setSortDirection((prev) => ({
      ...Object.fromEntries(Object.entries(prev).map(([key]) => [key, null])),
      [column]: prev[column] === null ? "asc" : prev[column] === "asc" ? "desc" : null,
    }))
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortDirection[column] === null) {
      return (
        <span className="ml-1 inline-block">
          <ChevronUp className="h-3 w-3 opacity-30" />
          <ChevronDown className="h-3 w-3 -mt-1 opacity-30" />
        </span>
      )
    }
    return sortDirection[column] === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 inline" />
    )
  }

  const handleRowExpand = async (sms: CombinedSmsItem) => {
    if (expandedRows.has(sms.mid)) {
      setExpandedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(sms.mid)
        return newSet
      })
      return
    }

    try {
      const detailResponse = await getSmsDetail(sms.mid)
      if (detailResponse.result_code > 0 && detailResponse.list.length > 1) {
        setExpandedDetails(prev => ({
          ...prev,
          [sms.mid]: detailResponse.list.slice(1) // 첫 번째 항목을 제외한 나머지 항목들
        }))
        setExpandedRows(prev => {
          const newSet = new Set(prev)
          newSet.add(sms.mid)
          return newSet
        })
      }
    } catch (err) {
      console.error('상세 정보를 가져오는 중 오류가 발생했습니다:', err)
    }
  }

  const handleViewResults = () => {
    // 기능 비움
  }

  const handleSearch = () => {
    setIsSearching(true)
    
    if (!searchKeyword.trim()) {
      setFilteredSmsList(smsList)
      setIsSearching(false)
      return
    }

    const keyword = searchKeyword.toLowerCase().trim()
    const filtered = smsList.filter(sms => {
      switch (searchType) {
        case 'content':
          return sms.msg.toLowerCase().includes(keyword)
        case 'recipient':
          return sms.detail?.receiver?.toLowerCase().includes(keyword) || false
        case 'all':
        default:
          return (
            sms.msg.toLowerCase().includes(keyword) ||
            sms.detail?.receiver?.toLowerCase().includes(keyword) ||
            sms.sender.toLowerCase().includes(keyword)
          )
      }
    })

    setFilteredSmsList(filtered)
    setIsSearching(false)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 pb-4 border-b">발송결과</h1>

      {/* Main Tabs */}
      <div className="mb-6">
        <div className="flex border-b w-full">
          <div
            className={`py-3 px-6 cursor-pointer font-medium flex-1 text-center ${
              viewTab === "all" ? "bg-yellow-300 text-black" : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => {
              setViewTab("all")
              setMessageType("all")
            }}
          >
            문자
          </div>
          <div
            className={`py-3 px-6 cursor-pointer font-medium flex-1 text-center ${
              viewTab === "kakao" ? "bg-yellow-300 text-black" : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => {
              setViewTab("kakao")
              setMessageType("all")
            }}
          >
            카카오톡
          </div>
          <div
            className={`py-3 px-6 cursor-pointer font-medium flex-1 text-center ${
              viewTab === "email" ? "bg-yellow-300 text-black" : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => {
              setViewTab("email")
              setMessageType("all")
            }}
          >
            이메일
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">기간선택</span>
            <CustomDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              className="w-[300px]"
            />
          </div>

          <Button
            variant="outline"
            className="ml-1 px-4 py-2 h-9"
            onClick={() => {
              const prevMonth = new Date()
              prevMonth.setMonth(prevMonth.getMonth() - 1)
              setStartDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1))
              setEndDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0))
            }}
          >
            전월
          </Button>
          <Button
            variant="outline"
            className="px-4 py-2 h-9"
            onClick={() => {
              const now = new Date()
              setStartDate(new Date(now.getFullYear(), now.getMonth(), 1))
              setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
            }}
          >
            당월
          </Button>
          <Button
            variant="outline"
            className="px-4 py-2 h-9"
            onClick={() => {
              const now = new Date()
              const threeMonthsAgo = new Date()
              threeMonthsAgo.setMonth(now.getMonth() - 3)
              setStartDate(threeMonthsAgo)
              setEndDate(now)
            }}
          >
            3개월
          </Button>
          <Button variant="secondary" className="px-4 py-2 h-9 bg-blue-50 text-blue-600 hover:bg-blue-100">
            조회
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Select 
              value={searchType} 
              onValueChange={(value: 'all' | 'content' | 'recipient') => setSearchType(value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="발신번호" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="content">내용</SelectItem>
                <SelectItem value="recipient">수신자</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="검색어를 입력하세요." 
              className="w-[250px]" 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? '검색중...' : '검색'}
            </Button>
          </div>
        </div>
      </div>

      {/* Message Type Tabs */}
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${messageType === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setMessageType('all')}
          >
            전체
          </button>
          {viewTab === 'all' ? (
            <>
              <button
                className={`px-4 py-2 ${messageType === 'SMS' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                onClick={() => setMessageType('SMS')}
              >
                단문(SMS)
              </button>
              <button
                className={`px-4 py-2 ${messageType === 'LMS' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                onClick={() => setMessageType('LMS')}
              >
                장문(LMS)
              </button>
              <button
                className={`px-4 py-2 ${messageType === 'MMS' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                onClick={() => setMessageType('MMS')}
              >
                그림(MMS)
              </button>
            </>
          ) : viewTab === 'kakao' ? (
            <>
              <button
                className={`px-4 py-2 ${messageType === 'SMS' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                onClick={() => setMessageType('SMS')}
              >
                카톡친구
              </button>
              <button
                className={`px-4 py-2 ${messageType === 'LMS' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                onClick={() => setMessageType('LMS')}
              >
                대화명
              </button>
              <button
                className={`px-4 py-2 ${messageType === 'MMS' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                onClick={() => setMessageType('MMS')}
              >
                메세지
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Results Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            총 <span className="text-red-500 font-bold">
              {viewTab === 'kakao' ? kakaoHistory.length : totalCount}
            </span>건
          </div>
        </div>

        <div className="border rounded-sm w-full">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                {viewTab === 'kakao' ? (
                  <>
                    <TableHead className="w-[16.666%] text-center">발송일시</TableHead>
                    <TableHead className="w-[16.666%] text-center">수신자</TableHead>
                    <TableHead className="w-[16.666%] text-center">전화번호</TableHead>
                    <TableHead className="w-[16.666%] text-center">메시지 내용</TableHead>
                    <TableHead className="w-[16.666%] text-center">발송상태</TableHead>
                    <TableHead className="w-[16.666%] text-center">작업구분</TableHead>
                  </>
                ) : viewTab === 'email' ? (
                  <>
                    <TableHead className="w-[16.666%] text-center">발송일시</TableHead>
                    <TableHead className="w-[16.666%] text-center">수신자</TableHead>
                    <TableHead className="w-[16.666%] text-center">이메일</TableHead>
                    <TableHead className="w-[16.666%] text-center">제목</TableHead>
                    <TableHead className="w-[16.666%] text-center">발송상태</TableHead>
                    <TableHead className="w-[16.666%] text-center">작업구분</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="w-[16.666%] text-center">발송일시</TableHead>
                    <TableHead className="w-[16.666%] text-center">문자구분</TableHead>
                    <TableHead className="w-[16.666%] text-center">발신번호</TableHead>
                    <TableHead className="w-[16.666%] text-center">수신번호</TableHead>
                    <TableHead className="w-[16.666%] text-center">메시지 내용</TableHead>
                    <TableHead className="w-[16.666%] text-center">전송상태</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewTab === 'kakao' ? (
                kakaoHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      발송 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  kakaoHistory
                    .filter(item => {
                      if (messageType === 'all') return true
                      if (messageType === 'SMS') return item.Whether_Or === '1' || item.Whether_Or === '2'
                      if (messageType === 'LMS') return item.Whether_Or === '3' || item.Whether_Or === '5'
                      if (messageType === 'MMS') return item.Whether_Or === '6' || item.Whether_Or === '7'
                      return true
                    })
                    .map((item) => (
                      <TableRow key={item.ID}>
                        <TableCell>{item.Start_Or || '-'}</TableCell>
                        <TableCell>{item.Name}</TableCell>
                        <TableCell>{item.Phone_Number}</TableCell>
                        <TableCell 
                          className="max-w-[200px] truncate cursor-pointer hover:text-blue-600"
                          onClick={() => setSelectedMessage(item.messageContent)}
                        >
                          {item.messageContent}
                        </TableCell>
                        <TableCell>{item.Whether_Or === '3' ? '발송완료' : '발송대기'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded ${
                            item.Whether_Or === '1' ? 'bg-red-100 text-red-800' :
                            item.Whether_Or === '2' ? 'bg-green-100 text-green-800' :
                            item.Whether_Or === '3' ? 'bg-red-100 text-red-800' :
                            item.Whether_Or === '5' ? 'bg-green-100 text-green-800' :
                            item.Whether_Or === '6' ? 'bg-red-100 text-red-800' :
                            item.Whether_Or === '7' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.Whether_Or === '1' ? '카톡친구' :
                             item.Whether_Or === '2' ? '카톡친구' :
                             item.Whether_Or === '3' ? '대화명' :
                             item.Whether_Or === '5' ? '대화명' :
                             item.Whether_Or === '6' ? '메세지' :
                             item.Whether_Or === '7' ? '메세지' :
                             item.Whether_Or}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                )
              ) : viewTab === 'email' ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    발송 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-red-500 font-medium">{error}</div>
                      <div className="mt-2 text-sm text-gray-500">
                        문제가 지속되면 관리자에게 문의해주세요.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSmsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      발송 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSmsList.map((sms) => (
                    <React.Fragment key={sms.mid}>
                      <TableRow>
                        <TableCell className="text-center">{format(new Date(sms.reg_date), "yyyy.MM.dd HH:mm", { locale: ko })}</TableCell>
                        <TableCell className="text-center">{sms.type}</TableCell>
                        <TableCell className="text-center">{sms.sender}</TableCell>
                        <TableCell className="text-center">{sms.detail?.receiver || '-'}</TableCell>
                        <TableCell 
                          className="text-center cursor-pointer hover:text-blue-600 truncate px-4"
                          onClick={() => setSelectedMessage(sms.msg || '')}
                        >
                          <div className="flex items-center justify-center">
                            {sms.msg}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{sms.detail?.sms_state || '-'}</TableCell>
                      </TableRow>
                      {expandedDetails[sms.mid]?.map((detail, index) => (
                        <TableRow key={`${sms.mid}-${detail.mdid}-${index}`} className="bg-gray-50">
                          <TableCell className="text-center">{format(new Date(detail.reg_date), "yyyy.MM.dd HH:mm", { locale: ko })}</TableCell>
                          <TableCell className="text-center">{detail.type}</TableCell>
                          <TableCell className="text-center">{detail.sender}</TableCell>
                          <TableCell className="text-center">{detail.receiver}</TableCell>
                          <TableCell 
                            className="text-center cursor-pointer hover:text-blue-600 truncate px-4"
                            onClick={() => setSelectedMessage(detail.msg || '')}
                          >
                            <div className="flex items-center justify-center">
                              {detail.msg}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{detail.sms_state}</TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end items-center mt-4">
          <div className="text-sm text-gray-500">
            {`1 - ${Math.min(500, totalCount)} / ${totalCount}`}
          </div>
        </div>
      </div>

      <MessageModal
        isOpen={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage || ''}
      />
    </div>
  )
}
