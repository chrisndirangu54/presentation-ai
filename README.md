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
- multi-output generation for presentations, documents, spreadsheets, infographics, charts, diagrams, dashboards, posters, carousels, one-pagers and whitepapers
- export adapters for PowerPoint, PDF, Google Slides, Word, Excel, CSV, PNG, JPG, SVG, HTML, Markdown and JSON
- structured chart, flowchart, diagram and infographic specifications that remain editable
- a built-in visual template library plus creator marketplace architecture
- creator profiles, paid/free listings, licenses, versions, purchases, reviews and marketplace analytics foundations
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


## Multi-output Studio

The `/studio` route exposes the new artifact catalog. It supports structured creation targets for presentations, documents, spreadsheets, infographics, charts, flowcharts, diagrams, mind maps, timelines, dashboards, posters, social carousels, one-pagers and whitepapers.

## Template Marketplace

The `/marketplace` route exposes the template discovery experience and `/creator/templates` provides the creator-side publishing surface. The Prisma model supports draft/review/published lifecycle states, free and paid templates, license tiers, version history, purchases, reviews, creator profiles and workspace-private templates.

Built-in starter templates cover startup, sales, research, academic, NGO, strategy, finance, analytics, operations, health, geospatial, technology, social and marketing scenarios, with infographic-heavy layouts prioritized.

## Visual generation APIs

Authenticated endpoints now accept structured specs for:

- `POST /api/visuals/chart`
- `POST /api/visuals/diagram`
- `POST /api/visuals/infographic`

Template discovery is available at `GET /api/templates`.

These endpoints intentionally return editable semantic specifications. Production renderers can translate those specs into SVG/canvas/HTML and then into PPTX, PDF, PNG or other export formats without losing the underlying structure.


## Creative intelligence layer

The `/intelligence` workspace adds higher-level orchestration around the artifact and visual engines.

### One source → many outputs

`POST /api/intelligence/source-to-many` creates a shared plan for converting the same evidence set into multiple coordinated artifacts. The goal is to keep facts, citations, brand language and visual conventions consistent while adapting density and structure for each format.

### Design and audience review

- `POST /api/intelligence/design-review` performs deterministic checks for readability, contrast, accessibility, brand compliance, evidence and data-integrity risks.
- `POST /api/intelligence/audience` simulates proof expectations and likely questions for investor, executive, customer, technical, academic, regulatory and general audiences.

### Automation

`POST /api/automation/validate` validates workflow graphs made from trigger, research, transform, analyze, chart, diagram, design, review, approval, export, publish and notification nodes.

The database now contains foundations for scheduled automation workflows, live data connections, approval processes, bulk/mail-merge generation jobs and source-to-many output jobs.

### Live data and publishing

Connector descriptors now cover Google Sheets, Excel/Graph, SQL, REST APIs, Airtable, Notion, Power BI, Tableau, Salesforce and HubSpot in addition to the earlier integrations.

Publishing models support visibility controls, expiry, custom-domain configuration, engagement events and A/B experiment variants. Actual third-party synchronization, SSO, BI embedding, payment settlement, real-time collaboration transport, video rendering and external automation execution remain provider-dependent integration work and are intentionally isolated behind adapters.


## In-place editing and segmented image editing

Presentation text already edits directly in the Plate canvas. The image editor now extends the same in-place workflow to image objects.

Double-click a presentation image to open segmentation-aware editing controls. Supported edit intents include:

- object removal
- object replacement
- object recoloring
- background removal
- background replacement

Automatic object selection uses the authenticated `POST /api/images/segment` adapter. It supports manual-mask, SAM 2, Grounded SAM 2 and custom-provider modes. A configured remote provider can be attached with:

```
IMAGE_SEGMENTATION_ENDPOINT=
IMAGE_SEGMENTATION_API_KEY=
IMAGE_EDIT_ENDPOINT=
IMAGE_EDIT_API_KEY=
```

`POST /api/images/edit` forwards a selected mask plus the requested operation to the configured image-edit service. Successful edits replace the image in-place and store an edit-history entry with the previous URL, output URL, selection prompt, operation and timestamp.

The editor also exposes a generalized `POST /api/editor/in-place` planning endpoint for element-scoped text, image, chart, diagram, shape, table, data and theme operations. This keeps edits local to the selected element and preserves an undoable workflow instead of regenerating an entire artifact.

The project intentionally does not hard-code a specific hosted SAM checkpoint or image inpainting model. Production deployments can point the adapter at a validated SAM/Grounded-SAM + inpainting service without coupling the editor to one vendor.


## Production execution stack

This repository now includes concrete execution paths for the previously adapter-only areas.

### Binary exporters

`POST /api/exports/render` accepts a document ID and `pptx`, `docx`, `xlsx`, or `pdf`. It normalizes presentation/artifact content and generates real binary files with PptxGenJS, docx, ExcelJS, and pdf-lib.

### Marketplace transactions

`POST /api/marketplace/checkout` creates durable free/paid purchases. Paid transactions use Stripe Checkout. `POST /api/webhooks/stripe` verifies signatures, deduplicates webhook events, settles paid purchases, increments marketplace sales, and records refunds.

### OAuth and data sync

Google and Microsoft OAuth flows are available under `/api/connectors/oauth/[provider]/start` and `callback`. Tokens are encrypted with AES-256-GCM using `APP_ENCRYPTION_KEY`, refreshed server-side, and never exposed to the client after storage.

Persistent data connections can execute Google Sheets, Microsoft Excel/Graph, and HTTPS REST syncs through `POST /api/connectors/data/[id]/sync`. Every run records status, row counts, timestamps, result payloads, and errors.

### Realtime collaboration

The dedicated `server/collaboration.mjs` process hosts Yjs rooms over WebSockets. Room access uses short-lived signed tokens from `/api/collaboration/token`; Yjs updates and state vectors are persisted to PostgreSQL. The presentation editor binds slide state to the room in real time.

Run locally with:

```bash
npm run collab
```

and set `NEXT_PUBLIC_COLLABORATION_URL=ws://localhost:1234`.

### Multi-format drag-and-drop editing

`/studio/[id]` uses a reusable dnd-kit artifact canvas backed by `GET/PATCH /api/artifacts/[id]`. Structured blocks can be reordered and edited while remaining format-neutral for later PPTX/DOCX/PDF/XLSX rendering.

### Workflow execution

`POST /api/automation/[id]/run` executes persisted workflow graphs in dependency order, stores node state after each step, supports transform/analyze/chart/diagram/notify/approval behavior, records success/failure/partial status, and preserves run results for auditing.

### Deployment and validation

- `Dockerfile`: multi-stage production build
- `docker-compose.yml`: Next.js web, Yjs collaboration server, and PostgreSQL
- `GET /api/health`: database-backed readiness check
- `.github/workflows/ci.yml`: Prisma validation/generation, TypeScript checking, and production Next.js build on pull requests and main
