"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  subDays,
  subMonths,
  differenceInDays,
  isToday,
} from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  className?: string
}

export function CustomDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [leftMonth, setLeftMonth] = useState<Date | undefined>(undefined)
  const [rightMonth, setRightMonth] = useState<Date | undefined>(undefined)
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined)
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined)
  const [selecting, setSelecting] = useState<"start" | "end" | null>(null)
  const [daysBetween, setDaysBetween] = useState<number>(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      const initialStartDate = startDate || new Date()
      const initialEndDate = endDate || new Date()
      setLeftMonth(startOfMonth(initialStartDate))
      setRightMonth(addMonths(startOfMonth(initialStartDate), 1))
      setTempStartDate(initialStartDate)
      setTempEndDate(initialEndDate)
    }
  }, [startDate, endDate, isMounted])

  useEffect(() => {
    if (tempStartDate && tempEndDate) {
      const days = differenceInDays(tempEndDate, tempStartDate) + 1
      setDaysBetween(days)
    } else {
      setDaysBetween(0)
    }
  }, [tempStartDate, tempEndDate])

  if (!isMounted) {
    return (
      <Button
        variant="outline"
        className={cn("justify-start text-left font-normal", className)}
        disabled
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span>날짜 선택</span>
      </Button>
    )
  }

  const handlePreviousMonth = () => {
    setLeftMonth((prevMonth) => {
      const newLeftMonth = addMonths(prevMonth!, -1)
      setRightMonth(addMonths(newLeftMonth, 1))
      return newLeftMonth
    })
  }

  const handleNextMonth = () => {
    setRightMonth((prevMonth) => {
      const newRightMonth = addMonths(prevMonth!, 1)
      setLeftMonth(addMonths(newRightMonth, -1))
      return newRightMonth
    })
  }

  const handleDateClick = (date: Date) => {
    if (!selecting || selecting === "start") {
      setTempStartDate(date)
      setTempEndDate(undefined)
      setSelecting("end")
    } else {
      if (date < tempStartDate!) {
        setTempStartDate(date)
        setTempEndDate(tempStartDate)
      } else {
        setTempEndDate(date)
      }
      setSelecting(null)
    }
  }

  const handleApply = () => {
    onStartDateChange(tempStartDate)
    onEndDateChange(tempEndDate)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
    setIsOpen(false)
  }

  const handleQuickSelect = (days: number) => {
    const end = new Date()
    const start = subDays(end, days - 1)
    setTempStartDate(start)
    setTempEndDate(end)
    setLeftMonth(startOfMonth(start))
    setRightMonth(startOfMonth(end))
  }

  const handleMonthsAgo = (months: number) => {
    const end = new Date()
    const start = subMonths(end, months)
    setTempStartDate(start)
    setTempEndDate(end)
    setLeftMonth(startOfMonth(start))
    setRightMonth(startOfMonth(end))
  }

  const renderCalendarMonth = (month: Date) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const startDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1)
    const endDate = new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 0)

    // Get days from previous month to fill the first week
    const startDay = startDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    const prevMonthDays = []
    if (startDay !== 0) {
      const prevMonth = new Date(monthStart)
      prevMonth.setDate(0) // Last day of previous month
      const prevMonthLastDay = prevMonth.getDate()

      for (let i = startDay - 1; i >= 0; i--) {
        const day = new Date(prevMonth)
        day.setDate(prevMonthLastDay - i)
        prevMonthDays.push(day)
      }
    }

    // Get days from current month
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Get days from next month to fill the last week
    const endDay = endDate.getDay()
    const nextMonthDays = []
    if (endDay !== 6) {
      const nextMonth = new Date(monthEnd)
      nextMonth.setDate(monthEnd.getDate() + 1) // First day of next month

      for (let i = 0; i < 6 - endDay; i++) {
        const day = new Date(nextMonth)
        day.setDate(nextMonth.getDate() + i)
        nextMonthDays.push(day)
      }
    }

    const allDays = [...prevMonthDays, ...days, ...nextMonthDays]
    const weeks = []

    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7))
    }

    return (
      <div className="calendar-month">
        <div className="text-center font-medium py-2">{format(month, "M월 yyyy", { locale: ko })}</div>
        <div className="grid grid-cols-7 gap-0 text-center">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
            <div key={index} className="text-sm py-1">
              {day}
            </div>
          ))}
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, month)
              const isSelected =
                (tempStartDate && isSameDay(day, tempStartDate)) || (tempEndDate && isSameDay(day, tempEndDate))
              const isInRange = tempStartDate && tempEndDate && day >= tempStartDate && day <= tempEndDate

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    "h-10 w-10 flex items-center justify-center text-sm cursor-pointer",
                    !isCurrentMonth && "text-gray-300",
                    isSelected && "bg-blue-500 text-white rounded-none",
                    isInRange && !isSelected && "bg-blue-100",
                    isToday(day) && !isSelected && "border border-blue-500",
                  )}
                  onClick={() => isCurrentMonth && handleDateClick(day)}
                >
                  {day.getDate()}
                </div>
              )
            }),
          )}
        </div>
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start text-left font-normal", className)}
          onClick={() => setIsOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate && endDate ? (
            <span>
              {format(startDate, "yyyy.MM.dd", { locale: ko })} ~ {format(endDate, "yyyy.MM.dd", { locale: ko })}
              {daysBetween > 0 && ` (${daysBetween}일간)`}
            </span>
          ) : (
            <span>날짜 선택</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="w-[600px] p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-medium">
              {tempStartDate && tempEndDate ? (
                <span>
                  {format(tempStartDate, "yyyy.MM.dd", { locale: ko })} ~{" "}
                  {format(tempEndDate, "yyyy.MM.dd", { locale: ko })}
                  {daysBetween > 0 && ` (${daysBetween}일간)`}
                </span>
              ) : tempStartDate ? (
                <span>{format(tempStartDate, "yyyy.MM.dd", { locale: ko })} ~ 종료일 선택</span>
              ) : (
                <span>시작일 선택</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={handleApply}>
                적용
              </Button>
              <Button variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white" onClick={handleCancel}>
                창닫기
              </Button>
            </div>
          </div>

          <div className="flex justify-between gap-4 mb-4">
            <Button variant="ghost" className="flex-1 hover:bg-gray-100" onClick={() => handleQuickSelect(7)}>
              7일전
            </Button>
            <Button
              variant="ghost"
              className="flex-1 hover:bg-gray-100 bg-teal-500 text-white hover:text-white hover:bg-teal-600"
              onClick={() => handleMonthsAgo(1)}
            >
              1개월 전
            </Button>
            <Button variant="ghost" className="flex-1 hover:bg-gray-100" onClick={() => handleMonthsAgo(3)}>
              3개월 전
            </Button>
            <Button variant="ghost" className="flex-1 hover:bg-gray-100" onClick={() => handleMonthsAgo(6)}>
              6개월 전
            </Button>
            <Button variant="ghost" className="flex-1 hover:bg-gray-100" onClick={() => handleMonthsAgo(12)}>
              12개월 전
            </Button>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 border rounded p-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">시작일</span>
                <span className="ml-2">
                  {tempStartDate ? format(tempStartDate, "yyyy년 MM월 dd일", { locale: ko }) : ""}
                </span>
              </div>
            </div>
            <div className="flex-1 border rounded p-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">종료일</span>
                <span className="ml-2">
                  {tempEndDate ? format(tempEndDate, "yyyy년 MM월 dd일", { locale: ko }) : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <button onClick={handlePreviousMonth} className="p-1">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={handleNextMonth} className="p-1">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 border-r pr-2">{leftMonth && renderCalendarMonth(leftMonth)}</div>
            <div className="flex-1 pl-2">{rightMonth && renderCalendarMonth(rightMonth)}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
