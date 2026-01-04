"use client"

import { useState, useEffect, useRef } from "react"
import { Pencil, RefreshCw, Check, X, AlertCircle, Loader2 } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import QuickActions from "./QuickActions"
import ClinicalMarkdown from "./ClinicalMarkdown"
import { cls } from "./utils"

export default function ChatPane({ conversation, onSend, onEditMessage, onResendMessage }) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true)
  const [composerValue, setComposerValue] = useState("")
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
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
    onResendMessage?.(editingId)
    cancelEdit()
  }

  const handleQuickAction = (template) => {
    setComposerValue(template)
  }

  const handleSend = async (text, files = []) => {
    if (!text.trim()) return
    setBusy(true)
    setComposerValue("")
    await onSend?.(text, files)
    setBusy(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* Quick Actions - Show only when no messages or collapsed */}
      {messages.length === 0 && (
        <QuickActions
          onSelectTemplate={handleQuickAction}
          isExpanded={quickActionsExpanded}
          onToggleExpand={() => setQuickActionsExpanded(!quickActionsExpanded)}
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                How can I help?
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Use the quick actions above or describe a clinical scenario.
              </p>

              {/* Example prompts */}
              <div className="mt-8 w-full max-w-md space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Example queries
                </p>
                {[
                  "55M with acute chest pain radiating to left arm, diaphoretic",
                  "Drug interaction check: Warfarin + Amiodarone",
                  "Pediatric dosing for amoxicillin, 8yo, 25kg, otitis media",
                  "New-onset headache with neck stiffness, 27F, febrile",
                  "Antibiotic choice for CAP, penicillin allergy, outpatient",
                  "COPD exacerbation: initial management and discharge criteria",
                  "Stroke LKW 2 hours, BP 190/100, NIHSS 8",
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setComposerValue(example)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-[#1e3a5f]/30 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-slate-700"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, index) => (
                <div key={m.id} className="space-y-2">
                  {editingId === m.id ? (
                    <div className="rounded-xl border border-[#1e3a5f]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-blue-500"
                        rows={3}
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#2d4a6f]"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={saveAndResend}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Message role={m.role}>
                      {m.role === "assistant" && !m.content?.trim() ? (
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-[#1e3a5f] [animation-delay:-0.3s]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-[#1e3a5f] [animation-delay:-0.15s]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-[#1e3a5f]" />
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Analyzing clinical data...
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed">
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
                                        className="h-32 w-full rounded-lg border border-white/10 object-cover"
                                      />
                                      {m.imagesUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/35 text-[11px] font-medium text-white">
                                          <div className="flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span>Uploading…</span>
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
                        <div className="mt-2 flex gap-3 border-t border-white/10 pt-2 text-[11px]">
                          <button
                            className="inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                            onClick={() => startEdit(m)}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            className="inline-flex items-center gap-1 text-white/70 transition hover:text-white"
                            onClick={() => onResendMessage?.(m.id)}
                          >
                            <RefreshCw className="h-3 w-3" /> Resend
                          </button>
                        </div>
                      )}
                    </Message>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <Composer
        onSend={handleSend}
        busy={busy}
        value={composerValue}
        onChange={setComposerValue}
      />
    </div>
  )
}
