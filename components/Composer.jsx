"use client"

import { useRef, useState, useEffect } from "react"
import { ArrowUp, Loader2, ImagePlus, X, Pill, BookOpen, FileCode2, ShieldAlert } from "lucide-react"
import { cls } from "./utils"

const MAX_CHARS = 4000

const SLASH_COMMANDS = [
  { command: "/drug", label: "Drug Lookup", description: "Search drug labels via openFDA + RxNorm", icon: Pill, type: "drug" },
  { command: "/icd", label: "ICD-11 Lookup", description: "Search ICD-11 diagnosis codes", icon: FileCode2, type: "icd" },
  { command: "/evidence", label: "PubMed Search", description: "Search PubMed for clinical evidence", icon: BookOpen, type: "evidence" },
  { command: "/adverse", label: "Adverse Events", description: "Search FDA adverse event reports", icon: ShieldAlert, type: "adverse" },
]

export default function Composer({ onSend, busy, value: controlledValue, onChange: onControlledChange, onReferenceSearch }) {
  const [internalValue, setInternalValue] = useState("")
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = onControlledChange || setInternalValue

  const [sending, setSending] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [attachments, setAttachments] = useState([])
  const attachmentsRef = useRef([])

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 24
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 12 * lineHeight

      if (scrollHeight <= maxHeight) {
        textarea.style.height = `${Math.max(lineHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  useEffect(() => {
    if (controlledValue && controlledValue.length > 0 && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(controlledValue.length, controlledValue.length)
    }
  }, [controlledValue])

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.preview))
    }
  }, [])

  const [slashIndex, setSlashIndex] = useState(-1)
  const slashMatch = value.match(/^\/(\S*)/)
  const showSlash = slashMatch && onReferenceSearch
  const slashFilter = slashMatch?.[1]?.toLowerCase() || ""
  const filteredCommands = showSlash
    ? SLASH_COMMANDS.filter((c) => c.command.slice(1).startsWith(slashFilter))
    : []

  useEffect(() => {
    setSlashIndex(filteredCommands.length > 0 ? 0 : -1)
  }, [slashFilter, filteredCommands.length])

  function handleSlashCommand(cmd) {
    const rest = value.replace(/^\/\S*\s*/, "").trim()
    if (!rest) {
      setValue(cmd.command + " ")
      inputRef.current?.focus()
      return
    }
    setValue("")
    onReferenceSearch?.(cmd.type, rest)
  }

  async function handleSend() {
    if (!value.trim() || sending) return

    // Intercept slash commands
    if (showSlash && onReferenceSearch) {
      const matched = SLASH_COMMANDS.find((c) => value.startsWith(c.command + " ") || value === c.command)
      if (matched) {
        const query = value.slice(matched.command.length).trim()
        if (query) {
          setValue("")
          onReferenceSearch(matched.type, query)
          return
        }
      }
    }

    const nextValue = value
    const nextFiles = attachments.map((item) => item.file)
    setSending(true)
    setValue("")
    setAttachments((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview))
      return []
    })
    try {
      await onSend?.(nextValue, nextFiles)
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const hasContent = value.trim().length > 0
  const charRatio = Math.min(value.length / MAX_CHARS, 1)

  return (
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-32px)] max-w-[var(--composer-max-width)] -translate-x-1/2 md:bottom-6">
      <div>
        <div
          className={cls(
            "relative flex flex-col rounded-2xl border transition-colors shadow-[0_8px_40px_rgba(0,0,0,0.5)]",
            isFocused
              ? "border-accent/30 bg-[#111]/90 backdrop-blur-xl"
              : "border-white/[0.07] bg-[#111]/90 backdrop-blur-xl"
          )}
        >
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {attachments.map((item) => (
                <div key={item.id} className="group relative">
                  <img
                    src={item.preview}
                    alt={item.file.name || "attachment"}
                    className="h-20 w-20 rounded-md object-cover ring-1 ring-border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAttachments((prev) => {
                        const next = prev.filter((entry) => entry.id !== item.id)
                        URL.revokeObjectURL(item.preview)
                        return next
                      })
                    }}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-surface-primary p-0.5 text-ink-tertiary shadow-sm ring-1 ring-border-primary transition-colors hover:text-ink"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Slash command dropdown */}
          {showSlash && filteredCommands.length > 0 && (
            <div className="border-b border-border-secondary px-1.5 py-1.5">
              {filteredCommands.map((cmd, i) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.command}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSlashCommand(cmd)
                    }}
                    className={cls(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors",
                      i === slashIndex
                        ? "bg-surface-tertiary text-ink"
                        : "text-ink-secondary hover:bg-surface-tertiary"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{cmd.command}</span>
                      <span className="ml-1.5 text-xs text-ink-faint">{cmd.description}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setValue(e.target.value) }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe the clinical scenario... (or type / for commands)"
            rows={1}
            className="w-full resize-none bg-transparent px-3 pt-3 pb-2 text-sm leading-6 text-ink outline-none placeholder:text-ink-faint"
            onKeyDown={(e) => {
              if (showSlash && filteredCommands.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setSlashIndex((prev) => (prev + 1) % filteredCommands.length)
                  return
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
                  return
                }
                if (e.key === "Tab" && slashIndex >= 0) {
                  e.preventDefault()
                  handleSlashCommand(filteredCommands[slashIndex])
                  return
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length) return
                  setAttachments((prev) => [
                    ...prev,
                    ...files.map((file) => ({
                      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                      file,
                      preview: URL.createObjectURL(file),
                    })),
                  ])
                  e.target.value = ""
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink-secondary"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Image</span>
              </button>

              {hasContent && (
                <span className="hidden text-[11px] text-ink-faint sm:inline">
                  <kbd className="font-mono">Enter</kbd> to send
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Character counter */}
              {value.length > 2000 && (
                <span className={cls(
                  "font-mono text-[11px]",
                  charRatio > 0.9 ? "text-red" : "text-ink-faint"
                )}>
                  {MAX_CHARS - value.length}
                </span>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || busy || !hasContent}
                className={cls(
                  "inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  hasContent
                    ? "bg-accent text-accent-fg hover:opacity-90"
                    : "bg-surface-tertiary text-ink-faint cursor-not-allowed"
                )}
              >
                {sending || busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-1 text-center text-[11px] text-ink-faint opacity-60">
          AI-generated &middot; verify with primary sources
        </p>
      </div>
    </div>
  )
}
