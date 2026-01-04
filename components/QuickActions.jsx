"use client"

import { useState } from "react"
import {
  Stethoscope,
  Pill,
  FlaskConical,
  AlertTriangle,
  Baby,
  Heart,
  Brain,
  Syringe,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cls } from "./utils"

const QUICK_ACTIONS = [
  {
    id: "ddx",
    label: "Differential Dx",
    icon: Stethoscope,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    template: "Differential diagnosis for a patient presenting with:\n\n• Chief complaint: \n• Age/Sex: \n• Relevant history: \n• Key findings: \n\nPlease provide ranked differentials with reasoning.",
  },
  {
    id: "drug-interaction",
    label: "Drug Interaction",
    icon: Pill,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    template: "Check for drug interactions between:\n\n• Drug 1: \n• Drug 2: \n• Patient context (age, renal/hepatic function): \n\nInclude severity, mechanism, and clinical recommendations.",
  },
  {
    id: "dosing",
    label: "Dosing Calculator",
    icon: Syringe,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    template: "Calculate dosing for:\n\n• Medication: \n• Indication: \n• Patient weight: \n• Renal function (CrCl/eGFR): \n• Hepatic function: \n\nProvide loading dose, maintenance dose, and adjustments.",
  },
  {
    id: "lab-interpretation",
    label: "Lab Interpretation",
    icon: FlaskConical,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    template: "Interpret these lab results:\n\n• Test: Value (units)\n• Test: Value (units)\n• Clinical context: \n\nProvide interpretation, likely causes, and recommended follow-up.",
  },
  {
    id: "contraindications",
    label: "Contraindications",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    template: "List contraindications for:\n\n• Medication/Procedure: \n• Patient conditions: \n\nInclude absolute vs relative contraindications and alternatives.",
  },
  {
    id: "pediatric",
    label: "Pediatric Dosing",
    icon: Baby,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-900/20",
    border: "border-pink-200 dark:border-pink-800",
    template: "Pediatric dosing calculation:\n\n• Medication: \n• Indication: \n• Age: \n• Weight: kg\n• BSA (if applicable): m²\n\nProvide weight-based and age-appropriate dosing.",
  },
  {
    id: "cardiac",
    label: "Cardiac Workup",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    template: "Cardiac workup for:\n\n• Presentation: \n• Risk factors: \n• ECG findings: \n• Troponin: \n\nProvide risk stratification and recommended workup.",
  },
  {
    id: "neuro",
    label: "Neuro Assessment",
    icon: Brain,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
    template: "Neurological assessment for:\n\n• Symptoms: \n• Onset: \n• GCS: \n• Focal deficits: \n• NIHSS (if stroke suspected): \n\nProvide differential and urgent workup recommendations.",
  },
]

export default function QuickActions({ onSelectTemplate, isExpanded, onToggleExpand }) {
  const [hoveredId, setHoveredId] = useState(null)

  const visibleActions = isExpanded ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 4)

  return (
    <div className="border-b border-slate-200/80 bg-white/50 px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quick Actions
          </span>
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-[10px] font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show all <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => onSelectTemplate(action.template)}
                onMouseEnter={() => setHoveredId(action.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cls(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150",
                  action.bg,
                  action.border,
                  "hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                <Icon className={cls("h-3.5 w-3.5", action.color)} />
                <span className="text-slate-700 dark:text-slate-200">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
