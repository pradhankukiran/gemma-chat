"use client"

import { useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChevronDown, ChevronRight, Copy, Check, ExternalLink, Info } from "lucide-react"
import CopyButton from "./CopyButton"
import { cls } from "./utils"

const PATTERNS = {
  dosage: /\b(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?)\s*(mg|g|mcg|µg|mL|L|units?|IU|mEq|mmol)(?:\/(?:kg|m²|dose|day|hr|min|L))?\b/i,
  labValue: /\b(\d+(?:\.\d+)?)\s*(mEq\/L|mmol\/L|mg\/dL|g\/dL|%|mm\/hr|cells\/µL|ng\/mL|pg\/mL|mIU\/mL|U\/L|IU\/L|mmHg|bpm)\b/i,
  renalFunction: /\b(eGFR|CrCl|GFR)\s*[=:]?\s*(\d+(?:\.\d+)?)\s*(mL\/min(?:\/1\.73m²)?)?/i,
  bloodPressure: /\b(\d{2,3})\s*\/\s*(\d{2,3})\s*mmHg\b/i,
  heartRate: /\b(\d{2,3})\s*bpm\b/i,
  temperature: /\b(\d{2,3}(?:\.\d)?)\s*°?[CF]\b/i,
}

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
    dosage: "bg-clinical-dosage-bg text-clinical-dosage-fg border-clinical-dosage-border",
    lab: "bg-clinical-lab-bg text-clinical-lab-fg border-clinical-lab-border",
    vital: "bg-clinical-vital-bg text-clinical-vital-fg border-clinical-vital-border",
  }

  return (
    <span
      onClick={handleCopy}
      className={cls(
        "inline-flex cursor-pointer items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[0.85em] transition-all hover:opacity-80",
        typeStyles[type] || typeStyles.vital,
        copied && "ring-1 ring-emerald/50"
      )}
      title="Click to copy"
    >
      {text}
      {copied ? (
        <Check className="h-3 w-3 text-emerald" />
      ) : (
        <Copy className="h-3 w-3 opacity-40" />
      )}
    </span>
  )
}

function CollapsibleSection({ title, children, defaultOpen = true, priority }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const priorityStyles = {
    high: "border-l-red",
    medium: "border-l-amber",
    normal: "border-l-accent",
  }

  return (
    <div className={cls("mb-3 overflow-hidden rounded-md border border-border-primary", priority && "border-l-2", priorityStyles[priority])}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-tertiary"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        )}
        {title}
      </button>
      {isOpen && <div className="border-t border-border-primary px-3 py-2">{children}</div>}
    </div>
  )
}

function extractText(node) {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (!node) return ""
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (node.props?.children) return extractText(node.props.children)
  return ""
}

function CodeBlock({ children, className }) {
  const codeString = typeof children === "string" ? children : extractText(children)
  const language = className?.replace("language-", "") || ""

  return (
    <div className="group relative mb-3">
      <div className="flex items-center justify-between rounded-t-md border border-b-0 border-border-primary bg-surface-tertiary px-3 py-1.5">
        {language && (
          <span className="font-mono text-[10px] uppercase text-ink-faint">{language}</span>
        )}
        <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
          <CopyButton text={codeString} size="xs" />
        </div>
      </div>
      <pre className="overflow-x-auto rounded-b-md border border-border-primary bg-surface-sunken p-3 text-xs leading-relaxed text-ink">
        <code className="font-mono">{codeString}</code>
      </pre>
    </div>
  )
}

export default function ClinicalMarkdown({ content }) {
  const components = useMemo(() => {
    let sectionCounter = 0

    return {
      p: ({ children }) => (
        <p className="mb-3.5 text-base leading-[1.75] text-ink last:mb-0">{children}</p>
      ),

      ul: ({ children }) => <ul className="mb-4 space-y-1.5 pl-1">{children}</ul>,

      ol: ({ children }) => (
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-ink-tertiary">
          {children}
        </ol>
      ),

      li: ({ children }) => {
        const text = typeof children?.[0] === "string" ? children[0] : ""
        const isHighPriority = text.includes("rule out") || text.includes("first") || text.includes("stat") || text.includes("urgent")

        return (
          <li className={cls(
            "relative pl-4 text-[15px] leading-[1.7] text-ink",
            isHighPriority && "font-medium"
          )}>
            <span className={cls(
              "absolute left-0 top-[10px] h-1.5 w-1.5 rounded-full",
              isHighPriority ? "bg-red" : "bg-ink-faint"
            )} />
            {children}
          </li>
        )
      },

      a: ({ href, children }) => (
        <a
          className="inline-flex items-center gap-0.5 font-medium text-accent underline underline-offset-2 hover:opacity-80"
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
        if (PATTERNS.dosage.test(text)) return <ClinicalValue type="dosage">{text}</ClinicalValue>
        if (PATTERNS.labValue.test(text)) return <ClinicalValue type="lab">{text}</ClinicalValue>
        return <strong className="font-semibold text-white">{children}</strong>
      },

      em: ({ children }) => <em className="italic text-ink-secondary">{children}</em>,

      blockquote: ({ children }) => (
        <blockquote className="my-5 rounded-r-lg border-l-[3px] border-accent bg-accent-dim py-4 pl-5 pr-5 text-base leading-[1.7]">
          <div>{children}</div>
        </blockquote>
      ),

      code: ({ inline, children, className }) => {
        if (inline) {
          const text = typeof children === "string" ? children : String(children || "")
          if (PATTERNS.dosage.test(text)) return <ClinicalValue type="dosage">{text}</ClinicalValue>
          if (PATTERNS.labValue.test(text) || PATTERNS.renalFunction.test(text)) return <ClinicalValue type="lab">{text}</ClinicalValue>
          if (PATTERNS.bloodPressure.test(text) || PATTERNS.heartRate.test(text) || PATTERNS.temperature.test(text)) return <ClinicalValue type="vital">{text}</ClinicalValue>
          return (
            <code className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
              {children}
            </code>
          )
        }
        return <code className="font-mono text-[0.85em]">{children}</code>
      },

      pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,

      h1: ({ children }) => (
        <h1 className="mb-2 text-[28px] font-bold leading-tight tracking-tight text-white">
          {children}
        </h1>
      ),

      h2: ({ children }) => {
        sectionCounter++
        const num = String(sectionCounter).padStart(2, "0")
        return (
          <div className="mb-3.5 mt-9 flex items-center gap-2 border-b border-border-primary pb-2">
            <span className="rounded bg-accent-dim px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent">
              {num}
            </span>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
              {children}
            </h2>
          </div>
        )
      },

      h3: ({ children }) => (
        <h3 className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wide text-ink-secondary">
          {children}
        </h3>
      ),

      table: ({ children }) => (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      ),

      thead: ({ children }) => (
        <thead>{children}</thead>
      ),

      th: ({ children }) => (
        <th className="border-b border-border-primary px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
          {children}
        </th>
      ),

      tr: ({ children }) => (
        <tr className="transition-colors hover:bg-white/[0.02]">{children}</tr>
      ),

      td: ({ children }) => {
        const text = typeof children === "string" ? children : ""
        if (PATTERNS.dosage.test(text) || PATTERNS.labValue.test(text)) {
          return (
            <td className="border-b border-white/[0.03] px-3 py-2.5">
              <ClinicalValue type="lab">{text}</ClinicalValue>
            </td>
          )
        }
        return (
          <td className="border-b border-white/[0.03] px-3 py-2.5 text-ink-secondary first:font-medium first:text-ink">
            {children}
          </td>
        )
      },

      hr: () => <hr className="my-6 border-border-primary" />,
    }
  }, [])

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}

export { ClinicalValue }
