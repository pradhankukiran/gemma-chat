"use client"

import { cls } from "./utils"

const QUICK_ACTIONS = [
  {
    id: "ddx",
    label: "Differential Dx",
    template: "Differential diagnosis for a patient presenting with:\n\n\u2022 Chief complaint: \n\u2022 Age/Sex: \n\u2022 Relevant history: \n\u2022 Key findings: \n\nPlease provide ranked differentials with reasoning.",
  },
  {
    id: "drug-interaction",
    label: "Drug Interaction",
    template: "Check for drug interactions between:\n\n\u2022 Drug 1: \n\u2022 Drug 2: \n\u2022 Patient context (age, renal/hepatic function): \n\nInclude severity, mechanism, and clinical recommendations.",
  },
  {
    id: "dosing",
    label: "Dosing",
    template: "Calculate dosing for:\n\n\u2022 Medication: \n\u2022 Indication: \n\u2022 Patient weight: \n\u2022 Renal function (CrCl/eGFR): \n\u2022 Hepatic function: \n\nProvide loading dose, maintenance dose, and adjustments.",
  },
  {
    id: "lab-interpretation",
    label: "Lab Results",
    template: "Interpret these lab results:\n\n\u2022 Test: Value (units)\n\u2022 Test: Value (units)\n\u2022 Clinical context: \n\nProvide interpretation, likely causes, and recommended follow-up.",
  },
  {
    id: "contraindications",
    label: "Contraindications",
    template: "List contraindications for:\n\n\u2022 Medication/Procedure: \n\u2022 Patient conditions: \n\nInclude absolute vs relative contraindications and alternatives.",
  },
  {
    id: "cardiac",
    label: "Cardiac Workup",
    template: "Cardiac workup for:\n\n\u2022 Presentation: \n\u2022 Risk factors: \n\u2022 ECG findings: \n\u2022 Troponin: \n\nProvide risk stratification and recommended workup.",
  },
]

export { QUICK_ACTIONS }

export default function QuickActions({ onSelectTemplate }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelectTemplate(action.template)}
          className="rounded-md border border-border-primary bg-surface-primary px-2.5 py-1 text-[13px] text-ink-secondary transition-colors hover:border-border-focus hover:text-accent"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
