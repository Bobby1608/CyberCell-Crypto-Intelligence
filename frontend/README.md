# 🎨 CyberCell Forensic SecOps Frontend

> **UI & Interactivity Module — SIH Problem Statement 26183**  
> Built with **React 18**, **Vite**, **@xyflow/react (ReactFlow)**, **Tailwind CSS v3**, and **Lucide Icons**.

---

## 🏛 Architecture & Layout Structure

The frontend is built as a single-page **Institutional Forensic Dashboard** (`InvestigationDashboard.tsx`) featuring an asymmetric 3-column operational layout locked permanently to a dark SecOps color palette (`#0B192C` canvas, `#0F172A` panels, `#1E293B` elevated cards):

```
+----------------------------------------------------------------------------------------------------+
| TOPBAR (56px) — Brand Logo, Sepolia Sync Status, Search Bar, Dossier PDF & Sec 94 Freeze Actions  |
+----------------------------------------------------------------------------------------------------+
| 1. LEFT SIDEBAR (340px)  | 2. CENTER CANVAS (Flex-1)        | 3. RIGHT DRAWER (380px)              |
|   - NCRP Case Intake     |   - ReactFlow Node Graph         |   - Risk Score Dial & Indicators     |
|   - Cyber Crime Form     |   - Dagre LR Auto-Layout Engine  |   - Laundering Typology Alerts       |
|   - Case Benchmark       |   - MiniMap & Zoom Controls      |   - Asset Recovery Target & Nodal    |
|   - Telemetry Monitor    |   - Loading Skeleton / Idle Mask |   - Live SSE Event Ingress Feed      |
+----------------------------------------------------------------------------------------------------+
```

---

## 🔑 Key Files & Directory Overview

### 1. Main Page & Graph Canvas
- **`src/pages/InvestigationDashboard.tsx`**: Primary workspace controller. Integrates the 3-column layout, handles search triggers, runs multi-hop on-chain crawling, executes PDF dossier generation, and renders real-time SSE stream telemetry.
- **`src/components/nodes/WalletNode.tsx`**: Custom ReactFlow node component rendering wallet addresses, risk badges, balances, net flows, and role borders.
  - **Suspect Target**: Crimson border (`#DC2626`)
  - **Intermediary Mule Hop**: Dashed Amber border (`#F59E0B`)
  - **Terminal VASP / Exchange**: Emerald border (`#10B981`) with radial glow shadow and verified entity label (e.g. Binance, CoinDCX).
- **`src/utils/layout.ts`**: Implements `@dagrejs/dagre` graph auto-layout algorithm for Left-to-Right (`LR`) multi-hop layering.
- **`src/utils/formatters.ts`**: Shared utility for truncating Ethereum addresses safely while preserving the leading `0x` (`formatAddress(addr, 6, 4)`).

### 2. Live Data & SSE Integration
- **`src/hooks/useInvestigationStream.ts`**: React Hook connecting to FastAPI SSE endpoint (`/api/v1/stream/events`). Listens for live block transactions, graph updates, risk evaluations, and NCRP intake webhooks.

### 3. Legal Compliance & Modals
- **`src/components/modals/LegalNoticeModal.tsx`**: Section 94 BNSS Statutory Freeze Notice generator modal. Formats formal legal requisitions for accredited Nodal Officers.
- **`src/components/ComplianceDrawer.jsx`**: Detailed SAHYOG schema JSON exporter and legal notice drawer for target exchanges.

### 4. Design Tokens & Styling
- **`tailwind.config.js`**: Custom Tailwind theme extending color tokens (`surface-canvas`, `surface-panel`, `ink-primary`, `accent-crimson`, `accent-emerald`, etc.) and enforcing `Inter` & `JetBrains Mono` typography.
- **`src/index.css`**: Global design tokens, dark mode base styling, glassmorphism utilities, and skeleton shimmer animations.

---

## 🛠 Developer Workflow & Customization

### How to Add a New VASP Directory Contact
To add statutory Nodal Officer details for a new exchange, open `src/pages/InvestigationDashboard.tsx` and add your mapping to `VASP_CONTACTS`:

```typescript
const VASP_CONTACTS: Record<string, { email: string; legalEntity: string }> = {
  myexchange: {
    email: 'nodal@myexchange.com',
    legalEntity: 'MyExchange Global Ltd.',
  },
};
```

### How to Modify Graph Node Colors or Badges
Edit `getBorderStyle()` in `src/components/nodes/WalletNode.tsx` to customize node borders, glow shadows, or icons.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```
