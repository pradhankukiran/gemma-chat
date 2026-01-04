import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"

export default function SidebarSection({ icon, title, children, collapsed, onToggle }) {
  return (
    <section>
      <button
        onClick={onToggle}
        className="sticky top-0 z-10 -mx-1 mb-2 flex w-[calc(100%+8px)] items-center gap-2 rounded-lg bg-gradient-to-b from-slate-50 via-slate-50 to-slate-50/80 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm transition hover:bg-slate-100 hover:text-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-expanded={!collapsed}
      >
        <span className="flex h-5 w-5 items-center justify-center" aria-hidden>
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden>{icon}</span>
          <span>{title}</span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
