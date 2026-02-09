import React, { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cls } from "./utils"

export default function SidebarSection({ icon, title, children, collapsed, onToggle, count }) {
  return (
    <section>
      <button
        onClick={onToggle}
        className="mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-faint transition-colors hover:bg-surface-tertiary hover:text-ink-tertiary"
        aria-expanded={!collapsed}
      >
        <ChevronRight
          className={cls(
            "h-3 w-3 transition-transform duration-150",
            !collapsed && "rotate-90"
          )}
        />
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {typeof count === "number" && count > 0 && (
          <span className="ml-auto font-mono text-[10px] text-ink-faint">{count}</span>
        )}
      </button>
      {!collapsed && (
        <div className="space-y-0.5">
          {children}
        </div>
      )}
    </section>
  )
}
