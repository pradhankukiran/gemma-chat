"use client"
import { AnimatePresence, motion } from "framer-motion"
import { X, SearchIcon, Plus, Clock } from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { highlightMatch } from "./utils"

function getTimeGroup(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  if (date >= today) return "Today"
  if (date >= yesterday) return "Yesterday"
  if (date >= sevenDaysAgo) return "Previous 7 Days"
  return "Older"
}

function HighlightedText({ text, query }) {
  const parts = highlightMatch(text, query)
  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded bg-accent-light px-0.5 text-accent">{part.text}</mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  )
}

export default function SearchModal({
  isOpen,
  onClose,
  conversations,
  selectedId,
  onSelect,
  togglePin,
  createNewChat,
}) {
  const [query, setQuery] = useState("")

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || (c.preview || "").toLowerCase().includes(q))
  }, [conversations, query])

  const groupedConversations = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    }

    ;[...filteredConversations]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach((conv) => {
        const group = getTimeGroup(conv.updatedAt)
        groups[group].push(conv)
      })

    return groups
  }, [filteredConversations])

  const handleClose = useCallback(() => {
    setQuery("")
    onClose()
  }, [onClose])

  const handleNewChat = () => {
    createNewChat()
    handleClose()
  }

  const handleSelectConversation = (id) => {
    onSelect(id)
    handleClose()
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, handleClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-border-primary bg-surface-primary shadow-xl"
          >
            {/* Search Header */}
            <div className="flex items-center gap-2.5 border-b border-border-primary px-3 py-2.5">
              <SearchIcon className="h-4 w-4 shrink-0 text-ink-faint" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions..."
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
                autoFocus
              />
              <kbd className="rounded border border-border-primary px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {/* New Chat */}
              <div className="border-b border-border-secondary p-1.5">
                <button
                  onClick={handleNewChat}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-ink-secondary transition-colors hover:bg-surface-tertiary"
                >
                  <Plus className="h-4 w-4 text-ink-faint" />
                  New session
                </button>
              </div>

              {/* Groups */}
              {Object.entries(groupedConversations).map(([groupName, convs]) => {
                if (convs.length === 0) return null
                return (
                  <div key={groupName} className="border-b border-border-secondary p-1.5 last:border-b-0">
                    <div className="px-3 py-1.5 text-[11px] font-medium text-ink-faint">{groupName}</div>
                    {convs.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-tertiary"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-ink">
                            <HighlightedText text={conv.title} query={query} />
                          </div>
                          {conv.preview && (
                            <div className="truncate text-xs text-ink-tertiary">
                              <HighlightedText text={conv.preview} query={query} />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}

              {/* Empty State */}
              {filteredConversations.length === 0 && query.trim() && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-ink-tertiary">No sessions found</p>
                </div>
              )}

              {!query.trim() && conversations.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-ink-tertiary">No sessions yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
