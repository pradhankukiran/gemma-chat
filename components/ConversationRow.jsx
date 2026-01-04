"use client"

import { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Pin, Edit3, Trash2, FileText } from "lucide-react"
import { cls, timeAgo } from "./utils"
import { motion, AnimatePresence } from "framer-motion"

export default function ConversationRow({ data, active, onSelect, onTogglePin, onDelete, onRename, showMeta }) {
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef(null)
  const count = Array.isArray(data.messages) ? data.messages.length : data.messageCount

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
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
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
          active
            ? "bg-[#1e3a5f]/10 text-slate-900 ring-1 ring-[#1e3a5f]/20 dark:bg-blue-500/10 dark:text-white dark:ring-blue-500/20"
            : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
        )}
        title={data.title}
      >
        {/* Session icon */}
        <div
          className={cls(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            active
              ? "bg-[#1e3a5f] text-white"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          )}
        >
          <FileText className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {data.pinned && <Pin className="h-3 w-3 shrink-0 text-amber-500" />}
            <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
              {data.title}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{mounted ? timeAgo(data.updatedAt) : "recently"}</span>
            {showMeta && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>{count} {count === 1 ? "msg" : "msgs"}</span>
              </>
            )}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className={cls(
              "rounded-lg p-1.5 transition",
              active
                ? "text-slate-600 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-200/50 dark:text-slate-500 dark:hover:bg-slate-700/50"
            )}
            aria-label="Session options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-[100] mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                <button
                  onClick={handlePin}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Pin className="h-3.5 w-3.5 text-slate-400" />
                  {data.pinned ? "Remove from Saved" : "Save Session"}
                </button>
                <button
                  onClick={handleRename}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                  Rename
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview tooltip */}
      {data.preview && (
        <div className="pointer-events-none absolute left-[calc(100%+8px)] top-0 hidden w-72 rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-800 md:group-hover:block">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Session Preview
          </div>
          <div className="line-clamp-6 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
            {data.preview}
          </div>
        </div>
      )}
    </div>
  )
}
