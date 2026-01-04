"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChevronDown, ChevronRight, Copy, Check, ExternalLink } from "lucide-react"
import CopyButton from "./CopyButton"
import { cls } from "./utils"

// Patterns for clinical values
const PATTERNS = {
  // Drug dosages: matches "500mg", "10 mg/kg", "0.5-1 mg", etc.
  dosage: /\b(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?)\s*(mg|g|mcg|µg|mL|L|units?|IU|mEq|mmol)(?:\/(?:kg|m²|dose|day|hr|min|L))?\b/gi,

  // Lab values: matches "140 mEq/L", "7.4 pH", "98%", etc.
  labValue: /\b(\d+(?:\.\d+)?)\s*(mEq\/L|mmol\/L|mg\/dL|g\/dL|%|mm\/hr|cells\/µL|ng\/mL|pg\/mL|mIU\/mL|U\/L|IU\/L|mmHg|bpm)\b/gi,

  // eGFR/CrCl values
  renalFunction: /\b(eGFR|CrCl|GFR)\s*[=:]?\s*(\d+(?:\.\d+)?)\s*(mL\/min(?:\/1\.73m²)?)?/gi,

  // Blood pressure
  bloodPressure: /\b(\d{2,3})\s*\/\s*(\d{2,3})\s*mmHg\b/gi,

  // Heart rate
  heartRate: /\b(\d{2,3})\s*bpm\b/gi,

  // Temperature
  temperature: /\b(\d{2,3}(?:\.\d)?)\s*°?[CF]\b/gi,
}


// Component for inline clinical values with copy
function ClinicalValue({ children, type }) {
  const [copied, setCopied] = useState(false)
  const text = typeof children === "string" ? children : String(children)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const typeStyles = {
    dosage: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    lab: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    vital: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  }

  return (
    <span
      onClick={handleCopy}
      className={cls(
        "inline-flex cursor-pointer items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[0.85em] transition-all hover:shadow-sm",
        typeStyles[type] || typeStyles.vital,
        copied && "ring-2 ring-emerald-500/50"
      )}
      title="Click to copy"
    >
      {text}
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-50" />
      )}
    </span>
  )
}

// Component for collapsible sections
function CollapsibleSection({ title, children, defaultOpen = true, priority }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const priorityStyles = {
    high: "border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
    medium: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10",
    normal: "border-l-[#1e3a5f] bg-slate-50/50 dark:bg-slate-800/30",
  }

  return (
    <div className={cls("mb-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700", priority && "border-l-4", priorityStyles[priority])}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800/50"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
        {title}
      </button>
      {isOpen && <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">{children}</div>}
    </div>
  )
}

// Enhanced code block with copy button
function CodeBlock({ children, className }) {
  const codeString = typeof children === "string" ? children : String(children?.props?.children || "")
  const language = className?.replace("language-", "") || ""

  return (
    <div className="group relative mb-3">
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton text={codeString} size="sm" />
      </div>
      {language && (
        <div className="absolute left-3 top-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {language}
        </div>
      )}
      <pre className={cls("overflow-x-auto rounded-lg bg-[#0f1d2d] p-4 pt-8 text-xs leading-relaxed text-slate-100", language && "pt-8")}>
        <code className="font-mono">{codeString}</code>
      </pre>
    </div>
  )
}

// Process text to add clinical value highlighting
function processText(text) {
  if (typeof text !== "string") return text

  // Check for alert/warning keywords
  const lowerText = text.toLowerCase()
  const hasAlert = ALERT_KEYWORDS.some((kw) => lowerText.includes(kw))
  const hasWarning = !hasAlert && WARNING_KEYWORDS.some((kw) => lowerText.includes(kw))

  // For now, just return text - we'll handle this in the paragraph component
  return { text, hasAlert, hasWarning }
}

export default function ClinicalMarkdown({ content }) {
  const components = {
    p: ({ children, node }) => {
      return (
        <p className="mb-3 text-sm leading-relaxed text-slate-700 last:mb-0 dark:text-slate-200">
          {children}
        </p>
      )
    },

    ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-1">{children}</ul>,

    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#1e3a5f] dark:marker:text-slate-400">
        {children}
      </ol>
    ),

    li: ({ children, ordered, index }) => {
      // Check if this looks like a priority item (starts with priority indicator)
      const text = typeof children?.[0] === "string" ? children[0] : ""
      const isPriority = /^(●|○|◐|►|▸|•|\*)\s/.test(text)
      const isHighPriority = text.includes("rule out") || text.includes("first") || text.includes("stat") || text.includes("urgent")

      return (
        <li
          className={cls(
            "relative pl-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200",
            isHighPriority && "font-medium"
          )}
        >
          <span
            className={cls(
              "absolute left-0 top-2 h-1.5 w-1.5 rounded-full",
              isHighPriority ? "bg-red-500" : "bg-[#1e3a5f] dark:bg-slate-500"
            )}
          />
          {children}
        </li>
      )
    },

    a: ({ href, children }) => (
      <a
        className="inline-flex items-center gap-1 font-medium text-[#1e3a5f] underline underline-offset-2 hover:text-[#2d4a6f] dark:text-blue-400 dark:hover:text-blue-300"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    ),

    strong: ({ children }) => {
      const text = typeof children === "string" ? children : String(children || "")

      // Check if it's a dosage
      if (PATTERNS.dosage.test(text)) {
        PATTERNS.dosage.lastIndex = 0
        return <ClinicalValue type="dosage">{text}</ClinicalValue>
      }

      // Check if it's a lab value
      if (PATTERNS.labValue.test(text)) {
        PATTERNS.labValue.lastIndex = 0
        return <ClinicalValue type="lab">{text}</ClinicalValue>
      }

      return <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
    },

    em: ({ children }) => <em className="italic text-slate-600 dark:text-slate-300">{children}</em>,

    blockquote: ({ children }) => (
      <blockquote className="mb-3 rounded-r-md border-l-4 border-[#1e3a5f]/40 bg-slate-50 py-2 pl-4 pr-3 text-sm text-slate-600 dark:border-slate-500/40 dark:bg-slate-800/50 dark:text-slate-300">
        {children}
      </blockquote>
    ),

    code: ({ inline, children, className }) => {
      if (inline) {
        const text = typeof children === "string" ? children : String(children || "")

        // Check if it's a clinical value
        if (PATTERNS.dosage.test(text)) {
          PATTERNS.dosage.lastIndex = 0
          return <ClinicalValue type="dosage">{text}</ClinicalValue>
        }
        if (PATTERNS.labValue.test(text) || PATTERNS.renalFunction.test(text)) {
          PATTERNS.labValue.lastIndex = 0
          PATTERNS.renalFunction.lastIndex = 0
          return <ClinicalValue type="lab">{text}</ClinicalValue>
        }
        if (PATTERNS.bloodPressure.test(text) || PATTERNS.heartRate.test(text) || PATTERNS.temperature.test(text)) {
          PATTERNS.bloodPressure.lastIndex = 0
          PATTERNS.heartRate.lastIndex = 0
          PATTERNS.temperature.lastIndex = 0
          return <ClinicalValue type="vital">{text}</ClinicalValue>
        }

        return (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-[#1e3a5f] dark:bg-slate-800 dark:text-blue-300">
            {children}
          </code>
        )
      }
      return <code className="font-mono text-[0.85em] text-slate-100">{children}</code>
    },

    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,

    h1: ({ children }) => (
      <h1 className="mb-3 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2 className="mb-2 mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">{children}</h2>
    ),

    h3: ({ children }) => (
      <h3 className="mb-2 mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{children}</h3>
    ),

    table: ({ children }) => (
      <div className="mb-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          {children}
        </table>
      </div>
    ),

    thead: ({ children }) => (
      <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>
    ),

    th: ({ children }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        {children}
      </th>
    ),

    td: ({ children }) => {
      const text = typeof children === "string" ? children : ""

      // Auto-detect and format clinical values in table cells
      if (PATTERNS.dosage.test(text) || PATTERNS.labValue.test(text)) {
        PATTERNS.dosage.lastIndex = 0
        PATTERNS.labValue.lastIndex = 0
        return (
          <td className="px-3 py-2 font-mono text-slate-900 dark:text-slate-100">
            <ClinicalValue type="lab">{text}</ClinicalValue>
          </td>
        )
      }

      return (
        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{children}</td>
      )
    },

    hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}

// Export sub-components for use elsewhere
export { ClinicalValue, CollapsibleSection, CopyButton }
