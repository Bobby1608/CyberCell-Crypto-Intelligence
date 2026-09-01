import React, { useState, useEffect, useCallback, useRef } from 'react';
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

import { Search, Plus, Radio, AlertTriangle, ShieldCheck, Activity, RefreshCw, Download, FileText, FileSignature, Building2 } from 'lucide-react';
import { useInvestigationStream } from '../hooks/useInvestigationStream';
import { getLayoutedElements } from '../utils/layout';
import WalletNode from '../components/nodes/WalletNode';
import NCRPModal from '../components/modals/NCRPModal';
import LegalNoticeModal from '../components/modals/LegalNoticeModal';

const nodeTypes = {
  walletNode: WalletNode,
};

export const InvestigationDashboard: React.FC = () => {
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [activeRoot, setActiveRoot] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [surveillanceInput, setSurveillanceInput] = useState<string>('');
  const [showSurveillanceModal, setShowSurveillanceModal] = useState<boolean>(false);
  const [showNCRPModal, setShowNCRPModal] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [isDownloadingDossier, setIsDownloadingDossier] = useState<boolean>(false);
  const [riskReport, setRiskReport] = useState<any>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Dynamic API Base URL depending on port
  const getApiUrl = (endpoint: string) =>
    typeof window !== 'undefined' && window.location.port === '5173'
      ? `http://localhost:8000${endpoint}`
      : endpoint;

  // Fetch initial graph snapshot from REST API
  const fetchGraphSnapshot = useCallback(async (targetAddr: string, crawl: boolean = false) => {
    if (!targetAddr) return;
    if (crawl) setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/investigation/${targetAddr}?crawl=${crawl}`));
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();

      if (data.riskReport) {
        setRiskReport(data.riskReport);
      }

      const rawNodes: Node[] = (data.graph?.nodes || []).map((n: any) => ({
        id: n.id.toLowerCase(),
        type: 'walletNode',
        data: {
          address: n.id.toLowerCase(),
          label: n.label,
          type: n.type,
          is_vasp: n.is_vasp,
          vasp_name: n.vasp_name
        },
        position: { x: 0, y: 0 }
      }));

      const rawEdges: Edge[] = (data.graph?.edges || []).map((e: any, idx: number) => ({
        id: `e-${e.from.toLowerCase()}-${e.to.toLowerCase()}-${e.tx_hash || idx}`,
        source: e.from.toLowerCase(),
        target: e.to.toLowerCase(),
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        label: `${e.amount} ${e.asset_symbol}`
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
    fetchTimerRef.current = setTimeout(() => {
      fetchGraphSnapshot(targetAddr, false);
    }, 400);
  }, [fetchGraphSnapshot]);

  // Hook into Real-Time SSE Stream
  const { isConnected, events, latestRiskReport } = useInvestigationStream({
    onTxIncluded: () => {
      if (activeRoot) debouncedFetchSnapshot(activeRoot);
    },
    onGraphUpdated: () => {
      if (activeRoot) debouncedFetchSnapshot(activeRoot);
    },
    onRiskEvaluated: (report) => {
      if (report && report.root_address === activeRoot) {
        setRiskReport(report);
      }
    }
  });

  useEffect(() => {
    if (latestRiskReport && latestRiskReport.root_address === activeRoot) {
      setRiskReport(latestRiskReport);
    }
  }, [latestRiskReport, activeRoot]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchAddress.trim().toLowerCase();
    if (clean) {
      setActiveRoot(clean);
      fetchGraphSnapshot(clean, true);
    }
  };

  const handleAddSurveillance = async () => {
    if (!surveillanceInput.trim()) return;
    try {
      const res = await fetch(getApiUrl('/api/v1/surveillance/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: surveillanceInput.trim() })
      });
      if (res.ok) {
        alert(`Successfully added ${surveillanceInput} to surveillance!`);
        setSurveillanceInput('');
        setShowSurveillanceModal(false);
      }
    } catch (exc) {
      alert(`Failed to add surveillance: ${exc}`);
    }
  };

  const submitNCRP = async (data: any) => {
    try {
      const res = await fetch(getApiUrl('/api/v1/integrations/ncrp/ingest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (res.ok) {
        alert(`Complaint Intaked Successfully! Case ID: ${responseData.case_reference_id}`);
        setShowNCRPModal(false);
        setActiveRoot(data.reported_wallet.toLowerCase());
        fetchGraphSnapshot(data.reported_wallet.toLowerCase(), true);
      } else {
        alert(`Failed: ${responseData.detail}`);
      }
    } catch (e) {
      alert(`Error submitting NCRP complaint: ${e}`);
    }
  };

  const downloadDossier = async () => {
    if (!activeRoot) return;
    setIsDownloadingDossier(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/investigation/${activeRoot}/export-report`));
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
      alert(`Failed to download dossier: ${e}`);
    } finally {
      setIsDownloadingDossier(false);
    }
  };

  // Calculate Risk Gauge styles
  const getRiskGaugeColor = (score: number) => {
    if (score >= 0.7) return { color: '#ef4444', label: 'HIGH RISK', bg: 'rgba(239,68,68,0.2)' };
    if (score >= 0.3) return { color: '#eab308', label: 'MEDIUM RISK', bg: 'rgba(234,179,8,0.2)' };
    return { color: '#22c55e', label: 'LOW RISK', bg: 'rgba(34,197,94,0.2)' };
  };

  const score = riskReport?.risk_score || 0.0;
  const gaugeStyle = getRiskGaugeColor(score);
  const typologies = riskReport?.typologies || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#090d16', color: '#f8fafc', overflow: 'hidden' }}>
      
      {/* --- TOP NAVIGATION BAR --- */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={24} color="#38bdf8" />
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '0.5px', color: '#f8fafc' }}>
            SEPOLIA FORENSICS <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>LIVE</span>
          </h1>
        </div>

        {/* Search Bar & Inspect Trigger */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '6px 14px', borderRadius: '8px', border: '1px solid #334155', width: '520px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Enter Root Suspect Wallet (0x...)"
            style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', width: '100%', fontFamily: 'monospace', fontSize: '13px' }}
          />
          <button type="submit" disabled={loading} style={{ background: loading ? '#475569' : '#0284c7', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {loading && <RefreshCw size={12} className="spin" />}
            {loading ? 'Crawling...' : 'Inspect'}
          </button>
        </form>

        {/* Primary Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowNCRPModal(true)} style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> Report NCRP
          </button>
          
          <button disabled={!activeRoot || isDownloadingDossier} onClick={downloadDossier} style={{ background: activeRoot ? 'rgba(56, 189, 248, 0.15)' : '#1e293b', border: activeRoot ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #334155', color: activeRoot ? '#38bdf8' : '#64748b', padding: '6px 12px', borderRadius: '6px', cursor: activeRoot && !isDownloadingDossier ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isDownloadingDossier ? <RefreshCw size={14} className="spin" /> : <Download size={14} />} 
            LEA Dossier (PDF)
          </button>

          {/* SSE Connection Health Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}` }}>
            <Radio size={12} color={isConnected ? '#22c55e' : '#ef4444'} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: isConnected ? '#4ade80' : '#f87171' }}>
              {isConnected ? 'LIVE MONITOR' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* REACT FLOW CANVAS */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(15, 23, 42, 0.85)', padding: '10px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontSize: '13px', fontWeight: 600, border: '1px solid #334155' }}>
              <RefreshCw size={16} className="spin" /> Crawling Sepolia On-Chain Data & Updating Graph...
            </div>
          )}

          {!activeRoot && !loading && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid #334155', borderRadius: '16px', padding: '32px 48px', textAlign: 'center', maxWidth: '480px' }}>
              <Search size={40} color="#38bdf8" style={{ marginBottom: '16px' }} />
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f8fafc' }}>Forensic Investigation Ready</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                Enter any target Sepolia wallet address (0x...) in the search bar above to crawl transactions, map multi-hop topologies, and evaluate risk scores in real-time.
              </p>
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
            <Background color="#1e293b" gap={16} size={1} />
            <Controls style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} />
            <MiniMap nodeColor="#38bdf8" maskColor="rgba(15, 23, 42, 0.7)" style={{ background: '#0f172a', border: '1px solid #1e293b' }} />
          </ReactFlow>
        </div>

        {/* RIGHT FORENSIC SIDEBAR */}
        <aside style={{ width: '360px', background: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* 1. RISK SCORE GAUGE */}
          <div style={{ padding: '20px', borderBottom: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
              Risk Assessment Report
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', padding: '16px', borderRadius: '12px', border: `1px solid ${gaugeStyle.color}` }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: gaugeStyle.color }}>
                  {score.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: gaugeStyle.color, marginTop: '2px' }}>
                  {gaugeStyle.label}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Max Hop Depth: <strong>{riskReport?.max_hop_depth || 0}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                  Paths Traced: <strong>{riskReport?.paths_detected || 0}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* VASP ATTRIBUTION & ASSET RECOVERY CARD */}
          {riskReport?.vasp_attribution && riskReport.vasp_attribution.is_vasp && (
            <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', background: 'rgba(16, 185, 129, 0.05)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} /> Asset Recovery Target
              </h3>
              
              <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Target VASP</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{riskReport.vasp_attribution.vasp_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Confidence</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px' }}>
                    {(riskReport.vasp_attribution.confidence_score * 100).toFixed(1)}% {riskReport.vasp_attribution.confidence_score === 1 ? '(EXACT MATCH)' : '(SWEEP HEURISTIC)'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowLegalModal(true)}
                  style={{ width: '100%', padding: '8px', background: '#0284c7', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FileSignature size={14} /> Generate Freeze Notice
                </button>
              </div>
            </div>
          )}

          {/* 2. TYPOLOGY BADGES */}
          <div style={{ padding: '20px', borderBottom: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
              Laundering Typologies
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: typologies.rapid_pass_through ? 'rgba(239, 68, 68, 0.15)' : '#1e293b', border: `1px solid ${typologies.rapid_pass_through ? 'rgba(239,68,68,0.4)' : '#334155'}` }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: typologies.rapid_pass_through ? '#fca5a5' : '#94a3b8' }}>Rapid Pass-Through</span>
                {typologies.rapid_pass_through ? <AlertTriangle size={14} color="#ef4444" /> : <ShieldCheck size={14} color="#64748b" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: typologies.peel_chain ? 'rgba(234, 179, 8, 0.15)' : '#1e293b', border: `1px solid ${typologies.peel_chain ? 'rgba(234,179,8,0.4)' : '#334155'}` }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: typologies.peel_chain ? '#fcd34d' : '#94a3b8' }}>Peel Chain</span>
                {typologies.peel_chain ? <AlertTriangle size={14} color="#eab308" /> : <ShieldCheck size={14} color="#64748b" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: typologies.fan_out ? 'rgba(56, 189, 248, 0.15)' : '#1e293b', border: `1px solid ${typologies.fan_out ? 'rgba(56,189,248,0.4)' : '#334155'}` }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: typologies.fan_out ? '#7dd3fc' : '#94a3b8' }}>Fan-Out Dispersion</span>
                {typologies.fan_out ? <AlertTriangle size={14} color="#38bdf8" /> : <ShieldCheck size={14} color="#64748b" />}
              </div>
            </div>
          </div>

          {/* 3. REAL-TIME FORENSIC EVENT FEED */}
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
              Real-Time SSE Event Feed
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {events.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
                  Waiting for incoming on-chain events...
                </div>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '8px', borderLeft: `3px solid ${evt.event === 'TX_INCLUDED' ? '#38bdf8' : evt.event === 'RISK_EVALUATED' ? '#ef4444' : '#22c55e'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
                      <span>{evt.event}</span>
                      <span style={{ color: '#64748b', fontWeight: 400 }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-all' }}>
                      {evt.event === 'TX_INCLUDED' && `${evt.data.amount} ${evt.data.asset_symbol} (${evt.data.tx_hash?.slice(0, 10)}...)`}
                      {evt.event === 'RISK_EVALUATED' && `Score: ${evt.data.risk_score} | Paths: ${evt.data.paths_detected}`}
                      {evt.event === 'SURVEILLANCE_ADDED' && `Added: ${evt.data.address?.slice(0, 12)}...`}
                      {evt.event === 'GRAPH_UPDATED' && `Graph updated: ${evt.data.tx_hash?.slice(0, 10)}...`}
                      {evt.event === 'NCRP_COMPLAINT_INGESTED' && `Complaint ${evt.data.acknowledgement_no} intake for ${evt.data.reported_wallet?.slice(0,8)}...`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <NCRPModal 
        isOpen={showNCRPModal} 
        onClose={() => setShowNCRPModal(false)} 
        onSubmit={submitNCRP} 
        prefilledAddress={activeRoot || searchAddress}
      />
      <LegalNoticeModal 
        isOpen={showLegalModal} 
        onClose={() => setShowLegalModal(false)} 
        attribution={riskReport?.vasp_attribution} 
        rootAddress={activeRoot} 
      />
    </div>
  );
};

export default InvestigationDashboard;
