<div align="center">

<img src="public/icon.svg" alt="MedGemma Chat" width="64" height="64" />

# MedGemma Chat

**AI-powered clinical decision support for healthcare professionals.**

Differential diagnosis, drug interactions, dosing calculations, lab interpretation — powered by Google's [MedGemma](https://ai.google.dev/gemma/docs/medgemma) model.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## Overview

MedGemma Chat is a clinical AI assistant with an **artifact-based document UI** — the AI's response is the primary content, rendered as a beautifully typeset medical document rather than a traditional chat interface.

### Key Features

- **Artifact document layout** — Responses render as full-width documents with numbered sections, pull quotes, and data tables. One response at a time, navigated via a thread strip.
- **Clinical value detection** — Auto-highlights dosages (green), lab values (purple), vitals (blue), and critical values (red) in AI responses.
- **Medical reference APIs** — Slash commands for real-time lookups:
  - `/drug` — FDA drug labels + RxNorm via openFDA
  - `/evidence` — PubMed literature search
  - `/icd` — ICD-11 diagnosis code lookup
  - `/adverse` — FDA adverse event reports
- **Medical image analysis** — Upload clinical images for MedGemma-powered visual analysis.
- **Streaming responses** — Real-time SSE streaming with a progress indicator.
- **Session management** — Conversations persist in localStorage. Pin, rename, delete, and search via `Cmd+K` palette.
- **Dark-first design** — Built for clinical environments with a deep black (`#0a0a0a`) background and carefully tuned contrast levels.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com) |
| Fonts | [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) |
| Animations | [Framer Motion](https://www.framer.com/motion/) (overlays only) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm |
| Icons | [Lucide React](https://lucide.dev) |
| AI Backend | [MedGemma](https://ai.google.dev/gemma/docs/medgemma) on [Modal](https://modal.com) |
| Storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (image uploads) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Setup

```bash
git clone https://github.com/pradhankukiran/gemma-chat.git
cd gemma-chat
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```env
# MedGemma API endpoint (Modal deployment)
MODAL_API_BASE=https://your-modal-endpoint.modal.run

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN=your_token_here
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/
  layout.tsx          # Root layout, dark mode, fonts
  page.tsx            # Entry point → AIAssistantUI
  globals.css         # Design tokens, theme, animations
  api/
    chat/route.js     # Proxy to MedGemma on Modal (SSE streaming)
    blob/route.js     # Image upload to Vercel Blob

components/
  AIAssistantUI.jsx   # Orchestrator — all state, streaming, API calls
  ThreadStrip.jsx     # Left-side turn navigator (220px)
  DocumentArea.jsx    # Full-width document view + welcome screen
  ClinicalMarkdown.jsx # Markdown renderer with clinical value detection
  Composer.jsx        # Floating pill input with slash commands
  SearchModal.jsx     # Cmd+K command palette for session management
  QuickActions.jsx    # Clinical workflow templates (DDx, dosing, etc.)
  MessageActions.jsx  # Reference lookup buttons on responses
  CopyButton.jsx      # Reusable copy-to-clipboard

lib/
  medical-apis.js     # openFDA, PubMed, ICD-11, RxNorm API clients
```

## Design System

The UI follows an **"Instrument"** aesthetic — clinical, typographic, restrained.

- **Palette**: Deep black background (`#0a0a0a`), warm neutral text, single teal accent (`#14b8a6`)
- **Typography**: 28px document titles, 16px body, 11px uppercase section labels with numbered badges
- **Clinical colors**: Dosage (green), Lab (purple), Vital (blue), Critical (red)
- **Layout**: Thread strip + document area + floating composer. No header, no chat bubbles.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Open session search |
| `Cmd+N` | New session |
| `Enter` | Send message |
| `/` | Slash commands (when not in input) |
| `Esc` | Close overlays |

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
pnpm build
```

Or push to GitHub and connect the repo to Vercel for automatic deployments.

## License

MIT

---

<div align="center">
  <sub>Built with MedGemma, Next.js, and Tailwind CSS.</sub>
</div>
