"use client"

import { useState, useEffect, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Loader2, AlertTriangle } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import QuickActions from "./QuickActions"
import ClinicalMarkdown from "./ClinicalMarkdown"
import { cls } from "./utils"

const EXAMPLE_QUERIES = [
  "55M with acute chest pain radiating to left arm, diaphoretic",
  "Drug interaction check: Warfarin + Amiodarone",
  "Pediatric dosing for amoxicillin, 8yo, 25kg, otitis media",
  "COPD exacerbation: initial management and discharge criteria",
  "Stroke LKW 2 hours, BP 190/100, NIHSS 8",
]

export default function ChatPane({ conversation, onSend, onEditMessage, onResendMessage, onReferenceSearch }) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [composerValue, setComposerValue] = useState("")
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation?.messages?.length])

  if (!conversation) return null

  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId, draft)
    cancelEdit()
  }

  const handleQuickAction = (template) => {
    setComposerValue(template)
  }

  const handleSend = async (text, files = []) => {
    if (!text.trim()) return
    setBusy(true)
    setComposerValue("")
    try {
      await onSend?.(text, files)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6">
        {messages.length === 0 ? (
          /* ── Welcome Screen ── */
          <div className="mx-auto max-w-2xl animate-fade-in">
            {/* Minimal hero */}
            <div className="pb-5 pt-4 sm:pt-8">
              <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Clinical decision support,<br />
                <span className="text-ink-tertiary">powered by MedGemma.</span>
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-secondary">
                Ask about differential diagnosis, drug interactions, dosing calculations, lab interpretation, and clinical workflows.
              </p>
            </div>

            {/* Disclaimer — tight, inline */}
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber/20 bg-amber-light px-3 py-2 text-[13px] leading-relaxed">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <p className="text-ink-secondary">
                <span className="font-medium text-ink">Clinical reference tool.</span>{" "}
                Verify suggestions with primary sources and clinical judgment.
              </p>
            </div>

            {/* Quick Actions — horizontal, compact */}
            <div className="mb-5">
              <QuickActions onSelectTemplate={handleQuickAction} />
            </div>

            {/* Example queries — simple list, not cards */}
            <div>
              <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                Try asking
              </h3>
              <div className="flex flex-col gap-1">
                {EXAMPLE_QUERIES.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setComposerValue(example)}
                    className="rounded-md px-2.5 py-1.5 text-left text-sm text-ink-secondary transition-colors hover:bg-surface-tertiary hover:text-ink"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Chat Messages ── */
          <div className="mx-auto max-w-2xl space-y-0">
            {messages.map((m, index) => {
              const isLastAssistant = m.role === "assistant" && index === messages.length - 1
              const isStreaming = isLastAssistant && !m.content?.trim()

              return (
                <div key={m.id}>
                  {editingId === m.id ? (
                    <div className="rounded-lg border border-border-primary bg-surface-secondary p-4">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full resize-y rounded-md border border-border-primary bg-surface-primary p-3 text-sm text-ink outline-none focus:border-border-focus"
                        rows={3}
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:opacity-90"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={saveAndResend}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface-tertiary"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Message
                      role={m.role}
                      createdAt={m.createdAt}
                      content={m.content}
                      onReferenceSearch={onReferenceSearch}
                      onRegenerate={m.role === "assistant" ? () => {
                        const msgIndex = messages.findIndex((msg) => msg.id === m.id)
                        for (let i = msgIndex - 1; i >= 0; i--) {
                          if (messages[i].role === "user") {
                            onResendMessage?.(messages[i].id)
                            break
                          }
                        }
                      } : undefined}
                    >
                      {m.role === "assistant" && !m.content?.trim() ? (
                        <div className="flex items-center gap-2.5 py-2">
                          <div className="flex items-center gap-1">
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                          </div>
                          <span className="text-sm text-ink-tertiary">Thinking...</span>
                        </div>
                      ) : (
                        <div className={cls("text-sm leading-relaxed", isLastAssistant && busy && "streaming-cursor")}>
                          {m.role === "assistant" ? (
                            <ClinicalMarkdown content={m.content} />
                          ) : (
                            <>
                              {Array.isArray(m.images) && m.images.length > 0 && (
                                <div className="mb-2 grid gap-2 sm:grid-cols-2">
                                  {m.images.map((url, idx) => (
                                    <div key={`${url}-${idx}`} className="relative">
                                      <img
                                        src={url}
                                        alt="attachment"
                                        className="aspect-square w-full rounded-lg object-cover ring-1 ring-border-primary"
                                      />
                                      {m.imagesUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-[11px] font-medium text-white">
                                          <div className="flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span>Uploading...</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </>
                          )}
                        </div>
                      )}
                      {m.role === "user" && (
                        <div className="mt-1 flex gap-3 text-[11px]">
                          <button
                            className="text-ink-faint transition-colors hover:text-ink-secondary"
                            onClick={() => startEdit(m)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-ink-faint transition-colors hover:text-ink-secondary"
                            onClick={() => onResendMessage?.(m.id)}
                          >
                            Resend
                          </button>
                        </div>
                      )}
                    </Message>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <Composer
        onSend={handleSend}
        busy={busy}
        value={composerValue}
        onChange={setComposerValue}
        onReferenceSearch={onReferenceSearch}
      />
    </div>
  )
}
