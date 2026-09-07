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

import { Search, Plus, Radio, AlertTriangle, ShieldCheck, Activity, RefreshCw, Download, FileText, FileSignature, Building2, Sun, Moon } from 'lucide-react';
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Toggle theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
        style: { stroke: theme === 'light' ? '#0284c7' : '#38bdf8', strokeWidth: 2.5 },
        label: `${e.amount} ${e.asset_symbol}`,
        labelStyle: { fill: theme === 'light' ? '#0f172a' : '#f8fafc', fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: theme === 'light' ? '#ffffff' : '#1e293b', rx: 4, ry: 4, stroke: theme === 'light' ? '#cbd5e1' : '#334155' }
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges, 'LR');
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      console.error('[Dashboard] Error fetching graph snapshot:', err);
    } finally {
      if (crawl) setLoading(false);
    }
  }, [setNodes, setEdges, theme]);

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
    if (theme === 'light') {
      if (score >= 0.7) return { color: '#dc2626', label: 'HIGH RISK', bg: '#fef2f2', border: '#fca5a5' };
      if (score >= 0.3) return { color: '#d97706', label: 'MEDIUM RISK', bg: '#fffbeb', border: '#fde68a' };
      return { color: '#059669', label: 'LOW RISK', bg: '#ecfdf5', border: '#a7f3d0' };
    } else {
      if (score >= 0.7) return { color: '#ef4444', label: 'HIGH RISK', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' };
      if (score >= 0.3) return { color: '#eab308', label: 'MEDIUM RISK', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)' };
      return { color: '#22c55e', label: 'LOW RISK', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)' };
    }
  };

  const score = riskReport?.risk_score || 0.0;
  const gaugeStyle = getRiskGaugeColor(score);
  const typologies = riskReport?.typologies || {};

  const isLight = theme === 'light';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      background: isLight ? '#f8fafc' : '#090d16',
      color: isLight ? '#0f172a' : '#f8fafc',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      
      {/* --- TOP NAVIGATION BAR --- */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        padding: '12px 24px',
        background: isLight ? '#ffffff' : '#0f172a',
        borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
        boxShadow: isLight ? '0 1px 3px 0 rgba(0, 0, 0, 0.05)' : 'none',
        gap: '20px',
        flexWrap: 'wrap',
        zIndex: 20
      }}>
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{
            background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={22} color={isLight ? '#0284c7' : '#38bdf8'} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', color: isLight ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              SEPOLIA FORENSICS
              <span style={{ fontSize: '11px', background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.2)', color: isLight ? '#0369a1' : '#38bdf8', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                LIVE
              </span>
            </h1>
            <span style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
              On-Chain Crime Tracing & Intelligence Platform
            </span>
          </div>
        </div>

        {/* Search Bar & Inspect Trigger */}
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isLight ? '#f8fafc' : '#1e293b',
          padding: '6px 14px',
          borderRadius: '10px',
          border: `1.5px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          flex: '1 1 320px',
          maxWidth: '460px',
          minWidth: '260px',
          boxShadow: isLight ? 'inset 0 1px 2px rgba(0, 0, 0, 0.03)' : 'none',
          transition: 'all 0.2s ease'
        }}>
          <Search size={16} color={isLight ? '#64748b' : '#94a3b8'} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Enter Root Suspect Wallet Address (0x...)"
            style={{
              background: 'transparent',
              border: 'none',
              color: isLight ? '#0f172a' : '#f8fafc',
              outline: 'none',
              width: '100%',
              fontFamily: 'ui-monospace, Consolas, monospace',
              fontSize: '13px',
              fontWeight: 500
            }}
          />
          <button type="submit" disabled={loading} style={{
            background: loading ? (isLight ? '#94a3b8' : '#475569') : '#0284c7',
            border: 'none',
            color: '#ffffff',
            padding: '7px 16px',
            borderRadius: '7px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            {loading && <RefreshCw size={12} className="spin" />}
            {loading ? 'Crawling...' : 'Inspect'}
          </button>
        </form>

        {/* Primary Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            style={{
              background: isLight ? '#f1f5f9' : '#1e293b',
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              color: isLight ? '#0f172a' : '#f8fafc',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            {isLight ? <Moon size={14} color="#475569" /> : <Sun size={14} color="#fde047" />}
            <span>{isLight ? 'Dark' : 'Light'}</span>
          </button>

          <button onClick={() => setShowNCRPModal(true)} style={{
            background: '#0284c7',
            border: 'none',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            transition: 'all 0.15s ease'
          }}>
            <FileText size={14} /> Report NCRP
          </button>
          
          <button disabled={!activeRoot || isDownloadingDossier} onClick={downloadDossier} style={{
            background: activeRoot ? (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)') : (isLight ? '#f1f5f9' : '#1e293b'),
            border: `1px solid ${activeRoot ? (isLight ? '#7dd3fc' : 'rgba(56, 189, 248, 0.4)') : (isLight ? '#e2e8f0' : '#334155')}`,
            color: activeRoot ? (isLight ? '#0369a1' : '#38bdf8') : (isLight ? '#94a3b8' : '#64748b'),
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: activeRoot && !isDownloadingDossier ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}>
            {isDownloadingDossier ? <RefreshCw size={14} className="spin" /> : <Download size={14} />} 
            LEA Dossier (PDF)
          </button>
        </div>

        {/* SSE Connection Health Pill (Shifted to Far Right Corner) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '20px',
          background: isConnected ? (isLight ? '#ecfdf5' : 'rgba(34, 197, 94, 0.15)') : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
          border: `1px solid ${isConnected ? (isLight ? '#a7f3d0' : 'rgba(34, 197, 94, 0.4)') : (isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.4)')}`,
          flexShrink: 0,
          marginLeft: 'auto'
        }}>
          <Radio size={12} color={isConnected ? (isLight ? '#059669' : '#22c55e') : (isLight ? '#dc2626' : '#ef4444')} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: isConnected ? (isLight ? '#047857' : '#4ade80') : (isLight ? '#b91c1c' : '#f87171') }}>
            {isConnected ? 'LIVE MONITOR' : 'OFFLINE'}
          </span>
        </div>
      </header>


      {/* --- MAIN WORKSPACE --- */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* REACT FLOW CANVAS */}
        <div style={{ flex: 1, height: '100%', position: 'relative', background: isLight ? '#f8fafc' : '#090d16' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 10,
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.9)',
              padding: '12px 20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: isLight ? '#0284c7' : '#38bdf8',
              fontSize: '13px',
              fontWeight: 600,
              border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
              boxShadow: isLight ? '0 10px 15px -3px rgba(0, 0, 0, 0.08)' : 'none'
            }}>
              <RefreshCw size={16} className="spin" /> Crawling Sepolia On-Chain Data & Updating Graph...
            </div>
          )}

          {!activeRoot && !loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
              borderRadius: '16px',
              padding: '36px 48px',
              textAlign: 'center',
              maxWidth: '480px',
              boxShadow: isLight ? '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' : 'none'
            }}>
              <div style={{
                background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.1)',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <Search size={32} color={isLight ? '#0284c7' : '#38bdf8'} />
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
                Forensic Investigation Ready
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: isLight ? '#64748b' : '#94a3b8', lineHeight: '1.6' }}>
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
            <Background color={isLight ? '#cbd5e1' : '#1e293b'} gap={18} size={1} />
            <Controls style={{
              background: isLight ? '#ffffff' : '#0f172a',
              border: `1px solid ${isLight ? '#cbd5e1' : '#1e293b'}`,
              borderRadius: '8px',
              boxShadow: isLight ? '0 4px 6px -1px rgba(0,0,0,0.08)' : 'none',
              color: isLight ? '#0f172a' : '#ffffff'
            }} />
            <MiniMap
              nodeColor={isLight ? '#0284c7' : '#38bdf8'}
              maskColor={isLight ? 'rgba(241, 245, 249, 0.7)' : 'rgba(15, 23, 42, 0.7)'}
              style={{
                background: isLight ? '#ffffff' : '#0f172a',
                border: `1px solid ${isLight ? '#cbd5e1' : '#1e293b'}`,
                borderRadius: '8px'
              }}
            />
          </ReactFlow>
        </div>

        {/* RIGHT FORENSIC SIDEBAR */}
        <aside style={{
          width: '380px',
          background: isLight ? '#ffffff' : '#0f172a',
          borderLeft: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: isLight ? '-4px 0 15px rgba(0, 0, 0, 0.03)' : 'none'
        }}>
          
          {/* 1. RISK SCORE GAUGE */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}` }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: isLight ? '#64748b' : '#94a3b8' }}>
              Risk Assessment Report
            </h3>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: '16px',
              background: gaugeStyle.bg,
              padding: '16px 18px',
              borderRadius: '12px',
              border: `1.5px solid ${gaugeStyle.border}`
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: gaugeStyle.color, lineHeight: 1 }}>
                  {score.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: gaugeStyle.color, marginTop: '6px', letterSpacing: '0.5px' }}>
                  {gaugeStyle.label}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#cbd5e1',
                  background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.7)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(51, 65, 85, 0.8)'}`
                }}>
                  Max Hop Depth: <strong style={{ color: isLight ? '#0f172a' : '#ffffff', fontWeight: 800 }}>{riskReport?.max_hop_depth || 0}</strong>
                </div>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#cbd5e1',
                  background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.7)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(51, 65, 85, 0.8)'}`
                }}>
                  Paths Traced: <strong style={{ color: isLight ? '#0f172a' : '#ffffff', fontWeight: 800 }}>{riskReport?.paths_detected || 0}</strong>
                </div>
              </div>
            </div>
          </div>


          {/* VASP ATTRIBUTION & ASSET RECOVERY CARD */}
          {riskReport?.vasp_attribution && riskReport.vasp_attribution.is_vasp && (
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.05)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: isLight ? '#047857' : '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} /> Asset Recovery Target
              </h3>
              
              <div style={{
                background: isLight ? '#ffffff' : '#1e293b',
                borderRadius: '10px',
                padding: '14px',
                border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.3)'}`,
                boxShadow: isLight ? '0 2px 4px rgba(0,0,0,0.03)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>Target VASP</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>{riskReport.vasp_attribution.vasp_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>Confidence</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', padding: '2px 8px', background: '#ecfdf5', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                    {(riskReport.vasp_attribution.confidence_score * 100).toFixed(1)}% {riskReport.vasp_attribution.confidence_score === 1 ? '(EXACT MATCH)' : '(SWEEP HEURISTIC)'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowLegalModal(true)}
                  style={{ width: '100%', padding: '9px', background: '#0284c7', border: 'none', borderRadius: '7px', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                >
                  <FileSignature size={14} /> Generate Freeze Notice
                </button>
              </div>
            </div>
          )}

          {/* 2. TYPOLOGY BADGES */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}` }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: isLight ? '#64748b' : '#94a3b8' }}>
              Laundering Typologies
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: typologies.rapid_pass_through ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#f8fafc' : '#1e293b'),
                border: `1px solid ${typologies.rapid_pass_through ? (isLight ? '#fca5a5' : 'rgba(239,68,68,0.4)') : (isLight ? '#e2e8f0' : '#334155')}`
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: typologies.rapid_pass_through ? (isLight ? '#dc2626' : '#fca5a5') : (isLight ? '#64748b' : '#94a3b8') }}>
                  Rapid Pass-Through
                </span>
                {typologies.rapid_pass_through ? <AlertTriangle size={15} color="#dc2626" /> : <ShieldCheck size={15} color={isLight ? '#cbd5e1' : '#64748b'} />}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: typologies.peel_chain ? (isLight ? '#fffbeb' : 'rgba(234, 179, 8, 0.15)') : (isLight ? '#f8fafc' : '#1e293b'),
                border: `1px solid ${typologies.peel_chain ? (isLight ? '#fde68a' : 'rgba(234,179,8,0.4)') : (isLight ? '#e2e8f0' : '#334155')}`
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: typologies.peel_chain ? (isLight ? '#d97706' : '#fcd34d') : (isLight ? '#64748b' : '#94a3b8') }}>
                  Peel Chain
                </span>
                {typologies.peel_chain ? <AlertTriangle size={15} color="#d97706" /> : <ShieldCheck size={15} color={isLight ? '#cbd5e1' : '#64748b'} />}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: typologies.fan_out ? (isLight ? '#eff6ff' : 'rgba(56, 189, 248, 0.15)') : (isLight ? '#f8fafc' : '#1e293b'),
                border: `1px solid ${typologies.fan_out ? (isLight ? '#bfdbfe' : 'rgba(56,189,248,0.4)') : (isLight ? '#e2e8f0' : '#334155')}`
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: typologies.fan_out ? (isLight ? '#1d4ed8' : '#7dd3fc') : (isLight ? '#64748b' : '#94a3b8') }}>
                  Fan-Out Dispersion
                </span>
                {typologies.fan_out ? <AlertTriangle size={15} color="#2563eb" /> : <ShieldCheck size={15} color={isLight ? '#cbd5e1' : '#64748b'} />}
              </div>
            </div>
          </div>

          {/* 3. REAL-TIME FORENSIC EVENT FEED */}
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: isLight ? '#64748b' : '#94a3b8' }}>
              Real-Time SSE Event Feed
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {events.length === 0 ? (
                <div style={{ fontSize: '12px', color: isLight ? '#94a3b8' : '#64748b', textAlign: 'center', marginTop: '40px', fontWeight: 500 }}>
                  Waiting for incoming on-chain events...
                </div>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} style={{
                    background: isLight ? '#f8fafc' : '#1e293b',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                    borderLeft: `4px solid ${evt.event === 'TX_INCLUDED' ? '#0284c7' : evt.event === 'RISK_EVALUATED' ? '#dc2626' : '#059669'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: isLight ? '#0f172a' : '#e2e8f0' }}>
                      <span>{evt.event}</span>
                      <span style={{ color: isLight ? '#64748b' : '#94a3b8', fontWeight: 500 }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div style={{ fontSize: '11px', fontFamily: 'ui-monospace, Consolas, monospace', color: isLight ? '#475569' : '#94a3b8', marginTop: '4px', wordBreak: 'break-all', fontWeight: 500 }}>
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

