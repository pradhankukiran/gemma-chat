"use client"

import { SearchIcon, Plus } from "lucide-react"
import { cls, truncate, formatTime } from "./utils"

export default function ThreadStrip({
  turns,
  activeTurnIndex,
  onSelectTurn,
  onOpenCommandPalette,
  onNewChat,
}) {
  return (
    <div className="flex h-full w-[220px] flex-col border-r border-white/[0.06]" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Thread
          </h2>
          {turns.length > 0 && (
            <span className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
              {turns.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-tertiary hover:text-ink-secondary"
            title="New session (Cmd+N)"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onOpenCommandPalette}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-tertiary hover:text-ink-secondary"
            title="Search sessions (Cmd+K)"
          >
            <SearchIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Turn list */}
      <nav className="thread-scroll flex-1 overflow-y-auto px-2 pb-4">
        {turns.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-ink-faint">
            No messages yet
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {turns.map((turn) => {
              const isActive =
                activeTurnIndex === null
                  ? turn.index === turns.length - 1
                  : turn.index === activeTurnIndex
              return (
                <button
                  key={turn.userMsg.id}
                  onClick={() => onSelectTurn(turn.index)}
                  className={cls(
                    "w-full rounded-md border-l-2 px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "border-l-accent bg-[#111] text-white/90"
                      : "border-l-transparent text-white/50 hover:bg-white/[0.03] hover:text-white/70"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-white/25">
                      You &middot; Turn {turn.index + 1}
                    </span>
                    {turn.userMsg.createdAt && (
                      <span className="font-mono text-[10px] text-white/20">
                        {formatTime(turn.userMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[13px] leading-snug">
                    {truncate(turn.userMsg.content, 100)}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </nav>
    </div>
  )
}
