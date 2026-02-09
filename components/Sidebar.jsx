"use client"

import { AnimatePresence, motion } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen, SearchIcon, Plus, Star, Clock } from "lucide-react"
import SidebarSection from "./SidebarSection"
import ConversationRow from "./ConversationRow"
import SearchModal from "./SearchModal"
import { cls } from "./utils"
import { useState } from "react"

function SidebarContent({
  pinned,
  recent,
  selectedId,
  collapsed,
  setCollapsed,
  onSelect,
  togglePin,
  onDeleteConversation,
  onRenameConversation,
  query,
  setQuery,
  searchRef,
  createNewChat,
  onClose,
  onSetShowSearchModal,
}) {
  return (
    <>
      {/* Search + New */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            onClick={() => onSetShowSearchModal(true)}
            onFocus={() => onSetShowSearchModal(true)}
            className="w-full rounded-md border border-border-primary bg-surface-primary py-1.5 pl-8 pr-8 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-border-focus"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-faint">/</kbd>
        </div>
        <button
          onClick={createNewChat}
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-border-primary text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
          title="New Session"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        <SidebarSection
          icon={<Star className="h-3.5 w-3.5 text-amber" />}
          title="Saved"
          count={pinned.length}
          collapsed={collapsed.pinned}
          onToggle={() => setCollapsed((s) => ({ ...s, pinned: !s.pinned }))}
        >
          {pinned.length === 0 ? (
            <p className="px-2.5 py-2 text-left text-xs text-ink-faint">
              No saved sessions
            </p>
          ) : (
            pinned.map((c) => (
              <ConversationRow
                key={c.id}
                data={c}
                active={c.id === selectedId}
                onSelect={() => { onSelect(c.id); onClose?.() }}
                onTogglePin={() => togglePin(c.id)}
                onDelete={() => onDeleteConversation?.(c.id)}
                onRename={(title) => onRenameConversation?.(c.id, title)}
              />
            ))
          )}
        </SidebarSection>

        <SidebarSection
          icon={<Clock className="h-3.5 w-3.5 text-ink-faint" />}
          title="Recent"
          count={recent.length}
          collapsed={collapsed.recent}
          onToggle={() => setCollapsed((s) => ({ ...s, recent: !s.recent }))}
        >
          {recent.length === 0 ? (
            <p className="px-2.5 py-2 text-left text-xs text-ink-faint">
              No recent sessions
            </p>
          ) : (
            recent.map((c) => (
              <ConversationRow
                key={c.id}
                data={c}
                active={c.id === selectedId}
                onSelect={() => { onSelect(c.id); onClose?.() }}
                onTogglePin={() => togglePin(c.id)}
                onDelete={() => onDeleteConversation?.(c.id)}
                onRename={(title) => onRenameConversation?.(c.id, title)}
                showMeta
              />
            ))
          )}
        </SidebarSection>
      </nav>
    </>
  )
}

function CollapsedBar({ onExpand, onNewChat, onSearch }) {
  return (
    <div className="flex h-full w-14 flex-col items-center border-r border-border-primary bg-surface-secondary py-2">
      <button
        onClick={onExpand}
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
        aria-label="Expand sidebar"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>

      <div className="mt-3 flex flex-col items-center gap-1">
        <button
          onClick={onNewChat}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
          title="New Session"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onSearch}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
          title="Search"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

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
  onDeleteConversation,
  onRenameConversation,
}) {
  const [showSearchModal, setShowSearchModal] = useState(false)

  const sharedProps = {
    pinned,
    recent,
    selectedId,
    collapsed,
    setCollapsed,
    onSelect,
    togglePin,
    onDeleteConversation,
    onRenameConversation,
    query,
    setQuery,
    searchRef,
    createNewChat,
    onClose,
    onSetShowSearchModal: setShowSearchModal,
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile: Collapsed icon rail */}
      <div className="fixed inset-y-0 left-0 top-0 z-30 md:hidden">
        <CollapsedBar
          onExpand={onOpen}
          onNewChat={createNewChat}
          onSearch={() => setShowSearchModal(true)}
        />
      </div>

      {/* Mobile: Full sidebar overlay */}
      <aside
        className={cls(
          "fixed inset-y-0 left-0 top-0 z-50 flex w-[280px] flex-col border-r border-border-primary bg-surface-secondary transition-transform duration-150 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[52px] items-center justify-between border-b border-border-primary px-3">
          <span className="text-sm font-medium text-ink">Sessions</span>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Desktop: Sidebar with collapse */}
      <aside
        className={cls(
          "relative z-30 hidden shrink-0 overflow-hidden transition-[width] duration-150 md:flex md:flex-col",
          sidebarCollapsed ? "w-14" : "w-[280px]"
        )}
      >
        {sidebarCollapsed ? (
          <CollapsedBar
            onExpand={() => setSidebarCollapsed(false)}
            onNewChat={createNewChat}
            onSearch={() => setShowSearchModal(true)}
          />
        ) : (
          <div className="flex h-full w-[280px] flex-col border-r border-border-primary bg-surface-secondary">
            <div className="flex items-center justify-between border-b border-border-primary px-3 py-2">
              <span className="text-sm font-medium text-ink">Sessions</span>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent {...sharedProps} />
          </div>
        )}
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
