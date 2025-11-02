"use client"
import { ChevronLeft, ChevronRight, Factory } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"
import "react-day-picker/style.css";
import { set } from "date-fns"

function Calendar({ className, classNames, showOutsideDays = true, setOpenCalendar, ...props }) {
  const calendarHistoryDisabled = props.calendarHistoryDisabled;
  const startMonth = props.startMonth || new Date();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      startMonth={startMonth}
      defaultMonth={new Date()}
      endMonth={new Date(new Date().getFullYear(), new Date().getMonth() + 12)}
      disabled={calendarHistoryDisabled?{ before: new Date() }:{}}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption_label: "text-sm font-medium",
        nav: "space-x-1",
        day:  "h-9 w-9 p-0 font-normal",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
