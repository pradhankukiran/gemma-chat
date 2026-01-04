"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen, SearchIcon, Plus, Star, Clock, Stethoscope, Menu } from "lucide-react"
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
  onOpen,
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
      {/* Mobile overlay when full sidebar is open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile: Collapsed bar (always visible) */}
      <div className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 md:hidden">
        <div className="flex items-center justify-center border-b border-slate-200/80 px-3 py-3 dark:border-slate-800">
          <button
            onClick={onOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 pt-4">
          <button
            onClick={handleNewChatClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            title="New Session"
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            onClick={handleSearchClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            title="Search sessions"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            title="Expand sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile: Full sidebar (slides over as overlay) */}
      <aside
        className={cls(
          "fixed inset-y-0 left-0 z-50 flex h-full w-80 flex-col overflow-hidden border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white transition-transform duration-200 ease-out dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header with Logo */}
        <div className="border-b border-slate-200/80 px-4 py-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Gemma Chat</h1>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* New Session Button */}
        <div className="px-3 py-3">
          <button
            onClick={() => { createNewChat(); onClose?.(); }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-[#2d4a6f] hover:to-[#3b6998] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2"
            title="New Session"
          >
            <Plus className="h-4 w-4" />
            <span>New Clinical Session</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions..."
              onClick={() => setShowSearchModal(true)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
          <SidebarSection
            icon={<Star className="h-4 w-4 text-amber-500" />}
            title="SAVED SESSIONS"
            collapsed={collapsed.pinned}
            onToggle={() => setCollapsed((s) => ({ ...s, pinned: !s.pinned }))}
          >
            {pinned.length === 0 ? (
              <div className="select-none rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                <Star className="mx-auto mb-2 h-5 w-5 text-slate-300 dark:text-slate-600" />
                <p>Save important sessions.</p>
              </div>
            ) : (
              pinned.map((c) => (
                <ConversationRow
                  key={c.id}
                  data={c}
                  active={c.id === selectedId}
                  onSelect={() => { onSelect(c.id); onClose?.(); }}
                  onTogglePin={() => togglePin(c.id)}
                />
              ))
            )}
          </SidebarSection>

          <SidebarSection
            icon={<Clock className="h-4 w-4 text-slate-400" />}
            title="RECENT SESSIONS"
            collapsed={collapsed.recent}
            onToggle={() => setCollapsed((s) => ({ ...s, recent: !s.recent }))}
          >
            {recent.length === 0 ? (
              <div className="select-none rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                <Stethoscope className="mx-auto mb-2 h-5 w-5 text-slate-300 dark:text-slate-600" />
                <p>Sessions will appear here.</p>
              </div>
            ) : (
              recent.map((c) => (
                <ConversationRow
                  key={c.id}
                  data={c}
                  active={c.id === selectedId}
                  onSelect={() => { onSelect(c.id); onClose?.(); }}
                  onTogglePin={() => togglePin(c.id)}
                  showMeta
                />
              ))
            )}
          </SidebarSection>
        </nav>

      </aside>

      {/* Desktop: Full sidebar with collapse support */}
      <aside
        className={cls(
          "relative z-30 hidden h-full shrink-0 overflow-hidden border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white transition-[width] duration-200 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 md:flex md:flex-col",
          sidebarCollapsed ? "w-16" : "w-80"
        )}
      >
        {/* Expanded content */}
        <motion.div
          className="absolute inset-0 flex h-full w-80 flex-col"
          animate={{ opacity: sidebarCollapsed ? 0 : 1, x: sidebarCollapsed ? -12 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: sidebarCollapsed ? "none" : "auto" }}
        >
          {/* Header */}
          <div className="border-b border-slate-200/80 px-4 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Gemma Chat</h1>

              <button
                onClick={() => setSidebarCollapsed(true)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* New Session Button */}
          <div className="px-3 py-3">
            <button
              onClick={createNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-[#2d4a6f] hover:to-[#3b6998] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2"
              title="New Session (⌘N)"
            >
              <Plus className="h-4 w-4" />
              <span>New Clinical Session</span>
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <label htmlFor="search-desktop" className="sr-only">
              Search sessions
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="search-desktop"
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions..."
                onClick={() => setShowSearchModal(true)}
                onFocus={() => setShowSearchModal(true)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
            <SidebarSection
              icon={<Star className="h-4 w-4 text-amber-500" />}
              title="SAVED SESSIONS"
              collapsed={collapsed.pinned}
              onToggle={() => setCollapsed((s) => ({ ...s, pinned: !s.pinned }))}
            >
              {pinned.length === 0 ? (
                <div className="select-none rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                  <Star className="mx-auto mb-2 h-5 w-5 text-slate-300 dark:text-slate-600" />
                  <p>Save important clinical sessions for quick reference.</p>
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
              icon={<Clock className="h-4 w-4 text-slate-400" />}
              title="RECENT SESSIONS"
              collapsed={collapsed.recent}
              onToggle={() => setCollapsed((s) => ({ ...s, recent: !s.recent }))}
            >
              {recent.length === 0 ? (
                <div className="select-none rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                  <Stethoscope className="mx-auto mb-2 h-5 w-5 text-slate-300 dark:text-slate-600" />
                  <p>Your clinical sessions will appear here.</p>
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

        {/* Collapsed content (desktop only) */}
        <motion.div
          className="absolute inset-0 flex h-full w-16 flex-col"
          animate={{ opacity: sidebarCollapsed ? 1 : 0, x: sidebarCollapsed ? 0 : 12 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: sidebarCollapsed ? "auto" : "none" }}
        >
          <div className="flex items-center justify-center border-b border-slate-200/80 px-3 py-3 dark:border-slate-800">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2 pt-4">
            <button
              onClick={handleNewChatClick}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              title="New Session"
            >
              <Plus className="h-5 w-5" />
            </button>

            <button
              onClick={handleSearchClick}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              title="Search sessions"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleExpandSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </aside>

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
