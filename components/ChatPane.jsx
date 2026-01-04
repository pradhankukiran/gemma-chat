"use client"

import { useState, useEffect, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Clock, AlertCircle } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import QuickActions from "./QuickActions"
import ClinicalMarkdown from "./ClinicalMarkdown"
import { cls, timeAgo } from "./utils"

export default function ChatPane({ conversation, onSend, onEditMessage, onResendMessage }) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true)
  const [composerValue, setComposerValue] = useState("")
  const messagesEndRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation?.messages?.length])

  if (!conversation) return null

  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

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

  const handleSend = async (text) => {
    if (!text.trim()) return
    setBusy(true)
    setComposerValue("")
    await onSend?.(text)
    setBusy(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* Session Header */}
      <div className="border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {conversation.title}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {mounted ? timeAgo(conversation.updatedAt) : "recently"}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{count} {count === 1 ? "message" : "messages"}</span>
            </div>
          </div>
          {/* Session indicator */}
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Session
          </div>
        </div>
      </div>

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
                            <p className="whitespace-pre-wrap">{m.content}</p>
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

      {/* Disclaimer Banner */}
      <div className="border-t border-amber-200/50 bg-amber-50/50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>For clinical decision support only. Always verify with authoritative sources.</span>
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
