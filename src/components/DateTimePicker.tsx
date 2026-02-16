"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import * as Popover from "@radix-ui/react-popover";
import "react-day-picker/style.css";

// 빠른 반응을 위한 커스텀 스타일
const customStyles = `
  .rdp-custom .rdp-day_button {
    transition: all 0.1s ease !important;
  }
  .rdp-custom .rdp-day_button:active {
    transform: scale(0.95);
  }
  .rdp-custom * {
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
`;

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}


export default function DateTimePicker({
  value,
  onChange,
  disabled,
  placeholder = "📅 마감일 추가",
  compact = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value || undefined
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());

  // 기본값: value가 있으면 그 시간, 없으면 현재 시간
  const getDefaultTime = (date: Date | null) => {
    if (date) {
      return {
        hours: format(date, "HH"),
        minutes: format(date, "mm"),
      };
    }
    const now = new Date();
    const currentMinutes = now.getMinutes();
    // 5분 단위로 반올림
    const roundedMinutes = Math.ceil(currentMinutes / 5) * 5;
    const finalMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes;
    const finalHours = roundedMinutes >= 60 ? now.getHours() + 1 : now.getHours();

    return {
      hours: String(finalHours % 24).padStart(2, "0"),
      minutes: String(finalMinutes).padStart(2, "0"),
    };
  };

  const defaultTime = getDefaultTime(value);
  const [hours, setHours] = useState(defaultTime.hours);
  const [minutes, setMinutes] = useState(defaultTime.minutes);

  // value가 변경될 때 시간 state 업데이트
  useEffect(() => {
    if (value) {
      const time = getDefaultTime(value);
      setHours(time.hours);
      setMinutes(time.minutes);
      setSelectedDate(value);
      setCurrentMonth(value);
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleApply = () => {
    if (!selectedDate) {
      onChange(null);
      setOpen(false);
      return;
    }

    const newDate = new Date(selectedDate);
    newDate.setHours(Number(hours), Number(minutes), 0, 0);
    onChange(newDate);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    onChange(null);
    setOpen(false);
  };

  const formatDisplay = (date: Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = format(d, "HH:mm", { locale: ko });

    if (diffDays < 0) {
      return `⏰ ${Math.abs(diffDays)}일 전 ${timeStr} (지남)`;
    } else if (diffDays === 0) {
      if (diffHours < 0) {
        return `⏰ ${Math.abs(diffHours)}시간 전 (지남)`;
      } else if (diffHours < 3) {
        return `⏰ ${diffHours}시간 후`;
      } else {
        return `⏰ 오늘 ${timeStr}`;
      }
    } else if (diffDays === 1) {
      return `⏰ 내일 ${timeStr}`;
    } else {
      return `⏰ ${diffDays}일 후 ${timeStr}`;
    }
  };

  // Popover가 열릴 때 value가 없으면 현재 시간으로 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !value) {
      const time = getDefaultTime(null);
      setHours(time.hours);
      setMinutes(time.minutes);
      setSelectedDate(undefined);
      setCurrentMonth(new Date());
    }
    setOpen(isOpen);
  };

  return (
    <>
      <style>{customStyles}</style>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`${
              value
                ? "text-xs font-medium text-gray-600 hover:text-blue-600"
                : "text-[10px] text-gray-400 hover:text-blue-500"
            } transition-colors disabled:opacity-50 hover:underline`}
          >
            {value ? formatDisplay(value) : placeholder}
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-auto rounded-xl bg-white shadow-lg border border-gray-200 p-4"
            sideOffset={5}
            align="end"
          >
            <div className="space-y-3">
            {/* Custom Navigation */}
            <div className="flex justify-between items-center mb-2 px-1">
              <h2 className="text-sm font-semibold text-gray-900">
                {format(currentMonth, "yyyy년 M월", { locale: ko })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                  className="h-7 w-7 bg-transparent hover:bg-gray-100 rounded-md active:scale-95 transition-all"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                  className="h-7 w-7 bg-transparent hover:bg-gray-100 rounded-md active:scale-95 transition-all"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Calendar */}
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ko}
              className="rdp-custom select-none"
              hideNavigation
              classNames={{
                month: "space-y-3",
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday: "text-gray-500 rounded-md w-9 font-normal text-[10px]",
                week: "flex w-full mt-1",
                day: "h-9 w-9 text-center text-sm p-0 relative hover:bg-gray-100 rounded-md active:scale-95 transition-all cursor-pointer",
                day_button: "h-9 w-9 p-0 font-normal cursor-pointer",
                selected: "bg-[#FF2F92] text-white hover:bg-[#e6287f] rounded-md",
                today: "bg-gray-100 text-gray-900 rounded-md",
                outside: "text-gray-400",
                disabled: "text-gray-300 cursor-not-allowed",
              }}
              modifiersClassNames={{
                selected: "!bg-[#FF2F92] !text-white",
              }}
            />

            {/* Time Input */}
            <div className="border-t pt-3">
              <label className="text-xs font-medium text-gray-700 mb-2 block">시간 선택</label>
              <div className="flex items-center gap-2">
                <select
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF2F92] bg-white"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = String(i).padStart(2, "0");
                    return (
                      <option key={h} value={h}>
                        {h}시
                      </option>
                    );
                  })}
                </select>
                <span className="text-gray-400">:</span>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF2F92] bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i * 5).padStart(2, "0");
                    return (
                      <option key={m} value={m}>
                        {m}분
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#FF2F92] hover:bg-[#e6287f] rounded-md transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    </>
  );
}
