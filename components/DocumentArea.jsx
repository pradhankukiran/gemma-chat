"use client"

import { useRef, useEffect, useState } from "react"
import { RefreshCw, Pencil, Check, X, Loader2 } from "lucide-react"
import ClinicalMarkdown from "./ClinicalMarkdown"
import CopyButton from "./CopyButton"
import MessageActions from "./MessageActions"
import { cls } from "./utils"

const EXAMPLE_QUERIES = [
  "55M with acute chest pain radiating to left arm, diaphoretic",
  "Drug interaction check: Warfarin + Amiodarone",
  "Pediatric dosing for amoxicillin, 8yo, 25kg, otitis media",
  "COPD exacerbation management and discharge criteria",
]

export default function DocumentArea({
  turn,
  isStreaming,
  isLatestTurn,
  onEditMessage,
  onResendMessage,
  onReferenceSearch,
  onSend,
  composerValue,
  setComposerValue,
}) {
  const scrollRef = useRef(null)
  const prevTurnRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState("")

  useEffect(() => {
    const turnId = turn?.userMsg?.id
    if (turnId && turnId !== prevTurnRef.current) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
    prevTurnRef.current = turnId
  }, [turn?.userMsg?.id])

  useEffect(() => {
    if (isStreaming && isLatestTurn && scrollRef.current) {
      const el = scrollRef.current
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight })
      }
    }
  })

  // ── Welcome screen — centered, minimal, dramatic ──
  if (!turn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-w-0 px-6">
        <div className="w-full max-w-xl animate-fade-in">
          {/* Brand mark */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-ink-faint tracking-wide uppercase">MedGemma</span>
          </div>

          {/* Hero */}
          <h1 className="text-[36px] font-bold leading-[1.1] tracking-tight text-white md:text-[44px]">
            What clinical question<br />
            <span className="text-ink-faint">can I help with?</span>
          </h1>

          {/* Examples as subtle, clickable lines */}
          <div className="mt-10 flex flex-col gap-0">
            {EXAMPLE_QUERIES.map((example, i) => (
              <button
                key={i}
                onClick={() => setComposerValue?.(example)}
                className="group flex items-center gap-3 border-b border-border-secondary py-3.5 text-left transition-colors first:border-t hover:bg-white/[0.02]"
              >
                <span className="font-mono text-[11px] text-ink-faint/50 transition-colors group-hover:text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] text-ink-tertiary transition-colors group-hover:text-ink-secondary">
                  {example}
                </span>
              </button>
            ))}
          </div>

          {/* Keyboard hint */}
          <div className="mt-6 flex items-center gap-4 text-[11px] text-ink-faint/60">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border-primary bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">Cmd+K</kbd>
              sessions
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border-primary bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
              commands
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Document view ──
  const { userMsg, assistantMsg } = turn
  const content = assistantMsg?.content || ""
  const isEmpty = !content.trim()
  const showStreamingIndicator = isEmpty && isStreaming && isLatestTurn

  function startEdit() {
    setEditing(true)
    setEditDraft(userMsg.content)
  }
  function cancelEdit() {
    setEditing(false)
    setEditDraft("")
  }
  function saveEdit() {
    onEditMessage?.(userMsg.id, editDraft)
    setEditing(false)
    setEditDraft("")
  }
  function saveAndResend() {
    onEditMessage?.(userMsg.id, editDraft)
    onResendMessage?.(userMsg.id, editDraft)
    setEditing(false)
    setEditDraft("")
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-16 pt-8 md:pt-12 pb-36">
        <div className="mx-auto max-w-[var(--document-max-width)]">
          {/* Context line */}
          <div className="mb-6 border-b border-border-primary pb-3">
            {editing ? (
              <div>
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="w-full resize-y rounded-md border border-border-primary bg-surface-secondary p-3 text-sm text-ink outline-none focus:border-border-focus"
                  rows={3}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={saveEdit} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90">
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                  <button onClick={saveAndResend} className="inline-flex items-center gap-1.5 rounded-md border border-border-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-tertiary">
                    <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                  </button>
                  <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-ink-tertiary hover:bg-surface-tertiary hover:text-ink">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-baseline gap-2 text-[13px]">
                  <span className="text-ink-faint">Responding to:</span>
                  <span className="italic text-ink-secondary">{userMsg.content}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={startEdit} className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-ink-faint hover:bg-surface-tertiary hover:text-ink-secondary">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => onResendMessage?.(userMsg.id)} className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-ink-faint hover:bg-surface-tertiary hover:text-ink-secondary">
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Image attachments */}
          {Array.isArray(userMsg.images) && userMsg.images.length > 0 && (
            <div className="mb-6 grid gap-2 sm:grid-cols-2">
              {userMsg.images.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative">
                  <img src={url} alt="attachment" className="aspect-square w-full rounded-lg object-cover ring-1 ring-border-primary" />
                  {userMsg.imagesUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-[11px] font-medium text-white">
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Uploading...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Streaming indicator */}
          {showStreamingIndicator && (
            <div className="flex items-center gap-2.5 py-12">
              <div className="flex items-center gap-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span className="text-sm text-ink-tertiary">Thinking...</span>
            </div>
          )}

          {/* Document content */}
          {!isEmpty && (
            <>
              <div className={cls("leading-relaxed", isLatestTurn && isStreaming && "streaming-cursor")}>
                <ClinicalMarkdown content={content} />
              </div>

              {isLatestTurn && isStreaming && <div className="streaming-line mt-4" />}

              {!isStreaming && (
                <div className="mt-8 border-t border-border-primary pt-4">
                  <div className="flex items-center gap-2">
                    <CopyButton text={content} size="xs" />
                    <button
                      onClick={() => onResendMessage?.(userMsg.id)}
                      className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-ink-faint hover:bg-surface-tertiary hover:text-ink-secondary"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <MessageActions content={content} onReferenceSearch={onReferenceSearch} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
