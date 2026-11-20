# NoCap AI — Pre-Publication Brand Governance & Claim Verification Studio

**NoCap AI** is an enterprise-grade pre-publication brand governance, claim verification, and multimodal creative auditing platform. It intercepts factual errors, outdated product versions, SLA overpromises, pricing discrepancies, off-brand slang, and visual palette/disclosure violations **before content ever ships**.

> **Zero-Setup Hackathon Evaluation**: No login wall or API key is required. Launch the live workspace immediately to test every feature with the built-in deterministic engine, or add a **Gemini 2.5 Flash** API key in the sidebar for live LLM + Vision semantic auditing.

---

## Key Capabilities

1. **Global Multi-Occurrence Span Indexing & Idempotent Remediation**
   - Scans entire documents (headings, body paragraphs, bullet lists, and Markdown summary tables) and indexes **every occurrence** of non-compliant claims.
   - Hovering any violation card highlights **all matching spans simultaneously** across the manuscript (`Span Preview` & live hover overlay).
   - One-click **Apply Fix** / **Apply All** replaces every occurrence in a single idempotent pass while preserving Markdown table formatting.
   - Human-in-the-loop inline editing lets authors customize AI rewrites before applying, logged distinctly as `Human-Edited Fix`.

2. **Multimodal Visual & Layout Brand Governance (Gemini Vision + Deterministic Fallback)**
   - Upload marketing banners or slide creatives (`PNG`, `JPG`, `JPEG`, `WEBP`, up to `10 MB`) or click **Load Sample Banner** for instant testing.
   - Performs live HTML5 Canvas color-palette sampling + resolution/contrast analysis.
   - With a Gemini API key, sends base64 `inlineData` + active Truth Sheet rules to **`gemini-2.5-flash`** to audit embedded visual copy, color palette alignment, and legal disclosure visibility; without a key, runs a reliable deterministic visual auditor.
   - Unified `VISUAL AUDIT` Violation Cards feed directly into the live **Brand Trust Score**.

3. **Exportable Signed Compliance Audit Certificate (PDF & JSON)**
   - Available in the Content Scanner (upon reaching 100% / audit completion) and inside every Approval Center packet.
   - Generates a client-side **PDF Audit Certificate** (`jsPDF`) and machine-readable **JSON Proof** containing:
     - Certificate ID & ISO-8601 UTC timestamp
     - **Web Crypto SHA-256 hashes** of the Original Draft, Remediated Text, attached Visual Creative, and canonical Certificate Digest
     - Initial vs. Final Brand Trust Score, evaluated Truth Sheet rules, exact `before → after` remediations, and human sign-off metadata

4. **Real-Time Multi-Role Cloud Workspace Sync & Role-Based Access**
   - Dual-layer persistence: supports optional Supabase REST or Firebase Realtime Database credentials via `.env` (`VITE_CLOUD_SYNC_URL`, `VITE_CLOUD_SYNC_KEY`), while automatically running a zero-config **Live Multi-Tab Sync** engine (`BroadcastChannel` + structured `localStorage`) so open tabs stay synchronized in real time across reloads.
   - 1-click Top Header Role Switcher:
     - **`Content Creator`**: Draft, upload docs/visuals, scan, apply/customize fixes, and submit packets.
     - **`Brand Reviewer`**: Inspect side-by-side diffs, add review comments, request revisions, or grant sign-off approval.
     - **`Compliance Admin`**: Edit/toggle/import Brand Truth Sheet rules, configure outbound Webhook endpoints, and issue cryptographic publishing release tokens (`rel_...`).

5. **Strict Outbound Webhook Publishing Gate**
   - Remains **LOCKED** until **Brand Trust Score = 100%** AND **Human Approval Sign-Off** is granted.
   - Once unlocked, issues a cryptographic Release Token (`rel_YYYYMMDD_...`) and supports either dispatching a real HTTP `POST` webhook to any configured endpoint (Slack, Discord, Zapier, CMS) OR running **Simulate Production Webhook Delivery** to inspect full HTTP headers, JSON compliance payload, latency, and `200 OK` response logs in the UI.

---

## Quick Start (Clone & Run)

### Prerequisites
- **Node.js** `>= 18` (tested on Node 20/24)
- **npm** or **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/Sanjay-1029/nocap-ai.git
cd nocap-ai
```

### 2. Install Dependencies
```bash
npm install
# or: pnpm install
```

### 3. (Optional) Configure Cloud Workspace Sync
```bash
cp .env.example .env.local
```
Leave `.env.local` empty for zero-config **Live Multi-Tab Sync**, or provide `VITE_CLOUD_SYNC_URL` and `VITE_CLOUD_SYNC_KEY` for Supabase/Firebase cloud persistence.

### 4. Run Development Server
```bash
npm run dev
```
Open **WWW.nocapai.xyz** in your browser.

### 5. Build for Production
```bash
npm run build
```
Runs strict TypeScript checking (`tsc -b`) followed by the Vite production bundle (`vite build`).

---

## Architecture Overview

```text
src/
├── App.tsx                             # Root state, dual-layer sync, RBAC header, 5 workspace views
├── types.ts                            # Strict TypeScript domain models (Rules, Violations, VisualAsset, Webhooks, Certificates)
├── utils/
│   ├── verifier.ts                     # Multi-occurrence deterministic + Gemini 2.5 Flash text engine & idempotent global fixer
│   ├── visualAuditor.ts                # Visual validation (<=10MB), Canvas palette sampler, Gemini Vision & deterministic fallback
│   ├── auditCertificate.ts             # Web Crypto SHA-256 hashing + jsPDF certificate & JSON proof generator
│   ├── workspaceSync.ts                # Dual-layer Supabase/Firebase REST + BroadcastChannel/localStorage sync
│   ├── webhookGate.ts                  # Strict 100% + sign-off gate evaluator, rel_ token generator, live & simulated HTTP POST
│   └── fileParser.ts                   # Client-side PDF (pdfjs-dist), DOCX (mammoth), TXT, and MD extraction
└── components/
    ├── LandingPage.tsx                 # Dark liquid-mesh hero with 1-click zero-login workspace entry
    ├── Navbar.tsx                      # Persistent left sidebar, Gemini API key modal & role drawer
    ├── DashboardView.tsx               # Executive Bento Dashboard with live compliance telemetry
    ├── ConveyorScannerOverlay.tsx      # Animated AI inspection conveyor pipeline overlay
    ├── DraftEditor.tsx                 # Notion-style editor, simultaneous multi-span preview, Diff view & Visual Preview Card
    ├── ViolationPanel.tsx              # Unified text + VISUAL AUDIT cards, Brand Trust gauge & Certificate export
    ├── TruthSheetPanel.tsx             # Role-gated Brand Knowledge Base with search, inline editing & PDF/TXT policy import
    ├── ApprovalQueue.tsx               # 3-stage Creator → Reviewer → Admin approval workflow
    ├── PublishingGatePanel.tsx         # Locked/Unlocked Outbound Webhook Gate & HTTP delivery console
    ├── AnalyticsView.tsx               # Governance telemetry, rule distribution & team compliance table
    └── RoleModal.tsx                   # Role overview & instant persona switcher modal
```

---

## Judge Testing Checklist

1. **Zero-Login Entry**: Click **Launch Live Demo Workspace — No Login Required** on the landing hero.
2. **Multi-Occurrence Span Remediation**: In Content Scanner, hover `FACT-01`, `FACT-02`, or `FACT-03` to see simultaneous highlights in both the body paragraphs and the bottom Markdown summary table. Click **Apply All** to reach `100%` without corrupting table pipes.
3. **Multimodal Visual Audit**: Click **Load Sample Banner** (or upload any `.png`/`.jpg`/`.webp`), watch the multimodal conveyor scan run, inspect the purple `VISUAL AUDIT` cards and sampled color swatches, and mark them remediated.
4. **Signed Audit Certificate**: Once at `100%`, click **Download Audit Certificate (PDF)** or **JSON Proof** to inspect the SHA-256 hashes and remediation ledger.
5. **Multi-Role RBAC & Webhook Publishing Gate**:
   - Click **Submit to Approval Center & Publishing Gate**.
   - Notice the Publishing Gate is **LOCKED** (`Awaiting Brand Reviewer / Compliance Admin sign-off`).
   - Switch to **`Brand Reviewer`** in the top header and click **Approve & Sign Off** — a cryptographic `rel_...` token is issued and the gate unlocks.
   - Switch to **`Compliance Admin`** and click **Simulate Production Webhook Delivery** (or enter a live webhook URL) to inspect the HTTP `POST` headers, JSON payload, and `200 OK` response log.
6. **Multi-Tab Persistence**: Open a second tab at `http://localhost:5173/` and toggle a rule or reset the demo workspace — changes synchronize live across tabs and survive refreshes.
