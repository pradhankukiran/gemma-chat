"use client"
import { motion, AnimatePresence } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen, SearchIcon, Plus, Star, Clock, FolderIcon } from "lucide-react"
import SidebarSection from "./SidebarSection"
import ConversationRow from "./ConversationRow"
import SearchModal from "./SearchModal"
import { cls } from "./utils"
import { useState } from "react"

export default function Sidebar({
  open,
  onClose,
  collapsed,
  setCollapsed,
  conversations,
  pinned,
  recent,
  selectedId,
  onSelect,
  togglePin,
  query,
  setQuery,
  searchRef,
  createNewChat,
  sidebarCollapsed = false,
  setSidebarCollapsed = () => {},
}) {
  const [showSearchModal, setShowSearchModal] = useState(false)

  const handleSearchClick = () => {
    setShowSearchModal(true)
  }

  const handleNewChatClick = () => {
    createNewChat()
  }

  const handleExpandSidebar = () => {
    setSidebarCollapsed(false)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 320 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className={cls(
          "relative z-50 flex h-full shrink-0 overflow-hidden border-r border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          "fixed inset-y-0 left-0 md:static md:translate-x-0 transform transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <motion.div
          className="absolute inset-0 flex h-full w-80 flex-col"
          animate={{ opacity: sidebarCollapsed ? 0 : 1, x: sidebarCollapsed ? -12 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: sidebarCollapsed ? "none" : "auto" }}
        >
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={createNewChat}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-zinc-900"
                title="New Chat (⌘N)"
              >
                <Plus className="h-4 w-4" /> Start New Chat
              </button>

              <button
                onClick={() => setSidebarCollapsed(true)}
                className="hidden md:inline-flex items-center justify-center rounded-full p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Close sidebar"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>

              <button
                onClick={onClose}
                className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-3 pt-3">
            <label htmlFor="search" className="sr-only">
              Search conversations
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                id="search"
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                onClick={() => setShowSearchModal(true)}
                onFocus={() => setShowSearchModal(true)}
                className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950/50"
              />
            </div>
          </div>

          <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
            <SidebarSection
              icon={<Star className="h-4 w-4" />}
              title="PINNED CHATS"
              collapsed={collapsed.pinned}
              onToggle={() => setCollapsed((s) => ({ ...s, pinned: !s.pinned }))}
            >
              {pinned.length === 0 ? (
                <div className="select-none rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Pin important threads for quick access.
                </div>
              ) : (
                pinned.map((c) => (
                  <ConversationRow
                    key={c.id}
                    data={c}
                    active={c.id === selectedId}
                    onSelect={() => onSelect(c.id)}
                    onTogglePin={() => togglePin(c.id)}
                  />
                ))
              )}
            </SidebarSection>

            <SidebarSection
              icon={<Clock className="h-4 w-4" />}
              title="RECENT"
              collapsed={collapsed.recent}
              onToggle={() => setCollapsed((s) => ({ ...s, recent: !s.recent }))}
            >
              {recent.length === 0 ? (
                <div className="select-none rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  No conversations yet. Start a new one!
                </div>
              ) : (
                recent.map((c) => (
                  <ConversationRow
                    key={c.id}
                    data={c}
                    active={c.id === selectedId}
                    onSelect={() => onSelect(c.id)}
                    onTogglePin={() => togglePin(c.id)}
                    showMeta
                  />
                ))
              )}
            </SidebarSection>
          </nav>
        </motion.div>

        <motion.div
          className="absolute inset-0 flex h-full w-16 flex-col"
          animate={{ opacity: sidebarCollapsed ? 1 : 0, x: sidebarCollapsed ? 0 : 12 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: sidebarCollapsed ? "auto" : "none" }}
        >
          <div className="flex items-center justify-center border-b border-zinc-200/60 px-3 py-3 dark:border-zinc-800">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="rounded-xl p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2 pt-4">
            <button
              onClick={handleNewChatClick}
              className="rounded-xl p-2.5 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800 transition-colors"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>

            <button
              onClick={handleSearchClick}
              className="rounded-xl p-2.5 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800 transition-colors"
              title="Search chats"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleExpandSidebar}
              className="rounded-xl p-2.5 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800 transition-colors"
              title="Expand sidebar"
            >
              <FolderIcon className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </motion.aside>

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelect}
        togglePin={togglePin}
        createNewChat={createNewChat}
      />
    </>
  )
}
