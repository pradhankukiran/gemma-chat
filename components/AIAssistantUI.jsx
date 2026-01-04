"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Sidebar from "./Sidebar"
import ChatPane from "./ChatPane"

export default function AIAssistantUI() {
  const apiBase = process.env.NEXT_PUBLIC_MODAL_API_BASE || "https://pradhankukiran--medgemma-modal-api-fastapi-app.modal.run"
  const generationDefaults = { max_new_tokens: 512, temperature: 0.7, top_p: 0.95 }
  const activeRequestRef = useRef(null)
  const warmupRef = useRef(false)
  const defaultCollapsed = { pinned: true, recent: false }
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  const [theme, setTheme] = useState("light")

  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      if (prefsLoaded) localStorage.setItem("theme", theme)
    } catch {}
  }, [theme, prefsLoaded])

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme) {
        setTheme(savedTheme)
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark")
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      if (!media) return
      const listener = (e) => {
        const saved = localStorage.getItem("theme")
        if (!saved) setTheme(e.matches ? "dark" : "light")
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    } catch {}
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  useEffect(() => {
    if (!prefsLoaded) return
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed, prefsLoaded])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!prefsLoaded) return
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed, prefsLoaded])

  useEffect(() => {
    try {
      const rawCollapsed = localStorage.getItem("sidebar-collapsed")
      if (rawCollapsed) setCollapsed(JSON.parse(rawCollapsed))
      const rawSidebar = localStorage.getItem("sidebar-collapsed-state")
      if (rawSidebar) setSidebarCollapsed(JSON.parse(rawSidebar))
    } catch {}
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
    fetch(`${apiBase}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .catch(() => {})
      .finally(() => clearTimeout(timeout))

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [apiBase])

  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)

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
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function createNewChat() {
    const id = Math.random().toString(36).slice(2)
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
    const userId = Math.random().toString(36).slice(2)
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
    const assistantId = Math.random().toString(36).slice(2)
    const assistantMsg = { id: assistantId, role: "assistant", content: "", createdAt: now }
    const conv = conversations.find((c) => c.id === convId)
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
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = (c.messages || []).map((m) =>
              m.id === userId ? { ...m, imagesUploading: false } : m
            )
            return { ...c, messages: msgs }
          }),
        )
      } catch (err) {
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

    const payload = { messages: history, ...generationDefaults }
    const endpoint = imageUrls.length ? "chat_image_stream" : "chat_stream"
    if (imageUrls.length) payload.image_urls = imageUrls

    let fullText = ""

    try {
      const res = await fetch(`${apiBase}/${endpoint}`, {
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
          const dataLines = []
          for (const line of lines) {
            if (!line.startsWith("data:")) continue
            dataLines.push(line.replace(/^data:\s?/, ""))
          }
          if (dataLines.length) {
            const data = dataLines.join("\n")
            if (dataLines.length === 1 && data.trim() === "[DONE]") {
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

  function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  useEffect(() => {
    if (!selectedId) {
      createNewChat()
    }
  }, [])

  const selected = conversations.find((c) => c.id === selectedId) || null

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-[calc(100vh-0px)] w-full">
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
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createNewChat={createNewChat}
        />

        {/* Main content - add left padding on mobile for collapsed sidebar */}
        <main className="relative flex min-w-0 flex-1 flex-col pl-16 md:pl-0">
          <ChatPane
            conversation={selected}
            onSend={(content, files) => selected && sendMessage(selected.id, content, files)}
            onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
          />
        </main>
      </div>
    </div>
  )
}
