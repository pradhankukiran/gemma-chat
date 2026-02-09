"use client"

import { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Pin, Edit3, Trash2 } from "lucide-react"
import { cls, timeAgo } from "./utils"

export default function ConversationRow({ data, active, onSelect, onTogglePin, onDelete, onRename, showMeta }) {
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef(null)
  const count = Array.isArray(data.messages) ? data.messages.length : data.messageCount

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMenu])

  const handlePin = (e) => {
    e.stopPropagation()
    onTogglePin?.()
    setShowMenu(false)
  }

  const handleRename = (e) => {
    e.stopPropagation()
    const newName = prompt(`Rename session "${data.title}" to:`, data.title)
    if (newName && newName.trim() && newName !== data.title) {
      onRename?.(data.id, newName.trim())
    }
    setShowMenu(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${data.title}"?`)) {
      onDelete?.(data.id)
    }
    setShowMenu(false)
  }

  return (
    <div className="group relative">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect?.()
          }
        }}
        className={cls(
          "flex w-full items-center gap-2.5 rounded-md border-l-2 border-l-transparent px-2.5 py-2 text-left transition-colors",
          active
            ? "border-l-accent bg-surface-tertiary text-ink"
            : "text-ink-secondary hover:bg-surface-tertiary hover:text-ink",
          data.pinned && !active && "border-l-amber"
        )}
        title={data.title}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {data.pinned && <Pin className="h-3 w-3 shrink-0 text-amber" />}
            <span className="truncate text-sm">{data.title}</span>
          </div>
          {showMeta && (
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
              <span>{mounted ? timeAgo(data.updatedAt) : "recently"}</span>
              <span className="text-ink-faint/50">&middot;</span>
              <span>{count} {count === 1 ? "msg" : "msgs"}</span>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className={cls(
              "rounded-md p-1 transition-colors",
              active
                ? "text-ink-tertiary hover:text-ink"
                : "text-ink-faint opacity-0 group-hover:opacity-100 hover:text-ink-secondary"
            )}
            aria-label="Session options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-[100] mt-1 w-40 overflow-hidden rounded-md border border-border-primary bg-surface-primary shadow-lg">
              <button
                onClick={handlePin}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink-secondary transition-colors hover:bg-surface-tertiary"
              >
                <Pin className="h-3.5 w-3.5 text-ink-faint" />
                {data.pinned ? "Unsave" : "Save"}
              </button>
              <button
                onClick={handleRename}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink-secondary transition-colors hover:bg-surface-tertiary"
              >
                <Edit3 className="h-3.5 w-3.5 text-ink-faint" />
                Rename
              </button>
              <div className="my-0.5 border-t border-border-secondary" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red transition-colors hover:bg-red-light"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
