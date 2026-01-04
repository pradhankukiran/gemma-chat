"use client"

import { useRef, useState, useEffect } from "react"
import { Send, Loader2, Sparkles, Mic, MicOff } from "lucide-react"
import { cls } from "./utils"

export default function Composer({ onSend, busy, value: controlledValue, onChange: onControlledChange }) {
  // Support both controlled and uncontrolled modes
  const [internalValue, setInternalValue] = useState("")
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = onControlledChange || setInternalValue

  const [sending, setSending] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 24
      const minHeight = 24

      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const calculatedLines = Math.max(1, Math.ceil(scrollHeight / lineHeight))

      setLineCount(calculatedLines)

      if (calculatedLines <= 12) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${12 * lineHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  // Focus textarea when value is set externally (e.g., from quick action)
  useEffect(() => {
    if (controlledValue && controlledValue.length > 0 && inputRef.current) {
      inputRef.current.focus()
      // Move cursor to end
      inputRef.current.setSelectionRange(controlledValue.length, controlledValue.length)
    }
  }, [controlledValue])

  async function handleSend() {
    if (!value.trim() || sending) return
    const nextValue = value
    setSending(true)
    setValue("")
    try {
      await onSend?.(nextValue)
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const hasContent = value.trim().length > 0
  const isMultiline = lineCount > 1

  return (
    <div className="border-t border-slate-200/80 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl">
        <div
          className={cls(
            "relative flex flex-col rounded-xl border bg-white shadow-sm transition-all duration-200 dark:bg-slate-800",
            isFocused
              ? "border-[#1e3a5f] ring-2 ring-[#1e3a5f]/20 dark:border-blue-500 dark:ring-blue-500/20"
              : "border-slate-200 dark:border-slate-700"
          )}
        >
          {/* Textarea area */}
          <div className="flex-1 px-4 pt-4 pb-2">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Describe the clinical scenario..."
              rows={1}
              className={cls(
                "w-full resize-none bg-transparent text-sm outline-none transition-all duration-200",
                "min-h-[24px] text-left leading-6 text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 dark:border-slate-700">
            {/* Helper text & keyboard hint */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI-powered clinical insights</span>
              </div>
              {hasContent && (
                <div className="hidden items-center gap-1 text-[10px] text-slate-400 sm:flex">
                  <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-700">
                    Enter
                  </kbd>
                  <span>to send</span>
                  <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                  <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-700">
                    Shift+Enter
                  </kbd>
                  <span>for newline</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Character count for long messages */}
              {value.length > 500 && (
                <span className={cls(
                  "text-[10px] tabular-nums",
                  value.length > 4000 ? "text-red-500" : "text-slate-400"
                )}>
                  {value.length.toLocaleString()}
                </span>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || busy || !hasContent}
                className={cls(
                  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                  hasContent
                    ? "bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white shadow-sm hover:from-[#2d4a6f] hover:to-[#3b6998] hover:shadow-md active:scale-[0.98]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                )}
              >
                {sending || busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Analyzing</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  )
}
