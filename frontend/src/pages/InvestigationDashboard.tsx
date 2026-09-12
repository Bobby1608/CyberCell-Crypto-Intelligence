import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Search, Radio, AlertTriangle, ShieldCheck, Activity,
  RefreshCw, Download, FileText, FileSignature, Building2,
  ChevronRight, Shield, Layers, Cpu, Lock
} from 'lucide-react';
import { useInvestigationStream } from '../hooks/useInvestigationStream';
import { getLayoutedElements } from '../utils/layout';
import WalletNode, { isVaspNode, WalletNodeData } from '../components/nodes/WalletNode';
import LegalNoticeModal from '../components/modals/LegalNoticeModal';
import { formatAddress } from '../utils/formatters';

const nodeTypes = {
  walletNode: WalletNode,
};

// ─── Design Token Inline Refs (for non-Tailwind contexts like ReactFlow) ──────
const T = {
  canvas:   '#0B192C',
  panel:    '#0F172A',
  elevated: '#1E293B',
  border:   '#334155',
  inkPri:   '#F8FAFC',
  inkSec:   '#94A3B8',
  crimson:  '#DC2626',
  saffron:  '#D97706',
  emerald:  '#10B981',
  cyan:     '#06B6D4',
} as const;

// ─── Fraud Typology Options ───────────────────────────────────────────────────
const FRAUD_TYPOLOGIES = [
  'Investment Scam / Task-Based Fraud',
  'Ponzi / Pyramid Scheme',
  'Romance Scam',
  'Sextortion / Blackmail',
  'Phishing / Account Takeover',
  'Ransomware Payment',
  'Drug / Narcotics Purchase',
  'Terrorist Financing (TFSC)',
  'NFT / DeFi Rug Pull',
  'Other',
];

// ─── Format timestamp as HH:MM:SS ────────────────────────────────────────────
const fmtTime = (ts: number): string => {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
};

// ─── Event type color map ─────────────────────────────────────────────────────
const EVT_COLOR: Record<string, string> = {
  TX_INCLUDED:            T.saffron,
  GRAPH_UPDATED:          T.cyan,
  RISK_EVALUATED:         T.crimson,
  SURVEILLANCE_ADDED:     T.emerald,
  NCRP_COMPLAINT_INGESTED: '#A78BFA',
};

// ─── Skeleton block component ─────────────────────────────────────────────────
const SkeletonBlock: React.FC<{ w?: string; h?: string; className?: string }> = ({
  w = '100%', h = '14px', className = ''
}) => (
  <div className={`skeleton ${className}`} style={{ width: w, height: h }} />
);

export const InvestigationDashboard: React.FC = () => {
  // ── Wallet Search State ──────────────────────────────────────────────────
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [activeRoot, setActiveRoot] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // ── Dossier State ────────────────────────────────────────────────────────
  const [isDownloadingDossier, setIsDownloadingDossier] = useState<boolean>(false);
  const [riskReport, setRiskReport] = useState<any>(null);

  // ── Legal Modal ──────────────────────────────────────────────────────────
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);

  // ── NCRP Inline Form State ───────────────────────────────────────────────
  const [ncrpComplaintId, setNcrpComplaintId] = useState<string>('');
  const [ncrpTypology, setNcrpTypology] = useState<string>(FRAUD_TYPOLOGIES[0]);
  const [ncrpVictimLoss, setNcrpVictimLoss] = useState<string>('');
  const [ncrpAssetQuote, setNcrpAssetQuote] = useState<string>('');
  const [ncrpWallet, setNcrpWallet] = useState<string>('');
  const [ncrpSubmitting, setNcrpSubmitting] = useState<boolean>(false);
  const [ncrpFeedback, setNcrpFeedback] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'intake' | 'surveillance' | 'telemetry'>('intake');

  // ── ReactFlow Graph ──────────────────────────────────────────────────────
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // ── API Helpers ──────────────────────────────────────────────────────────
  const getApiUrl = (endpoint: string) =>
    typeof window !== 'undefined' && window.location.port === '5173'
      ? `http://localhost:8000${endpoint}`
      : endpoint;

  const API_KEY = import.meta.env.VITE_API_KEY || 'demo-key-2026';

  // ── Fetch Graph Snapshot ─────────────────────────────────────────────────
  const fetchGraphSnapshot = useCallback(async (targetAddr: string, crawl: boolean = false) => {
    if (!targetAddr) return;
    if (crawl) setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/investigation/${targetAddr}?crawl=${crawl}`), {
        headers: { 'X-API-Key': API_KEY }
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();

      if (data.riskReport) setRiskReport(data.riskReport);

      const rawNodes: Node[] = (data.graph?.nodes || []).map((n: any) => ({
        id: n.id.toLowerCase(),
        type: 'walletNode',
        data: {
          address:  n.id.toLowerCase(),
          label:    n.label,
          type:     n.type,
          category: n.category,
          is_vasp:  n.is_vasp,
          isVasp:   n.is_vasp || n.isVasp,
          vasp_name: n.vasp_name,
          hopCount:  n.hop_count,
          riskScore: n.risk_score,
          // Extended fields from API
          balance:  n.balance ?? null,
          netFlow:  n.net_flow ?? null,
          txMeta:   n.tx_meta ?? null,
        },
        position: { x: 0, y: 0 }
      }));

      const rawEdges: Edge[] = (data.graph?.edges || []).map((e: any, idx: number) => ({
        id: `e-${e.from.toLowerCase()}-${e.to.toLowerCase()}-${e.tx_hash || idx}`,
        source: e.from.toLowerCase(),
        target: e.to.toLowerCase(),
        animated: true,
        style: { stroke: T.cyan, strokeWidth: 2 },
        label: `${e.amount} ${e.asset_symbol}`,
        labelStyle: { fill: T.inkPri, fontWeight: 600, fontSize: 10, fontFamily: '"JetBrains Mono", monospace' },
        labelBgStyle: { fill: T.elevated, rx: 2, ry: 2, stroke: T.border },
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges, 'LR');
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      console.error('[Dashboard] Error fetching graph snapshot:', err);
    } finally {
      if (crawl) setLoading(false);
    }
  }, [setNodes, setEdges]);

  const fetchTimerRef = useRef<any>(null);
  const debouncedFetchSnapshot = useCallback((targetAddr: string) => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => fetchGraphSnapshot(targetAddr, false), 50);
  }, [fetchGraphSnapshot]);

  // ── Telemetry ─────────────────────────────────────────────────────────────
  const latestTelemetryRef = useRef<{ t1_ns?: number; t6_ms?: number; backend_latency_ms?: number } | null>(null);

  // ── SSE Stream ────────────────────────────────────────────────────────────
  const { isConnected, events, latestRiskReport } = useInvestigationStream({
    onTxIncluded: (data) => {
      if (data) latestTelemetryRef.current = { t1_ns: data.telemetry?.t1_ns, t6_ms: data._t6_ms, backend_latency_ms: data.telemetry?.backend_latency_ms };
      if (activeRoot) debouncedFetchSnapshot(activeRoot);
    },
    onGraphUpdated: (data) => {
      if (data) latestTelemetryRef.current = { t1_ns: data.telemetry?.t1_ns, t6_ms: data._t6_ms, backend_latency_ms: data.telemetry?.backend_latency_ms };
      if (activeRoot) debouncedFetchSnapshot(activeRoot);
    },
    onRiskEvaluated: (report) => {
      if (report) {
        latestTelemetryRef.current = { t1_ns: report.telemetry?.t1_ns, t6_ms: report._t6_ms, backend_latency_ms: report.telemetry?.backend_latency_ms };
        if (report.root_address?.toLowerCase() === activeRoot?.toLowerCase()) {
          setRiskReport((prev: any) => ({
            ...prev, ...report,
            vasp_attribution: report.vasp_attribution ?? prev?.vasp_attribution
          }));
        }
      }
    }
  });

  useEffect(() => {
    if (events.length > 0) {
      const latestData = events[0]?.data;
      if (latestData?._t6_ms && !latestTelemetryRef.current) {
        latestTelemetryRef.current = { t1_ns: latestData.telemetry?.t1_ns, t6_ms: latestData._t6_ms, backend_latency_ms: latestData.telemetry?.backend_latency_ms };
      }
    }
  }, [events]);

  useLayoutEffect(() => {
    if (latestTelemetryRef.current?.t6_ms) {
      const t7_ms = performance.now();
      const { t6_ms, backend_latency_ms } = latestTelemetryRef.current;
      const renderDeltaMs = t7_ms - t6_ms;
      console.log(`[Telemetry] T6 -> T7 (React DOM Render): ${renderDeltaMs.toFixed(2)} ms`);
      if (backend_latency_ms) console.log(`[Telemetry] Pipeline Transit: ~${(renderDeltaMs + backend_latency_ms).toFixed(2)} ms`);
      latestTelemetryRef.current = null;
    }
  }, [nodes, edges, events]);

  useEffect(() => {
    if (latestRiskReport && latestRiskReport.root_address?.toLowerCase() === activeRoot?.toLowerCase()) {
      setRiskReport((prev: any) => ({
        ...prev, ...latestRiskReport,
        vasp_attribution: latestRiskReport.vasp_attribution ?? prev?.vasp_attribution
      }));
    }
  }, [latestRiskReport, activeRoot]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchAddress.trim().toLowerCase();
    if (clean) { setActiveRoot(clean); fetchGraphSnapshot(clean, true); }
  };

  const submitNCRP = async () => {
    if (!ncrpWallet.trim()) { setNcrpFeedback('Root suspect wallet address is required.'); return; }
    setNcrpSubmitting(true);
    setNcrpFeedback('');
    try {
      const payload = {
        complaint_identifier:  ncrpComplaintId.trim() || undefined,
        fraud_typology:        ncrpTypology,
        victim_loss_inr:       ncrpVictimLoss ? parseFloat(ncrpVictimLoss) : undefined,
        asset_quote_crypto:    ncrpAssetQuote.trim() || undefined,
        reported_wallet:       ncrpWallet.trim().toLowerCase(),
      };
      const res = await fetch(getApiUrl('/api/v1/integrations/ncrp/ingest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(payload)
      });
      const responseData = await res.json();
      if (res.ok) {
        setNcrpFeedback(`✓ Complaint intaked. Case Ref: ${responseData.case_reference_id}`);
        setActiveRoot(payload.reported_wallet);
        fetchGraphSnapshot(payload.reported_wallet, true);
        setNcrpWallet('');
        setNcrpComplaintId('');
        setNcrpVictimLoss('');
        setNcrpAssetQuote('');
      } else {
        setNcrpFeedback(`✗ Failed: ${responseData.detail}`);
      }
    } catch (e) {
      setNcrpFeedback(`✗ Error: ${e}`);
    } finally {
      setNcrpSubmitting(false);
    }
  };

  const runForensicTrace = () => {
    const clean = (ncrpWallet || searchAddress).trim().toLowerCase();
    if (clean) { setActiveRoot(clean); fetchGraphSnapshot(clean, true); }
  };

  const downloadDossier = async () => {
    if (!activeRoot) return;
    setIsDownloadingDossier(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/investigation/${activeRoot}/export-report`), {
        headers: { 'X-API-Key': API_KEY }
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LEA_Dossier_${activeRoot.substring(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Failed to download dossier:', e);
    } finally {
      setIsDownloadingDossier(false);
    }
  };

// ─── VASP Statutory Nodal Contact Directory ──────────────────────────────────────
const VASP_CONTACTS: Record<string, { email: string; legalEntity: string }> = {
  binance: {
    email: 'in-compliance@binance.com',
    legalEntity: 'Binance Services Holdings Ltd.',
  },
  coindcx: {
    email: 'nodal.officer@coindcx.com',
    legalEntity: 'CoinDCX',
  },
  wazirx: {
    email: 'nodalofficer@wazirx.com',
    legalEntity: 'Zanmai Labs Pvt Ltd (WazirX)',
  },
  okx: {
    email: 'enforcement@okx.com',
    legalEntity: 'OKX Operations Legal Desk',
  },
  kraken: {
    email: 'compliance@kraken.com',
    legalEntity: 'Payward, Inc. (Kraken)',
  },
};

const resolveVaspContact = (vaspName?: string) => {
  if (!vaspName) return null;
  const normalized = vaspName.toLowerCase();
  if (normalized.includes('binance')) return VASP_CONTACTS.binance;
  if (normalized.includes('coindcx')) return VASP_CONTACTS.coindcx;
  if (normalized.includes('wazirx')) return VASP_CONTACTS.wazirx;
  if (normalized.includes('okx')) return VASP_CONTACTS.okx;
  if (normalized.includes('kraken')) return VASP_CONTACTS.kraken;
  return null;
};

// Inside InvestigationDashboard...
  // ── Risk Gauge ────────────────────────────────────────────────────────────
  const score = riskReport?.risk_score ?? 0.0;
  const typologies = riskReport?.typologies ?? {};

  const getRiskColor = (s: number) => {
    if (s >= 0.7) return { color: T.crimson, label: 'CRITICAL FRAUD RISK', border: 'rgba(220,38,38,0.4)' };
    if (s >= 0.3) return { color: T.saffron, label: 'MEDIUM RISK',         border: 'rgba(217,119,6,0.4)' };
    return           { color: T.emerald,  label: 'LOW RISK',              border: 'rgba(16,185,129,0.4)' };
  };
  const gaugeStyle = getRiskColor(score);

  // ── Typology active count ─────────────────────────────────────────────────
  const activeTypologyCount = Object.values(typologies).filter(Boolean).length;

  // ── Dissipated & Drain Calculations ──────────────────────────────────────
  const dissipatedAmount = React.useMemo(() => {
    // Sum edge amounts flowing into terminal VASP nodes
    const vaspNodeIds = new Set(
      nodes.filter(n => isVaspNode(n.data as unknown as WalletNodeData)).map(n => n.id.toLowerCase())
    );
    let total = 0;
    edges.forEach(edge => {
      if (vaspNodeIds.has(edge.target.toLowerCase())) {
        // extract amount from edge label or property
        const labelText = typeof edge.label === 'string' ? edge.label : '';
        const match = labelText.match(/([\d.]+)/);
        const val = match ? Number(match[1]) : Number((edge as any).amount || 0);
        if (!isNaN(val) && val > 0) {
          total += val;
        }
      }
    });
    // Fallback if total calculated from edges is 0 but riskReport provides total_drained
    if (total === 0 && riskReport?.total_drained != null) {
      const parsed = Number(riskReport.total_drained);
      if (!isNaN(parsed)) total = parsed;
    }
    return total;
  }, [nodes, edges, riskReport]);

  const baselineLoss = React.useMemo(() => {
    if (ncrpVictimLoss) {
      const parsed = Number(ncrpVictimLoss);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (riskReport?.victim_loss != null) {
      const parsed = Number(riskReport.victim_loss);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (riskReport?.total_victim_loss != null) {
      const parsed = Number(riskReport.total_victim_loss);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return dissipatedAmount > 0 ? dissipatedAmount : 0;
  }, [ncrpVictimLoss, riskReport, dissipatedAmount]);

  const identifiedDrain = dissipatedAmount;
  const drainPercentage = React.useMemo(() => {
    if (baselineLoss <= 0) return identifiedDrain > 0 ? 100 : 0;
    return Math.min(100, Math.round((identifiedDrain / baselineLoss) * 100));
  }, [identifiedDrain, baselineLoss]);

  // Dynamic Nodal Officer Details
  const targetVaspName = riskReport?.vasp_attribution?.vasp_name ||
    nodes.find(n => isVaspNode(n.data as unknown as WalletNodeData))?.data?.vasp_name ||
    nodes.find(n => isVaspNode(n.data as unknown as WalletNodeData))?.data?.label;

  const nodalContact = resolveVaspContact(targetVaspName);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100vw', height: '100vh',
      background: T.canvas, color: T.inkPri,
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* ══════════════════════════════════════════════════════════════════════
          TOPBAR — 56px fixed
      ══════════════════════════════════════════════════════════════════════ */}
      <header style={{
        height: '56px', minHeight: '56px',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: '16px',
        background: T.panel,
        borderBottom: `1px solid ${T.border}`,
        zIndex: 20, flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(6,182,212,0.12)', padding: '6px',
            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid rgba(6,182,212,0.25)`,
          }}>
            <Activity size={18} color={T.cyan} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em', color: T.inkPri, lineHeight: 1.2 }}>
              CRYPTO FORENSICS
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: T.border, flexShrink: 0 }} />

        {/* Wallet Search */}
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: T.elevated, padding: '0 12px', height: '34px',
          borderRadius: '4px', border: `1px solid ${T.border}`,
          flex: '1 1 280px', maxWidth: '520px',
          transition: 'border-color 0.15s ease',
        }}>
          <Search size={13} color={T.inkSec} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Enter Root Suspect Wallet Address (0x...)"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: T.inkPri, width: '100%', paddingLeft: '4px', boxSizing: 'border-box',
              fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', fontWeight: 500,
              textOverflow: 'ellipsis',
            }}
          />
          <button type="submit" disabled={loading} style={{
            background: loading ? T.border : T.cyan,
            border: 'none', color: T.panel,
            padding: '4px 12px', borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '11px', fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: '5px',
            flexShrink: 0, letterSpacing: '0.05em',
            transition: 'all 0.15s ease',
          }}>
            {loading && <RefreshCw size={11} className="spin" />}
            {loading ? 'CRAWLING...' : 'INSPECT'}
          </button>
        </form>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* SSE Status Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '4px', flexShrink: 0,
          background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${isConnected ? 'rgba(16,185,129,0.35)' : 'rgba(220,38,38,0.35)'}`,
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: isConnected ? T.emerald : T.crimson,
            boxShadow: isConnected ? `0 0 6px ${T.emerald}` : `0 0 6px ${T.crimson}`,
          }} className={isConnected ? 'pulse-glow' : ''} />
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: isConnected ? T.emerald : T.crimson }}>
            {isConnected ? 'SEPOLIA SYNCED' : 'OFFLINE'}
          </span>
        </div>

        {/* LEA Dossier Button */}
        <button
          disabled={!activeRoot || isDownloadingDossier}
          onClick={downloadDossier}
          style={{
            background: isDownloadingDossier ? 'rgba(220,38,38,0.15)' : activeRoot ? 'rgba(220,38,38,0.12)' : 'transparent',
            border: `1px solid ${activeRoot ? 'rgba(220,38,38,0.5)' : T.border}`,
            color: activeRoot ? T.crimson : T.inkSec,
            padding: '5px 12px', borderRadius: '4px',
            cursor: activeRoot && !isDownloadingDossier ? 'pointer' : 'not-allowed',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
            display: 'flex', alignItems: 'center', gap: '6px',
            flexShrink: 0, transition: 'all 0.15s ease',
          }}
        >
          {isDownloadingDossier ? <RefreshCw size={12} className="spin" /> : <Download size={12} />}
          GENERATE SEC 63 DOSSIER
        </button>

        {/* SEC 94 Freeze */}
        <button
          disabled={!riskReport?.vasp_attribution?.is_vasp}
          onClick={() => setShowLegalModal(true)}
          style={{
            background: riskReport?.vasp_attribution?.is_vasp ? 'rgba(220,38,38,0.9)' : T.elevated,
            border: `1px solid ${riskReport?.vasp_attribution?.is_vasp ? T.crimson : T.border}`,
            color: riskReport?.vasp_attribution?.is_vasp ? '#fff' : T.inkSec,
            padding: '5px 12px', borderRadius: '4px',
            cursor: riskReport?.vasp_attribution?.is_vasp ? 'pointer' : 'not-allowed',
            fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: '6px',
            flexShrink: 0,
          }}
        >
          <FileSignature size={12} />
          SEC 94 FREEZE
        </button>
      </header>


      {/* ══════════════════════════════════════════════════════════════════════
          MAIN 3-COLUMN WORKSPACE
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── LEFT SIDEBAR — 340px — NCRP Intake ─────────────────────────── */}
        <aside style={{
          width: '340px', minWidth: '340px',
          background: T.panel,
          borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
          height: '100%', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '12px 16px 0 16px',
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: T.cyan }}>
                  ◉ CIS WORKSTATION
                </div>
                <div style={{ fontSize: '10px', color: T.inkSec, marginTop: '2px' }}>
                  NCRP/2026 // CASE INTAKE TERMINAL
                </div>
              </div>
              <div style={{
                padding: '3px 8px', borderRadius: '4px', fontSize: '10px',
                fontWeight: 800, letterSpacing: '0.08em',
                background: isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(220,38,38,0.15)',
                border: `1px solid ${isConnected ? 'rgba(16,185,129,0.4)' : 'rgba(220,38,38,0.4)'}`,
                color: isConnected ? T.emerald : T.crimson,
              }}>
                {isConnected ? 'LIVE READY' : 'CONNECTING'}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0' }}>
              {(['intake', 'surveillance', 'telemetry'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${T.cyan}` : '2px solid transparent',
                  color: activeTab === tab ? T.inkPri : T.inkSec,
                  padding: '6px 14px', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', transition: 'all 0.15s ease',
                }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Intake Tab Content */}
          {activeTab === 'intake' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Complaint Identifier */}
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                  COMPLAINT IDENTIFIER
                </label>
                <input
                  type="text"
                  value={ncrpComplaintId}
                  onChange={e => setNcrpComplaintId(e.target.value)}
                  placeholder="NCRP/2026/MHA/00000"
                  style={{
                    width: '100%', padding: '7px 10px',
                    background: T.elevated, border: `1px solid ${T.border}`,
                    borderRadius: '4px', color: T.inkPri, outline: 'none',
                    fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
                  }}
                />
              </div>

              {/* Fraud Typology */}
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                  FRAUD TYPOLOGY
                </label>
                <select
                  value={ncrpTypology}
                  onChange={e => setNcrpTypology(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px',
                    background: T.elevated, border: `1px solid ${T.border}`,
                    borderRadius: '4px', color: T.inkPri, outline: 'none',
                    fontSize: '12px',
                  }}
                >
                  {FRAUD_TYPOLOGIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Victim Loss + Asset Quote */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                    VICTIM LOSS (₹)
                  </label>
                  <input
                    type="number"
                    value={ncrpVictimLoss}
                    onChange={e => setNcrpVictimLoss(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%', padding: '7px 10px',
                      background: T.elevated, border: `1px solid ${T.border}`,
                      borderRadius: '4px', color: T.crimson, outline: 'none',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', fontWeight: 700,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                    ASSET QUOTE
                  </label>
                  <input
                    type="text"
                    value={ncrpAssetQuote}
                    onChange={e => setNcrpAssetQuote(e.target.value)}
                    placeholder="0.00 ETH"
                    style={{
                      width: '100%', padding: '7px 10px',
                      background: T.elevated, border: `1px solid ${T.border}`,
                      borderRadius: '4px', color: T.inkPri, outline: 'none',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              {/* Root Suspect Wallet */}
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                  ROOT SUSPECT WALLET (VICTIM REPORTED)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={ncrpWallet}
                    onChange={e => setNcrpWallet(e.target.value)}
                    placeholder="0x..."
                    style={{
                      flex: 1, padding: '7px 10px', paddingLeft: '10px',
                      boxSizing: 'border-box',
                      background: T.elevated, border: `1px solid ${T.border}`,
                      borderRadius: '4px', color: T.inkPri, outline: 'none',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
                      textOverflow: 'ellipsis',
                    }}
                  />
                  <button
                    onClick={() => { if (ncrpWallet.trim()) { setSearchAddress(ncrpWallet.trim()); } }}
                    title="Sync to search bar"
                    style={{
                      background: T.elevated, border: `1px solid ${T.border}`,
                      color: T.inkSec, borderRadius: '4px', padding: '0 8px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Run Trace CTA */}
              <button
                onClick={runForensicTrace}
                disabled={loading}
                style={{
                  width: '100%', padding: '9px 0',
                  background: loading ? T.elevated : T.cyan,
                  border: `1px solid ${loading ? T.border : T.cyan}`,
                  borderRadius: '4px', color: T.panel,
                  fontSize: '11px', fontWeight: 900, letterSpacing: '0.08em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? <RefreshCw size={13} className="spin" /> : <Layers size={13} />}
                {loading ? 'CRAWLING ON-CHAIN DATA...' : '⬡ RUN MULTI-HOP FORENSIC TRACE'}
              </button>

              {/* Submit NCRP */}
              <button
                onClick={submitNCRP}
                disabled={ncrpSubmitting}
                style={{
                  width: '100%', padding: '7px 0',
                  background: 'transparent',
                  border: `1px solid ${T.border}`,
                  borderRadius: '4px', color: T.inkSec,
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                  cursor: ncrpSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {ncrpSubmitting ? <RefreshCw size={12} className="spin" /> : <FileText size={12} />}
                {ncrpSubmitting ? 'SUBMITTING COMPLAINT...' : 'SUBMIT NCRP INTAKE'}
              </button>

              {/* Feedback */}
              {ncrpFeedback && (
                <div style={{
                  padding: '8px 10px', borderRadius: '4px', fontSize: '11px',
                  fontFamily: '"JetBrains Mono", monospace', fontWeight: 600,
                  background: ncrpFeedback.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)',
                  border: `1px solid ${ncrpFeedback.startsWith('✓') ? 'rgba(16,185,129,0.4)' : 'rgba(220,38,38,0.4)'}`,
                  color: ncrpFeedback.startsWith('✓') ? T.emerald : T.crimson,
                }}>
                  {ncrpFeedback}
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '10px', marginTop: '2px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  CASE BENCHMARK
                </div>
                {activeRoot ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: T.inkSec }}>Total Intermediaries</span>
                      <span style={{ color: T.inkPri, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                        {riskReport?.total_nodes ?? nodes.length} Nodes
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: T.inkSec }}>Identified Drain</span>
                      <span style={{ color: T.crimson, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                        {`${identifiedDrain.toFixed(4)} ETH (${drainPercentage}%)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: T.inkSec }}>Terminal Cluster</span>
                      <span style={{ color: T.emerald, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                        {riskReport?.vasp_attribution?.vasp_name ?? '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: T.inkSec }}>Case Tag</span>
                      <span style={{
                        color: T.cyan, fontWeight: 800, fontSize: '10px',
                        padding: '2px 7px', borderRadius: '4px',
                        background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                      }}>
                        CIS-PRIORITY-1
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: T.inkSec, fontStyle: 'italic' }}>
                    No active investigation target.
                  </div>
                )}
              </div>

              {/* Recent NCRP events from SSE */}
              {events.filter(e => e.event === 'NCRP_COMPLAINT_INGESTED').length > 0 && (
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', marginBottom: '6px' }}>
                    RECENT INTAKES (LIVE)
                  </div>
                  {events.filter(e => e.event === 'NCRP_COMPLAINT_INGESTED').slice(0, 3).map((evt, i) => (
                    <div key={i} style={{
                      padding: '6px 8px', marginBottom: '4px', borderRadius: '4px',
                      background: T.elevated, border: `1px solid ${T.border}`,
                      fontSize: '10px', fontFamily: '"JetBrains Mono", monospace', color: T.inkSec,
                    }}>
                      <span style={{ color: '#A78BFA' }}>{evt.data.acknowledgement_no ?? 'PENDING'}</span>
                      {' '}→ {evt.data.reported_wallet?.slice(0, 12)}...
                      <span style={{ float: 'right', color: T.inkSec }}>{fmtTime(evt.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Surveillance Tab */}
          {activeTab === 'surveillance' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', gap: '10px' }}>
              <Radio size={28} color={T.border} />
              <div style={{ fontSize: '12px', color: T.inkSec, textAlign: 'center' }}>
                Surveillance monitor feeds appear here when watchlist addresses generate on-chain activity.
              </div>
            </div>
          )}

          {/* Telemetry Tab */}
          {activeTab === 'telemetry' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', marginBottom: '4px' }}>
                PIPELINE PERFORMANCE
              </div>
              <div style={{ fontSize: '11px', color: T.inkSec }}>
                SSE Status: <span style={{ color: isConnected ? T.emerald : T.crimson, fontWeight: 700 }}>
                  {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: T.inkSec }}>
                Events Received: <span style={{ color: T.inkPri, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>{events.length}</span>
              </div>
              <div style={{ fontSize: '11px', color: T.inkSec }}>
                Active Root: <span style={{ color: T.cyan, fontFamily: '"JetBrains Mono", monospace', fontSize: '10px' }}>
                  {activeRoot || '—'}
                </span>
              </div>
            </div>
          )}
        </aside>


        {/* ── CENTER — ReactFlow Canvas ───────────────────────────────────── */}
        <div style={{ flex: 1, height: '100%', position: 'relative', background: T.canvas, overflow: 'hidden' }}>

          {/* Loading Skeleton Mask */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(11,25,44,0.92)', backdropFilter: 'blur(3px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '20px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                  <RefreshCw size={18} color={T.cyan} className="spin" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: T.cyan, letterSpacing: '0.08em' }}>
                    CRAWLING SEPOLIA ON-CHAIN DATA
                  </span>
                </div>
                {/* Skeleton nodes */}
                {[100, 180, 80, 140].map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <SkeletonBlock w={`${w}px`} h="56px" />
                    <div style={{ fontSize: '10px', color: T.border }}>──→</div>
                    <SkeletonBlock w={`${240 - w}px`} h="56px" />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: T.inkSec, letterSpacing: '0.06em' }}>
                BUILDING TRANSACTION GRAPH & EVALUATING RISK VECTORS...
              </div>
            </div>
          )}

          {/* Idle Workspace State */}
          {!activeRoot && !loading && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5, textAlign: 'center',
              maxWidth: '400px',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '4px',
                border: `1px solid ${T.border}`,
                background: T.elevated,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}>
                <Shield size={36} color={T.border} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: T.inkPri, letterSpacing: '0.08em', marginBottom: '8px' }}>
                IDLE WORKSPACE
              </div>
              <div style={{ fontSize: '11px', color: T.inkSec, lineHeight: 1.7, marginBottom: '16px' }}>
                No suspect target address submitted. Enter a Sepolia wallet address in the search bar or submit an NCRP intake form to initiate a multi-hop forensic trace.
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '4px',
                border: `1px solid ${T.border}`,
                fontSize: '10px', color: T.inkSec, letterSpacing: '0.08em',
              }}>
                <Cpu size={12} color={T.border} />
                I4C FORENSIC ENGINE — OPERATIONAL
              </div>
            </div>
          )}

          {/* Dossier Compile Mask */}
          {isDownloadingDossier && (
            <div style={{
              position: 'absolute', top: 16, right: 16, zIndex: 15,
              background: T.panel, border: `1px solid ${T.crimson}`,
              borderRadius: '4px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: `0 0 20px rgba(220,38,38,0.2)`,
            }}>
              <Lock size={14} color={T.crimson} className="pulse-glow" />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: T.crimson, letterSpacing: '0.06em' }}>
                  COMPILING LEA DOSSIER
                </div>
                <div style={{ fontSize: '10px', color: T.inkSec, marginTop: '2px' }}>
                  Generating statutory PDF report...
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: '6px', width: '160px', height: '3px', background: T.elevated, borderRadius: '2px', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ width: '100%', height: '3px' }} />
                </div>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color={T.border} gap={20} size={0.8} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const t = (n.data as any)?.type;
                if (t === 'suspect' || t === 'victim') return T.crimson;
                if ((n.data as any)?.is_vasp) return T.emerald;
                return T.saffron;
              }}
              maskColor="rgba(11,25,44,0.75)"
            />
          </ReactFlow>
        </div>


        {/* ── RIGHT SIDEBAR — 380px — Intel Drawer ───────────────────────── */}
        <aside style={{
          width: '380px', minWidth: '380px',
          background: T.panel,
          borderLeft: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
          height: '100%', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: T.inkPri }}>
              FORENSIC ANALYSIS
            </span>
            {score >= 0.7 && (
              <span style={{
                padding: '3px 8px', borderRadius: '4px', fontSize: '10px',
                fontWeight: 800, letterSpacing: '0.08em',
                background: 'rgba(220,38,38,0.15)', border: `1px solid rgba(220,38,38,0.5)`,
                color: T.crimson,
              }}>
                CRITICAL EVAL
              </span>
            )}
          </div>

          {/* Scrollable Intel Content */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* ── Risk Assessment ─────────────────────────────────────── */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em', marginBottom: '10px' }}>
                RISK ASSESSMENT REPORT
                {riskReport && (
                  <span style={{
                    float: 'right', padding: '2px 7px', borderRadius: '4px',
                    background: 'rgba(220,38,38,0.15)', border: `1px solid rgba(220,38,38,0.4)`,
                    color: T.crimson, fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em',
                  }}>
                    BNSS SEC 94 TRIGGER
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                background: T.elevated, padding: '14px', borderRadius: '4px',
                border: `1px solid ${gaugeStyle.border}`,
              }}>
                {/* Score Dial */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    fontSize: '40px', fontWeight: 900, color: gaugeStyle.color,
                    lineHeight: 1, fontFamily: '"JetBrains Mono", monospace',
                    textShadow: `0 0 20px ${gaugeStyle.color}60`,
                  }}>
                    {score.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: gaugeStyle.color, marginTop: '4px', letterSpacing: '0.06em' }}>
                    {gaugeStyle.label}
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '11px', color: T.inkSec }}>
                    Max Hop Depth: <span style={{ color: T.inkPri, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>
                      {riskReport?.max_hop_depth ?? 0}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: T.inkSec }}>
                    Paths Traced: <span style={{ color: T.inkPri, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>
                      {riskReport?.paths_detected ?? 0}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: T.inkSec }}>
                    Dissipated: <span style={{ color: T.saffron, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>
                      {dissipatedAmount.toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Detected Typologies ──────────────────────────────────── */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em' }}>
                  DETECTED LAUNDERING TYPOLOGIES
                </span>
                {activeTypologyCount > 0 && (
                  <span style={{
                    padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
                    background: 'rgba(220,38,38,0.15)', border: `1px solid rgba(220,38,38,0.4)`,
                    color: T.crimson,
                  }}>
                    {activeTypologyCount} Active Alert{activeTypologyCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Rapid Pass-Through */}
                <TypologyRow
                  label="Rapid Pass-Through"
                  sublabel={riskReport?.typology_details?.rapid_pass_through_meta ?? 'Transit Δt velocity analysis'}
                  active={!!typologies.rapid_pass_through}
                  icon="⚠"
                  color={T.crimson}
                />
                {/* Peel Chain */}
                <TypologyRow
                  label="Peel-Chain Geometry"
                  sublabel={riskReport?.typology_details?.peel_chain_meta ?? 'Sequential value reduction pattern'}
                  active={!!typologies.peel_chain}
                  icon="⛓"
                  color={T.saffron}
                />
                {/* Fan-Out */}
                <TypologyRow
                  label="Fan-Out Dispersion"
                  sublabel={riskReport?.typology_details?.fan_out_meta ?? 'Multi-wallet output branching'}
                  active={!!typologies.fan_out}
                  icon="◈"
                  color={T.cyan}
                />
              </div>
            </div>

            {/* ── VASP Attribution Card ────────────────────────────────── */}
            {riskReport?.vasp_attribution?.is_vasp && (
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.emerald, letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={12} /> ASSET RECOVERY TARGET
                </div>
                <div style={{
                  background: T.elevated, borderRadius: '4px', padding: '12px',
                  border: `1px solid rgba(16,185,129,0.3)`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: T.inkSec }}>Target VASP</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: T.inkPri }}>{riskReport.vasp_attribution.vasp_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: T.inkSec }}>Confidence</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: T.emerald,
                      padding: '2px 7px', background: 'rgba(16,185,129,0.1)',
                      borderRadius: '4px', border: `1px solid rgba(16,185,129,0.3)`,
                    }}>
                      {(riskReport.vasp_attribution.confidence_score * 100).toFixed(1)}%
                      {riskReport.vasp_attribution.confidence_score === 1 ? ' (EXACT)' : ' (HEURISTIC)'}
                    </span>
                  </div>

                  {/* Dynamic Nodal Officer Details */}
                  {nodalContact && (
                    <div className="mt-2 p-2 rounded bg-slate-900/60 border border-slate-700/50 text-xs" style={{ marginBottom: '10px' }}>
                      <div className="text-slate-400 font-medium">
                        Statutory Nodal Officer (LEA Desk):
                      </div>
                      <div className="text-emerald-400 font-mono mt-0.5 select-all">
                        {nodalContact.email}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Section 94 BNSS Order Target:{" "}
                        <span className="text-slate-200">
                          {nodalContact.legalEntity}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowLegalModal(true)}
                    style={{
                      width: '100%', padding: '8px',
                      background: 'rgba(220,38,38,0.85)', border: `1px solid ${T.crimson}`,
                      borderRadius: '4px', color: '#fff',
                      fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <FileSignature size={12} /> GENERATE FREEZE NOTICE
                  </button>
                </div>
              </div>
            )}

            {/* ── Real-Time Event Log ──────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Log Header */}
              <div style={{
                padding: '8px 16px',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: T.inkSec, letterSpacing: '0.08em' }}>
                  REAL-TIME SSE EVENT INGRESS
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: isConnected ? T.emerald : T.crimson,
                  }} className={isConnected ? 'pulse-glow' : ''} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: isConnected ? T.emerald : T.crimson }}>
                    {isConnected ? 'LISTENING' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* Log Table */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {events.length === 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '80px', gap: '6px',
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.border }} className="pulse-glow" />
                    <span style={{ fontSize: '11px', color: T.inkSec, fontFamily: '"JetBrains Mono", monospace' }}>
                      LISTENING — Awaiting on-chain events...
                    </span>
                  </div>
                ) : (
                  events.map((evt, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '5px 12px',
                      background: idx % 2 === 0 ? T.panel : T.elevated,
                      borderLeft: `3px solid ${EVT_COLOR[evt.event] ?? T.border}`,
                    }} className="slide-in">
                      {/* Event type chip */}
                      <span style={{
                        flexShrink: 0, fontSize: '9px', fontWeight: 800,
                        fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em',
                        color: EVT_COLOR[evt.event] ?? T.inkSec,
                        minWidth: '100px',
                      }}>
                        {evt.event}
                      </span>
                      {/* Summary */}
                      <span style={{
                        flex: 1, fontSize: '10px', color: T.inkSec,
                        fontFamily: '"JetBrains Mono", monospace',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {evt.event === 'TX_INCLUDED' &&
                          `${evt.data.amount ?? ''} ${evt.data.asset_symbol ?? ''} (${evt.data.tx_hash?.slice(0, 10) ?? ''}...)`}
                        {evt.event === 'RISK_EVALUATED' &&
                          `Score: ${evt.data.risk_score ?? ''} | Paths: ${evt.data.paths_detected ?? ''}`}
                        {evt.event === 'GRAPH_UPDATED' &&
                          `${evt.data.tx_hash?.slice(0, 12) ?? ''}...`}
                        {evt.event === 'SURVEILLANCE_ADDED' &&
                          `Added: ${evt.data.address?.slice(0, 14) ?? ''}...`}
                        {evt.event === 'NCRP_COMPLAINT_INGESTED' &&
                          `${evt.data.acknowledgement_no ?? ''} → ${evt.data.reported_wallet?.slice(0, 10) ?? ''}...`}
                      </span>
                      {/* Timestamp */}
                      <span style={{
                        flexShrink: 0, fontSize: '9px', color: T.inkSec,
                        fontFamily: '"JetBrains Mono", monospace',
                      }}>
                        {fmtTime(evt.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Legal Notice Modal ─────────────────────────────────────────────── */}
      <LegalNoticeModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        attribution={riskReport?.vasp_attribution}
        rootAddress={activeRoot}
      />
    </div>
  );
};

// ─── Typology Row Sub-component ───────────────────────────────────────────────
const TypologyRow: React.FC<{
  label: string;
  sublabel: string;
  active: boolean;
  icon: string;
  color: string;
}> = ({ label, sublabel, active, icon, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 10px', borderRadius: '4px',
    background: active ? `${color}14` : T.elevated,
    border: `1px solid ${active ? `${color}55` : T.border}`,
    transition: 'all 0.2s ease',
  }}>
    <span style={{ fontSize: '14px', flexShrink: 0, color: active ? color : T.border }}>
      {icon}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: active ? color : T.inkSec }}>
        {label}
      </div>
      <div style={{ fontSize: '10px', color: T.inkSec, marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {sublabel}
      </div>
    </div>
    {active
      ? <AlertTriangle size={13} color={color} style={{ flexShrink: 0 }} />
      : <ShieldCheck size={13} color={T.border} style={{ flexShrink: 0 }} />
    }
  </div>
);

export default InvestigationDashboard;
