"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { List } from "lucide-react"
import ThreadStrip from "./ThreadStrip"
import DocumentArea from "./DocumentArea"
import Composer from "./Composer"
import SearchModal from "./SearchModal"
import { extractTurns } from "./utils"
import { searchDrugLabels, searchAdverseEvents, searchPubMed, searchICD11, searchRxNorm } from "../lib/medical-apis"

const GENERATION_DEFAULTS = { max_new_tokens: 512, temperature: 0.7, top_p: 0.95 }
const STORAGE_KEY_CONVERSATIONS = "medgemma-conversations"
const STORAGE_KEY_SELECTED = "medgemma-selectedId"
const SAVE_DEBOUNCE_MS = 400

export default function AIAssistantUI() {
  const apiBase = "/api/chat"
  const activeRequestRef = useRef(null)
  const warmupRef = useRef(false)
  const saveTimerRef = useRef(null)
  const streamingRef = useRef(false)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  // ── Persistence ──
  const saveConversations = useCallback((convs, selId) => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        const cleaned = convs.map((c) => ({
          ...c,
          messages: (c.messages || []).map(({ imagesUploading, ...rest }) => rest),
        }))
        localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(cleaned))
        localStorage.setItem(STORAGE_KEY_SELECTED, selId || "")
      } catch (e) {
        if (e?.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded.")
        } else {
          console.warn("Failed to persist conversations:", e)
        }
      }
    }, SAVE_DEBOUNCE_MS)
  }, [])

  // ── State ──
  const [conversations, setConversations] = useState([])
  const conversationsRef = useRef(conversations)
  useEffect(() => { conversationsRef.current = conversations }, [conversations])

  const [selectedId, setSelectedId] = useState(null)
  const [activeTurnIndex, setActiveTurnIndex] = useState(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false)
  const [composerValue, setComposerValue] = useState("")
  const [busy, setBusy] = useState(false)
  const searchRef = useRef(null)

  // ── Reference search (kept for slash commands & MessageActions) ──
  const handleReferenceSearch = useCallback(async (type, query) => {
    if (!query?.trim()) return
    // For now, reference searches still work via slash commands in composer
    // The data flows into the console/future inline cards
    try {
      let result
      if (type === "drug") {
        const [labels, rxnorm] = await Promise.all([searchDrugLabels(query), searchRxNorm(query)])
        result = labels.error && rxnorm.error ? { error: labels.error } : { results: labels.results || [], rxNorm: rxnorm }
      } else if (type === "evidence") {
        result = await searchPubMed(query)
      } else if (type === "icd") {
        result = await searchICD11(query)
      } else if (type === "adverse") {
        result = await searchAdverseEvents(query)
      }
      console.log(`Reference search [${type}]:`, result)
    } catch (err) {
      console.warn("Reference search failed:", err)
    }
  }, [])

  // ── Load persisted state ──
  useEffect(() => {
    let loadedConversations = []
    let loadedSelectedId = null
    try {
      const rawConvs = localStorage.getItem(STORAGE_KEY_CONVERSATIONS)
      if (rawConvs) {
        const parsed = JSON.parse(rawConvs)
        if (Array.isArray(parsed)) {
          loadedConversations = parsed.map((c) => ({
            ...c,
            messages: (c.messages || []).map(({ imagesUploading, ...rest }) => rest),
          }))
        }
      }
      const rawSel = localStorage.getItem(STORAGE_KEY_SELECTED)
      if (rawSel) loadedSelectedId = rawSel
    } catch (e) {
      console.warn("Failed to load conversations:", e)
    }

    if (loadedConversations.length > 0) {
      setConversations(loadedConversations)
      conversationsRef.current = loadedConversations
      const valid = loadedConversations.some((c) => c.id === loadedSelectedId)
      setSelectedId(valid ? loadedSelectedId : loadedConversations[0].id)
    }

    setPrefsLoaded(true)
  }, [])

  // ── Warmup ──
  useEffect(() => {
    if (warmupRef.current) return
    warmupRef.current = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const payload = {
      messages: [{ role: "user", content: "warmup" }],
      max_new_tokens: 1,
      temperature: 0,
      top_p: 1,
      system_prompt: "",
    }
    fetch(`${apiBase}?endpoint=chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .catch((e) => { if (e?.name !== "AbortError") console.warn("Warmup failed:", e) })
      .finally(() => clearTimeout(timeout))

    return () => { clearTimeout(timeout); controller.abort() }
  }, [apiBase])

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      activeRequestRef.current?.controller?.abort()
      clearTimeout(saveTimerRef.current)
    }
  }, [])

  // ── Auto-save ──
  useEffect(() => {
    if (!prefsLoaded) return
    if (streamingRef.current) return
    saveConversations(conversations, selectedId)
  }, [conversations, selectedId, prefsLoaded, saveConversations])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setShowSearchModal((v) => !v)
      }
      if (e.key === "Escape" && showSearchModal) setShowSearchModal(false)
      if (e.key === "Escape" && mobileThreadOpen) setMobileThreadOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showSearchModal, conversations])

  // ── Conversation CRUD ──
  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function deleteConversation(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) {
      const remaining = conversationsRef.current.filter((c) => c.id !== id)
      setSelectedId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  function renameConversation(id, newTitle) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)))
  }

  function createNewChat() {
    const id = crypto.randomUUID()
    const item = {
      id,
      title: "New Clinical Session",
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      preview: "",
      pinned: false,
      messages: [],
    }
    setConversations((prev) => [item, ...prev])
    setSelectedId(id)
    setActiveTurnIndex(null)
    setShowSearchModal(false)
  }

  // ── Image upload ──
  async function uploadImages(files) {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    const res = await fetch("/api/blob", { method: "POST", body: formData })
    if (!res.ok) throw new Error(`Image upload failed: ${res.status}`)
    const data = await res.json()
    const urls = Array.isArray(data?.files) ? data.files.map((file) => file.url).filter(Boolean) : []
    if (!urls.length) throw new Error("No image URLs returned from upload")
    return urls
  }

  // ── Send message ──
  async function sendMessage(convId, content, files = []) {
    if (!content.trim()) return
    const now = new Date().toISOString()
    const userId = crypto.randomUUID()
    const localPreviews = Array.isArray(files) && files.length
      ? files.map((file) => URL.createObjectURL(file))
      : []
    const userMsg = {
      id: userId,
      role: "user",
      content,
      createdAt: now,
      images: localPreviews,
      imagesUploading: localPreviews.length > 0,
    }
    const assistantId = crypto.randomUUID()
    const assistantMsg = { id: assistantId, role: "assistant", content: "", createdAt: now }
    const conv = conversationsRef.current.find((c) => c.id === convId)
    const history = [...(conv?.messages || []), userMsg].map((m) => ({ role: m.role, content: m.content }))

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), userMsg, assistantMsg]
        return { ...c, messages: msgs, updatedAt: now, messageCount: msgs.length, preview: content.slice(0, 80) }
      }),
    )

    // Snap to latest turn
    setActiveTurnIndex(null)

    if (activeRequestRef.current?.controller) activeRequestRef.current.controller.abort()
    const controller = new AbortController()
    activeRequestRef.current = { controller, convId, assistantId }

    const updateAssistant = (text, finalize = false) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const msgs = (c.messages || []).map((m) => (m.id === assistantId ? { ...m, content: text } : m))
          return {
            ...c,
            messages: msgs,
            preview: finalize ? text.slice(0, 80) || c.preview : c.preview,
            updatedAt: finalize ? new Date().toISOString() : c.updatedAt,
          }
        }),
      )
    }

    let imageUrls = []
    if (Array.isArray(files) && files.length > 0) {
      try {
        imageUrls = await uploadImages(files)
        localPreviews.forEach((url) => URL.revokeObjectURL(url))
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = (c.messages || []).map((m) =>
              m.id === userId ? { ...m, imagesUploading: false, images: imageUrls } : m
            )
            return { ...c, messages: msgs }
          }),
        )
      } catch (err) {
        localPreviews.forEach((url) => URL.revokeObjectURL(url))
        updateAssistant("Unable to upload images. Please try again.", true)
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = (c.messages || []).map((m) =>
              m.id === userId ? { ...m, imagesUploading: false } : m
            )
            return { ...c, messages: msgs }
          }),
        )
        if (activeRequestRef.current?.assistantId === assistantId) activeRequestRef.current = null
        return
      }
    }

    const payload = { messages: history, ...GENERATION_DEFAULTS }
    const endpoint = imageUrls.length ? "chat_image_stream" : "chat_stream"
    if (imageUrls.length) payload.image_urls = imageUrls

    let fullText = ""
    streamingRef.current = true

    try {
      const res = await fetch(`${apiBase}?endpoint=${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) throw new Error(`Streaming request failed: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let boundary = buffer.indexOf("\n\n")
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)

          const lines = chunk.split("\n")
          for (const line of lines) {
            if (!line.startsWith("data:")) continue
            const data = line.replace(/^data:\s?/, "")
            if (data.trim() === "[DONE]") {
              updateAssistant(fullText, true)
              return
            }
            if (data) {
              fullText += data
              updateAssistant(fullText, false)
            }
          }
          boundary = buffer.indexOf("\n\n")
        }
      }
      updateAssistant(fullText, true)
    } catch (err) {
      if (err?.name === "AbortError") {
        updateAssistant(fullText || "(stopped)", true)
      } else {
        updateAssistant("Unable to connect to the clinical AI service. Please try again.", true)
      }
    } finally {
      streamingRef.current = false
      if (activeRequestRef.current?.assistantId === assistantId) activeRequestRef.current = null
    }
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return { ...c, messages: msgs, preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview }
      }),
    )
  }

  function resendMessage(convId, messageId, content) {
    if (content !== undefined) {
      sendMessage(convId, content)
      return
    }
    const conv = conversationsRef.current.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  // ── Auto-create first chat ──
  useEffect(() => {
    if (prefsLoaded && !selectedId && conversations.length === 0) createNewChat()
  }, [prefsLoaded])

  // ── Derived state ──
  const selected = conversations.find((c) => c.id === selectedId) || null
  const messages = selected?.messages || []
  const turns = useMemo(() => extractTurns(messages), [messages])
  const currentTurn = turns.length > 0
    ? (activeTurnIndex !== null ? turns[activeTurnIndex] : turns[turns.length - 1])
    : null
  const isLatestTurn = activeTurnIndex === null || activeTurnIndex === turns.length - 1
  const isStreaming = isLatestTurn && streamingRef.current && currentTurn?.assistantMsg && !currentTurn.assistantMsg.content?.trim()

  const handleSend = async (text, files = []) => {
    if (!text.trim() || !selected) return
    setBusy(true)
    setComposerValue("")
    try {
      await sendMessage(selected.id, text, files)
    } finally {
      setBusy(false)
    }
  }

  const handleSelectConversation = (id) => {
    setSelectedId(id)
    setActiveTurnIndex(null)
    setShowSearchModal(false)
  }

  const hasMessages = turns.length > 0

  return (
    <div className="flex h-screen w-full" style={{ background: "#0a0a0a", color: "var(--ink)" }}>
      {/* Mobile thread toggle — only when there are messages */}
      {hasMessages && (
        <button
          onClick={() => setMobileThreadOpen(true)}
          className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-[#111]/80 text-white/30 backdrop-blur-lg transition-colors hover:text-white/60 md:hidden"
        >
          <List className="h-4 w-4" />
        </button>
      )}

      {/* Mobile thread overlay */}
      <AnimatePresence>
        {mobileThreadOpen && (
          <>
            <motion.div
              key="thread-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileThreadOpen(false)}
            />
            <motion.div
              key="thread-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <ThreadStrip
                turns={turns}
                activeTurnIndex={activeTurnIndex}
                onSelectTurn={(index) => { setActiveTurnIndex(index); setMobileThreadOpen(false) }}
                onOpenCommandPalette={() => { setShowSearchModal(true); setMobileThreadOpen(false) }}
                onNewChat={() => { createNewChat(); setMobileThreadOpen(false) }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Thread Strip — desktop, only when there are messages */}
      {hasMessages && (
        <div className="hidden md:block">
          <ThreadStrip
            turns={turns}
            activeTurnIndex={activeTurnIndex}
            onSelectTurn={setActiveTurnIndex}
            onOpenCommandPalette={() => setShowSearchModal(true)}
            onNewChat={createNewChat}
          />
        </div>
      )}

      {/* Cmd+K hint — top right, when on welcome screen */}
      {!hasMessages && (
        <div className="fixed right-5 top-5 z-10 flex items-center gap-1.5 font-mono text-[11px] text-white/20">
          <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px]">Cmd</kbd>
          <span>+</span>
          <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px]">K</kbd>
          <span className="ml-1">sessions</span>
        </div>
      )}

      {/* Document Area */}
      <DocumentArea
        turn={hasMessages ? currentTurn : null}
        isStreaming={busy}
        isLatestTurn={isLatestTurn}
        onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
        onResendMessage={(messageId, content) => selected && resendMessage(selected.id, messageId, content)}
        onReferenceSearch={handleReferenceSearch}
        onSend={handleSend}
        composerValue={composerValue}
        setComposerValue={setComposerValue}
      />

      {/* Floating Composer */}
      <Composer
        onSend={handleSend}
        busy={busy}
        value={composerValue}
        onChange={setComposerValue}
        onReferenceSearch={handleReferenceSearch}
      />

      {/* Command Palette */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelectConversation}
        togglePin={togglePin}
        createNewChat={createNewChat}
      />
    </div>
  )
}
