import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Copy, Check, ShieldAlert, GitCommit, Building2, ShieldCheck } from 'lucide-react';
import { formatAddress } from '../../utils/formatters';

// ─── Design Tokens (mirrored from CSS for inline React use) ──────────────────
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

export interface WalletNodeData {
  address:   string;
  label?:    string;
  type?:     'suspect' | 'intermediary' | 'exchange' | 'defi' | 'victim';
  riskScore?: 'HIGH' | 'MED' | 'LOW' | 'CLEAN' | 'CRITICAL';
  hopCount?: number;
  is_vasp?:  boolean;
  isVasp?:   boolean;
  category?: string;
  vasp_name?: string;
  // Extended fields — populated from API graph node data
  balance?:  number | null;
  netFlow?:  number | null;
  txMeta?:   string | null;
}

export const isVaspNode = (data: WalletNodeData): boolean => {
  return !!(
    data.is_vasp ||
    data.isVasp ||
    data.category === 'VASP' ||
    data.type === 'exchange' ||
    data.type === 'defi' ||
    (data.vasp_name && data.vasp_name.trim().length > 0)
  );
};

// ─── Semantic border rules ────────────────────────────────────────────────────
// ROOT_SUSPECT / Victim  → 1.5px solid crimson #DC2626
// INTERMEDIARY           → 1.5px dashed amber #F59E0B
// TERMINAL VASP/EXCHANGE → 1.5px solid emerald #10B981, shadow: 0 0 14px rgba(16,185,129,0.35)

const getBorderStyle = (nodeData: WalletNodeData, selected: boolean): {
  border: string;
  glow: string;
  roleLabel: string;
  roleColor: string;
  handleColor: string;
  icon: React.ElementType;
} => {
  if (selected) {
    return {
      border: `2px solid ${T.cyan}`,
      glow: `0 0 0 3px rgba(6,182,212,0.2), 0 8px 24px rgba(0,0,0,0.5)`,
      roleLabel: '',
      roleColor: T.cyan,
      handleColor: T.cyan,
      icon: ShieldAlert,
    };
  }

  if (isVaspNode(nodeData)) {
    const headerTag = nodeData.type === 'defi' ? 'DEFI POOL' : (nodeData.category === 'VASP' || nodeData.is_vasp || nodeData.isVasp ? 'VASP' : 'EXCHANGE');
    return {
      border: `1.5px solid ${T.emerald}`,
      glow: `0 0 14px rgba(16, 185, 129, 0.35), 0 2px 8px rgba(0,0,0,0.4)`,
      roleLabel: headerTag,
      roleColor: T.emerald,
      handleColor: T.emerald,
      icon: ShieldCheck,
    };
  }

  if (nodeData.type === 'suspect' || nodeData.type === 'victim') {
    return {
      border: `1.5px solid ${T.crimson}`,
      glow: `0 4px 20px rgba(220,38,38,0.15), 0 2px 8px rgba(0,0,0,0.4)`,
      roleLabel: 'ROOT SUSPECT',
      roleColor: T.crimson,
      handleColor: T.crimson,
      icon: ShieldAlert,
    };
  }

  // Default: Intermediary Mule Hop — dashed saffron
  return {
    border: `1.5px dashed ${T.saffron}`,
    glow: `0 4px 16px rgba(217,119,6,0.1), 0 2px 8px rgba(0,0,0,0.4)`,
    roleLabel: nodeData.hopCount != null ? `MULE HOP ${nodeData.hopCount}` : 'INTERMEDIARY',
    roleColor: T.saffron,
    handleColor: T.saffron,
    icon: GitCommit,
  };
};

const getRiskBadgeStyle = (riskScore: string) => {
  switch (riskScore) {
    case 'CRITICAL': return { bg: 'rgba(220,38,38,0.2)', border: 'rgba(220,38,38,0.5)', text: '#DC2626' };
    case 'HIGH':     return { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)', text: '#DC2626' };
    case 'MED':      return { bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.4)', text: '#D97706' };
    case 'LOW':      return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', text: '#10B981' };
    case 'CLEAN':    return { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#64748B' };
    default:         return { bg: 'rgba(51,65,85,0.5)', border: '#334155', text: '#94A3B8' };
  }
};

export const WalletNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [copied, setCopied] = useState(false);
  const nodeData = data as unknown as WalletNodeData;

  const address = nodeData.address || '0x0000...0000';
  const truncatedAddress = formatAddress(address, 6, 4);
  const style = getBorderStyle(nodeData, !!selected);
  const IconComponent = style.icon;
  const riskBadge = nodeData.riskScore ? getRiskBadgeStyle(nodeData.riskScore) : null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasMetrics = nodeData.balance != null || nodeData.netFlow != null || nodeData.txMeta;

  return (
    <div style={{
      width: 220,
      padding: '10px 12px',
      borderRadius: '4px',
      background: T.elevated,
      border: style.border,
      boxShadow: style.glow,
      color: T.inkPri,
      fontFamily: 'Inter, system-ui, sans-serif',
      transition: 'all 0.15s ease-in-out',
      position: 'relative',
    }}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: style.handleColor,
          width: 8, height: 8,
          border: `2px solid ${T.panel}`,
          boxShadow: `0 0 6px ${style.handleColor}80`,
        }}
      />

      {/* Role Badge Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 7px', borderRadius: '4px',
          background: `${style.roleColor}18`,
          border: `1px solid ${style.roleColor}44`,
          color: style.roleColor, fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em',
        }}>
          <IconComponent size={10} />
          <span>{style.roleLabel || nodeData.label || 'NODE'}</span>
        </div>

        {riskBadge && nodeData.riskScore && (
          <span style={{
            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
            background: riskBadge.bg, border: `1px solid ${riskBadge.border}`,
            color: riskBadge.text, letterSpacing: '0.04em',
          }}>
            {nodeData.riskScore}
          </span>
        )}
      </div>

      {/* Entity / Exchange Name if VASP */}
      {(nodeData.vasp_name || (isVaspNode(nodeData) && nodeData.label)) && (
        <div style={{
          fontSize: '11px', fontWeight: 800, color: T.emerald,
          marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {nodeData.vasp_name || nodeData.label}
        </div>
      )}

      {/* Address + Copy */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasMetrics ? '8px' : '0' }}>
        <span
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, Consolas, monospace',
            fontSize: '12px', fontWeight: 700,
            color: T.inkPri, letterSpacing: '-0.2px',
          }}
          title={address}
        >
          {truncatedAddress}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16,185,129,0.12)' : 'transparent',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : T.border}`,
            color: copied ? T.emerald : T.inkSec,
            cursor: 'pointer', padding: '3px 5px',
            display: 'flex', alignItems: 'center',
            borderRadius: '4px', transition: 'all 0.15s ease',
          }}
          title="Copy full address"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>

      {/* Extended Metrics (balance, netFlow, txMeta) — only if API provides them */}
      {hasMetrics && (
        <div style={{
          borderTop: `1px solid ${T.border}`,
          paddingTop: '7px',
          display: 'flex', flexDirection: 'column', gap: '3px',
        }}>
          {nodeData.txMeta && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span style={{ color: T.inkSec }}>Role</span>
              <span style={{ color: T.inkPri, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                {nodeData.txMeta}
              </span>
            </div>
          )}
          {nodeData.balance != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span style={{ color: T.inkSec }}>Bal</span>
              <span style={{ color: T.inkPri, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                {nodeData.balance.toFixed(4)} ETH
              </span>
            </div>
          )}
          {nodeData.netFlow != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span style={{ color: T.inkSec }}>Net Flow</span>
              <span style={{
                fontWeight: 800,
                fontFamily: '"JetBrains Mono", monospace',
                color: nodeData.netFlow < 0 ? T.crimson : T.emerald,
              }}>
                {nodeData.netFlow >= 0 ? '+' : ''}{nodeData.netFlow.toFixed(4)} ETH
              </span>
            </div>
          )}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: style.handleColor,
          width: 8, height: 8,
          border: `2px solid ${T.panel}`,
          boxShadow: `0 0 6px ${style.handleColor}80`,
        }}
      />
    </div>
  );
};

export default WalletNode;
