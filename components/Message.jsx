"use client"

import { cls, formatTime } from "./utils"
import { RefreshCw } from "lucide-react"
import CopyButton from "./CopyButton"
import MessageActions from "./MessageActions"

export default function Message({ role, children, createdAt, content, onRegenerate, onReferenceSearch }) {
  const isUser = role === "user"

  return (
    <div className={cls("py-2.5", isUser ? "border-b border-border-secondary" : "")}>
      {/* Role label */}
      <div className="mb-1 flex items-center gap-2">
        {isUser ? (
          <span className="text-xs font-medium text-ink-tertiary">You</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-accent">
              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            </span>
            <span className="text-xs font-medium text-ink-tertiary">MedGemmaChat</span>
          </div>
        )}
        {createdAt && (
          <span className="text-[11px] text-ink-faint">{formatTime(createdAt)}</span>
        )}
      </div>

      {/* Content */}
      <div className="text-ink">
        {children}
      </div>

      {/* Actions for assistant messages */}
      {!isUser && content?.trim() && (
        <>
          <div className="mt-1 flex items-center gap-2">
            <CopyButton text={content} size="xs" />
            <button
              onClick={() => onRegenerate?.()}
              className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-ink-faint transition-colors hover:bg-surface-tertiary hover:text-ink-secondary"
              title="Regenerate"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
          <MessageActions content={content} onReferenceSearch={onReferenceSearch} />
        </>
      )}
    </div>
  )
}
