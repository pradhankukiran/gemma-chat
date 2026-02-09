"use client"

import { Pill, BookOpen, FileCode2 } from "lucide-react"
import { cls } from "./utils"

const DRUG_PATTERNS = [
  /\b(\d+(?:\.\d+)?)\s*(?:mg|g|mcg|µg|mL|units?|IU|mEq|mmol)\b/i,
  /\b(?:aspirin|ibuprofen|acetaminophen|metformin|lisinopril|amlodipine|omeprazole|losartan|atorvastatin|metoprolol|warfarin|amiodarone|heparin|enoxaparin|clopidogrel|prednisone|dexamethasone|furosemide|hydrochlorothiazide|levothyroxine|insulin|amoxicillin|azithromycin|ciprofloxacin|vancomycin|piperacillin|ceftriaxone|morphine|fentanyl|hydromorphone|gabapentin|pregabalin|sertraline|fluoxetine|escitalopram|quetiapine|risperidone|olanzapine|diazepam|lorazepam|midazolam|phenytoin|levetiracetam|valproic acid|carbamazepine)\b/i,
]

const CLINICAL_PATTERNS = [
  /\b(?:differential diagnosis|differentials?|ddx)\b/i,
  /\b(?:ICD[\s-]?1[01]|diagnosis code|diagnostic code)\b/i,
  /\b(?:drug interaction|contraindication|adverse (?:effect|event|reaction))\b/i,
]

function hasDrugContent(text) {
  if (!text) return false
  return DRUG_PATTERNS.some((p) => p.test(text))
}

function hasClinicalContent(text) {
  if (!text) return false
  return CLINICAL_PATTERNS.some((p) => p.test(text))
}

function extractDrugName(text) {
  if (!text) return null
  const match = text.match(DRUG_PATTERNS[1])
  return match ? match[0] : null
}

export default function MessageActions({ content, onReferenceSearch }) {
  if (!content?.trim()) return null

  const showDrug = hasDrugContent(content)
  const showClinical = hasClinicalContent(content) || showDrug
  const drugName = extractDrugName(content)

  if (!showDrug && !showClinical) return null

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {showDrug && (
        <button
          onClick={() => onReferenceSearch?.("drug", drugName || "")}
          className={cls(
            "inline-flex items-center gap-1 rounded-md border border-border-primary px-2 py-0.5",
            "text-[11px] text-ink-faint transition-colors",
            "hover:border-border-focus hover:text-accent"
          )}
        >
          <Pill className="h-3 w-3" />
          Drug Info
        </button>
      )}
      {showClinical && (
        <button
          onClick={() => onReferenceSearch?.("evidence", drugName || content.slice(0, 80))}
          className={cls(
            "inline-flex items-center gap-1 rounded-md border border-border-primary px-2 py-0.5",
            "text-[11px] text-ink-faint transition-colors",
            "hover:border-border-focus hover:text-accent"
          )}
        >
          <BookOpen className="h-3 w-3" />
          Find Evidence
        </button>
      )}
      {hasClinicalContent(content) && (
        <button
          onClick={() => onReferenceSearch?.("icd", content.slice(0, 80))}
          className={cls(
            "inline-flex items-center gap-1 rounded-md border border-border-primary px-2 py-0.5",
            "text-[11px] text-ink-faint transition-colors",
            "hover:border-border-focus hover:text-accent"
          )}
        >
          <FileCode2 className="h-3 w-3" />
          ICD-11 Lookup
        </button>
      )}
    </div>
  )
}
