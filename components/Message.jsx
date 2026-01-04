"use client"

import { cls } from "./utils"
import { Stethoscope, User } from "lucide-react"

export default function Message({ role, children }) {
  const isUser = role === "user"

  return (
    <div className={cls("flex gap-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center">
          {/* Medical cross background */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f]" />
          {/* Cross icon */}
          <svg
            className="medical-cross relative z-10 h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
        </div>
      )}

      <div
        className={cls(
          "relative max-w-[85%] overflow-hidden text-sm",
          isUser
            ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] px-4 py-3 text-white shadow-md"
            : "medical-card-gradient rounded-xl border border-slate-200/80 px-4 py-3 shadow-sm dark:border-slate-700/50"
        )}
      >
        {/* Subtle top accent for assistant messages */}
        {!isUser && (
          <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-[#1e3a5f] via-[#3b6998] to-transparent" />
        )}

        <div className={cls("relative", !isUser && "pt-1")}>
          {children}
        </div>
      </div>

      {isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
          <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </div>
      )}
    </div>
  )
}
