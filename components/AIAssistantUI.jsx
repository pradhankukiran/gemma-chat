"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Sidebar from "./Sidebar"
import ChatPane from "./ChatPane"
import ReferencePanel from "./ReferencePanel"
import { searchDrugLabels, searchAdverseEvents, searchPubMed, searchICD11, searchRxNorm } from "../lib/medical-apis"

const GENERATION_DEFAULTS = { max_new_tokens: 512, temperature: 0.7, top_p: 0.95 }
const DEFAULT_COLLAPSED = { pinned: true, recent: false }
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
          console.warn("localStorage quota exceeded. Conversations may not be fully saved.")
        } else {
          console.warn("Failed to persist conversations:", e)
        }
      }
    }, SAVE_DEBOUNCE_MS)
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(DEFAULT_COLLAPSED)
  useEffect(() => {
    if (!prefsLoaded) return
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch (e) {
      console.warn("Failed to persist sidebar collapsed state:", e)
    }
  }, [collapsed, prefsLoaded])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [referencePanel, setReferencePanel] = useState({
    open: false,
    activeTab: "drug",
    data: {},
    query: "",
  })

  const handleReferenceSearch = useCallback(async (type, query) => {
    if (!query?.trim()) return

    const tabMap = { drug: "drug", evidence: "evidence", icd: "icd", adverse: "adverse" }
    const tab = tabMap[type] || "drug"

    setReferencePanel((prev) => ({
      ...prev,
      open: true,
      activeTab: tab,
      query: query.trim(),
      data: { ...prev.data, [tab]: { loading: true, results: null, error: null } },
    }))

    try {
      let result
      if (type === "drug") {
        const [labels, rxnorm] = await Promise.all([
          searchDrugLabels(query),
          searchRxNorm(query),
        ])
        if (labels.error && rxnorm.error) {
          result = { error: labels.error }
        } else {
          result = { results: labels.results || [], rxNorm: rxnorm }
        }
      } else if (type === "evidence") {
        result = await searchPubMed(query)
      } else if (type === "icd") {
        result = await searchICD11(query)
      } else if (type === "adverse") {
        result = await searchAdverseEvents(query)
      }

      setReferencePanel((prev) => ({
        ...prev,
        data: { ...prev.data, [tab]: { ...result, loading: false } },
      }))
    } catch (err) {
      setReferencePanel((prev) => ({
        ...prev,
        data: { ...prev.data, [tab]: { error: err.message, loading: false } },
      }))
    }
  }, [])

  useEffect(() => {
    if (!prefsLoaded) return
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch (e) {
      console.warn("Failed to persist sidebar collapsed state:", e)
    }
  }, [sidebarCollapsed, prefsLoaded])

  useEffect(() => {
    try {
      const rawCollapsed = localStorage.getItem("sidebar-collapsed")
      if (rawCollapsed) setCollapsed(JSON.parse(rawCollapsed))
      const rawSidebar = localStorage.getItem("sidebar-collapsed-state")
      if (rawSidebar) setSidebarCollapsed(JSON.parse(rawSidebar))
    } catch (e) {
      console.warn("Failed to load sidebar preferences:", e)
    }

    // Load persisted conversations
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
      .catch((e) => { if (e?.name !== "AbortError") console.warn("Warmup request failed:", e) })
      .finally(() => clearTimeout(timeout))

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [apiBase])

  useEffect(() => {
    return () => {
      activeRequestRef.current?.controller?.abort()
      clearTimeout(saveTimerRef.current)
    }
  }, [])

  const [conversations, setConversations] = useState([])
  const conversationsRef = useRef(conversations)
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!prefsLoaded) return
    if (streamingRef.current) return
    saveConversations(conversations, selectedId)
  }, [conversations, selectedId, prefsLoaded, saveConversations])

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)


  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen, conversations])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || (c.preview || "").toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

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
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    )
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
    setSidebarOpen(false)
  }


  async function uploadImages(files) {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    const res = await fetch("/api/blob", { method: "POST", body: formData })
    if (!res.ok) {
      throw new Error(`Image upload failed: ${res.status}`)
    }
    const data = await res.json()
    const urls = Array.isArray(data?.files) ? data.files.map((file) => file.url).filter(Boolean) : []
    if (!urls.length) {
      throw new Error("No image URLs returned from upload")
    }
    return urls
  }

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
        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview: content.slice(0, 80),
        }
      }),
    )

    if (activeRequestRef.current?.controller) {
      activeRequestRef.current.controller.abort()
    }

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
        if (activeRequestRef.current?.assistantId === assistantId) {
          activeRequestRef.current = null
        }
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

      if (!res.ok || !res.body) {
        throw new Error(`Streaming request failed: ${res.status}`)
      }

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
      if (activeRequestRef.current?.assistantId === assistantId) {
        activeRequestRef.current = null
      }
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
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
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

  useEffect(() => {
    if (prefsLoaded && !selectedId && conversations.length === 0) {
      createNewChat()
    }
  }, [prefsLoaded])

  const selected = conversations.find((c) => c.id === selectedId) || null

  return (
    <div className="flex h-screen w-full bg-surface-primary text-ink">
      <div className="flex min-h-0 flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          togglePin={togglePin}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createNewChat={createNewChat}
        />

        <main className="relative flex min-w-0 flex-1 flex-col pl-14 md:pl-0">
          <ChatPane
            conversation={selected}
            onSend={(content, files) => selected && sendMessage(selected.id, content, files)}
            onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId, content) => selected && resendMessage(selected.id, messageId, content)}
            onReferenceSearch={handleReferenceSearch}
          />
        </main>

        <ReferencePanel
          referencePanel={referencePanel}
          setReferencePanel={setReferencePanel}
        />
      </div>
    </div>
  )
}
