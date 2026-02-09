"use client"

import { useState, useEffect, useRef } from "react"
import { X, Loader2, ExternalLink, AlertCircle, Pill, BookOpen, FileCode2, ShieldAlert } from "lucide-react"
import { cls } from "./utils"

const TABS = [
  { id: "drug", label: "Drug Info", icon: Pill },
  { id: "evidence", label: "Evidence", icon: BookOpen },
  { id: "icd", label: "ICD-11", icon: FileCode2 },
  { id: "adverse", label: "Adverse Events", icon: ShieldAlert },
]

function TabContent({ tab, data }) {
  const tabData = data[tab]
  if (!tabData) return <EmptyTab tab={tab} />
  if (tabData.loading) return <LoadingState />
  if (tabData.error) return <ErrorState message={tabData.error} />
  if (!tabData.results?.length) return <EmptyTab tab={tab} />

  switch (tab) {
    case "drug": return <DrugResults data={tabData} />
    case "evidence": return <EvidenceResults results={tabData.results} />
    case "icd": return <ICDResults data={tabData} />
    case "adverse": return <AdverseResults results={tabData.results} />
    default: return null
  }
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 px-4 py-8 text-sm text-ink-tertiary">
      <Loader2 className="h-4 w-4 animate-spin" />
      Searching...
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex items-start gap-2 px-4 py-4 text-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
      <span className="text-ink-secondary">{message}</span>
    </div>
  )
}

function EmptyTab({ tab }) {
  const hints = {
    drug: "Search for a drug name to see label information.",
    evidence: "Search for a clinical topic to find PubMed articles.",
    icd: "Search for a diagnosis to find ICD-11 codes.",
    adverse: "Search for a drug to see reported adverse events.",
  }
  return (
    <p className="px-4 py-8 text-center text-sm text-ink-faint">
      {hints[tab] || "No data yet."}
    </p>
  )
}

function DrugResults({ data }) {
  return (
    <div className="divide-y divide-border-secondary">
      {data.rxNorm && data.rxNorm.results?.length > 0 && (
        <div className="px-4 py-3">
          <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">RxNorm</h4>
          <div className="space-y-1">
            {data.rxNorm.results.map((r) => (
              <div key={r.rxcui} className="flex items-baseline justify-between text-sm">
                <span className="text-ink">{r.name}</span>
                <span className="ml-2 shrink-0 font-mono text-[11px] text-ink-faint">RxCUI: {r.rxcui}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.results.map((drug, i) => (
        <div key={i} className="px-4 py-3">
          <div className="mb-1.5 flex items-baseline gap-2">
            <span className="text-sm font-medium text-ink">{drug.brandName}</span>
            <span className="text-xs text-ink-tertiary">{drug.genericName}</span>
          </div>
          {drug.manufacturer && (
            <p className="mb-1 text-xs text-ink-faint">{drug.manufacturer}</p>
          )}
          {drug.indications && (
            <LabelSection title="Indications" text={drug.indications} />
          )}
          {drug.dosage && (
            <LabelSection title="Dosage" text={drug.dosage} />
          )}
          {drug.warnings && (
            <LabelSection title="Warnings" text={drug.warnings} />
          )}
          {drug.contraindications && (
            <LabelSection title="Contraindications" text={drug.contraindications} />
          )}
        </div>
      ))}
    </div>
  )
}

function LabelSection({ title, text }) {
  const [expanded, setExpanded] = useState(false)
  const truncated = text.length > 200
  const display = expanded ? text : text.slice(0, 200)

  return (
    <div className="mt-2">
      <h5 className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">{title}</h5>
      <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
        {display}
        {truncated && !expanded && "..."}
      </p>
      {truncated && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 text-[11px] text-accent hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function EvidenceResults({ results }) {
  return (
    <div className="divide-y divide-border-secondary">
      {results.map((article) => (
        <div key={article.pmid} className="px-4 py-3">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-1.5 text-sm font-medium text-ink hover:text-accent"
          >
            <span className="line-clamp-2">{article.title}</span>
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
          </a>
          <p className="mt-1 text-xs text-ink-tertiary">
            {article.authors}{article.authors && " — "}{article.journal}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
            <span>{article.pubdate}</span>
            <span className="font-mono">PMID: {article.pmid}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ICDResults({ data }) {
  return (
    <div className="px-4 py-3">
      {data.total > 0 && (
        <p className="mb-2 text-[11px] text-ink-faint">{data.total} results found</p>
      )}
      <div className="space-y-1.5">
        {data.results.map((item, i) => (
          <div key={i} className="flex items-baseline gap-2 rounded-md border border-border-secondary px-2.5 py-2">
            <span className="shrink-0 font-mono text-xs font-medium text-accent">{item.code}</span>
            <span className="text-sm text-ink">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdverseResults({ results }) {
  return (
    <div className="divide-y divide-border-secondary">
      {results.map((event, i) => (
        <div key={i} className="px-4 py-3">
          <div className="mb-1.5 flex items-center gap-2">
            {event.serious && (
              <span className="rounded bg-red/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-red">
                Serious
              </span>
            )}
            {event.seriousReasons.map((reason) => (
              <span key={reason} className="text-[10px] text-ink-faint">{reason}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {event.reactions.map((rx) => (
              <span key={rx} className="rounded border border-border-primary bg-surface-tertiary px-1.5 py-0.5 text-xs text-ink-secondary">
                {rx}
              </span>
            ))}
          </div>
          {event.receiveDate && (
            <p className="mt-1 text-[11px] text-ink-faint">
              Reported: {event.receiveDate.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ReferencePanel({ referencePanel, setReferencePanel }) {
  const { open, activeTab, data, query: searchQuery } = referencePanel
  const panelRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && open) {
        setReferencePanel((prev) => ({ ...prev, open: false }))
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, setReferencePanel])

  if (!open) return null

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 md:hidden"
        onClick={() => setReferencePanel((prev) => ({ ...prev, open: false }))}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cls(
          "z-50 flex flex-col border-l border-border-primary bg-surface-primary",
          "fixed inset-y-0 right-0 w-full sm:w-[360px]",
          "md:relative md:inset-auto md:w-[360px] md:shrink-0"
        )}
      >
        {/* Header */}
        <div className="flex h-10 items-center justify-between border-b border-border-primary px-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink">Reference</span>
            {searchQuery && (
              <span className="max-w-[180px] truncate rounded bg-surface-tertiary px-1.5 py-0.5 text-[11px] text-ink-tertiary">
                {searchQuery}
              </span>
            )}
          </div>
          <button
            onClick={() => setReferencePanel((prev) => ({ ...prev, open: false }))}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-tertiary hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-primary">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const hasData = data[tab.id] && !data[tab.id].loading && data[tab.id].results?.length > 0
            return (
              <button
                key={tab.id}
                onClick={() => setReferencePanel((prev) => ({ ...prev, activeTab: tab.id }))}
                className={cls(
                  "flex flex-1 items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "border-b-2 border-accent text-accent"
                    : "text-ink-faint hover:text-ink-tertiary",
                  hasData && !isActive && "text-ink-tertiary"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <TabContent tab={activeTab} data={data} />
        </div>
      </div>
    </>
  )
}
