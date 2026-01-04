"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cls } from "./utils"

export default function CopyButton({ text, className, size = "sm" }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const sizeClasses = {
    xs: "h-5 w-5 p-1",
    sm: "h-6 w-6 p-1",
    md: "h-7 w-7 p-1.5",
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
        "inline-flex items-center justify-center rounded-md transition-all duration-150",
        copied
          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200",
        sizeClasses[size],
        className
      )}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className={iconSizes[size]} />
      ) : (
        <Copy className={iconSizes[size]} />
      )}
    </button>
  )
}
