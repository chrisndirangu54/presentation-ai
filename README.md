# Presentation AI

An extensible AI presentation workspace for research-grounded, brand-aware, collaborative slide creation.

## What it does

Presentation AI combines the existing visual slide editor with an architecture for:

- AI-generated outlines, slides, speaker notes and narrative planning
- an AI Presentation Director that plans a deck around audience, objective, evidence and time
- PDF, Office, CSV, URL, YouTube and Google Drive research ingestion
- citation-aware RAG and fact-review workflows
- model routing across text, image, video, speech and search providers
- brand kits, reusable templates and design governance
- comments, version history, workspaces and role-based access control
- usage metering, audit logs, API credentials and webhooks
- export adapters for PowerPoint, PDF, Google Slides, Word, PNG, SVG and JSON
- an admin control plane for providers and platform capabilities

The current editor remains the core authoring surface while new services are introduced as independent modules so they can be activated incrementally.

## Stack

- Next.js 14 + React 18 + TypeScript
- Prisma + PostgreSQL
- NextAuth
- Tailwind CSS + Radix UI
- Plate Editor / ProseMirror / Slate
- OpenAI + LangChain
- Together AI
- Recharts
- Zustand
- UploadThing

## Architecture

```
src/
├── app/
│   ├── admin/                    # admin control plane
│   ├── api/                      # generation and integration routes
│   └── presentation/             # existing dashboard/editor
├── lib/
│   ├── ai/
│   │   ├── presentation-director.ts
│   │   └── provider-registry.ts
│   ├── export/
│   │   └── adapters.ts
│   ├── platform/
│   │   └── capabilities.ts
│   └── research/
│       └── types.ts
├── server/
└── states/
```

The expanded Prisma schema adds workspaces, members, brand kits, templates, versions, comments, sources, citations, provider configuration, encrypted credential records, webhooks, export jobs, usage events and audit logs.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

Open http://localhost:3000. The root route now sends users to the presentation workspace.

## Provider configuration

Only configure providers you intend to use. The registry supports independent routing by capability, so text generation, image generation, narration and research can use different models.

See `.env.example` for supported configuration placeholders. Secrets should never be stored in plaintext database fields; database credential records are designed to hold encrypted ciphertext or secret-manager references.

## Database migration

This upgrade extends the Prisma schema substantially. For development:

```bash
pnpm db:push
```

For production, generate and review a migration instead of pushing directly.

## Security model

The platform now has a foundation for:

- SUPER_ADMIN / ADMIN / USER application roles
- workspace OWNER / ADMIN / EDITOR / COMMENTER / VIEWER roles
- audit logging
- encrypted API credential storage
- usage accounting
- workspace isolation

Authorization still needs to be enforced on every new API/action endpoint as those endpoints are implemented.

## Implementation status

The repository now contains the domain model and modular foundation for the requested workspace. Existing generation and editing functionality remains intact. Provider-specific ingestion workers, true real-time collaborative transport, billing webhooks, and binary PPTX/PDF rendering require their corresponding external services or runtime workers and should be connected through the new abstractions rather than hard-coded into the editor.
