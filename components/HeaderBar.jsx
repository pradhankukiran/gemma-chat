"use client"

import { Sun, Moon } from "lucide-react"
import { cls } from "./utils"

export default function HeaderBar({ theme, setTheme, sessionTitle, messageCount }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border-primary bg-surface-primary px-4 sm:px-5">
      {/* Left: Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-[15px] font-semibold leading-tight text-ink">MedGemmaChat</h1>
        </div>
      </div>

      {/* Center: Session context */}
      <div className="hidden items-center gap-2 md:flex">
        {sessionTitle && (
          <div className="flex items-center gap-2 text-sm">
            <span className="max-w-[280px] truncate text-ink-secondary">{sessionTitle}</span>
            {messageCount > 0 && (
              <span className="rounded-md bg-surface-tertiary px-1.5 py-0.5 font-mono text-[11px] text-ink-tertiary">
                {messageCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Status + Theme */}
      <div className="flex items-center gap-1.5">
        <div className="hidden items-center gap-1.5 rounded-md border border-border-primary px-2 py-1 text-xs text-ink-secondary sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          MedGemma
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cls(
            "inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary transition-colors",
            "hover:bg-surface-tertiary hover:text-ink"
          )}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}
