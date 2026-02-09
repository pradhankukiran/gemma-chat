"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Copy } from "lucide-react"
import { cls } from "./utils"

export default function CopyButton({ text, className, size = "sm" }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const sizeClasses = {
    xs: "h-6 px-1.5",
    sm: "h-7 px-2",
    md: "h-8 px-2.5",
  }

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  }

  return (
    <button
      onClick={handleCopy}
      className={cls(
        "inline-flex items-center gap-1 rounded-md text-[11px] transition-colors",
        copied
          ? "text-emerald"
          : "text-ink-faint hover:bg-surface-tertiary hover:text-ink-secondary",
        sizeClasses[size],
        className
      )}
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? (
        <Check className={iconSizes[size]} />
      ) : (
        <Copy className={iconSizes[size]} />
      )}
      {size !== "xs" && <span>{copied ? "Copied" : "Copy"}</span>}
    </button>
  )
}
