import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Copy, Check, ShieldAlert, GitCommit, Building2 } from 'lucide-react';

export interface WalletNodeData {
  address: string;
  label?: string;
  type?: 'suspect' | 'intermediary' | 'exchange' | 'defi' | 'victim';
  riskScore?: 'HIGH' | 'MED' | 'LOW' | 'CLEAN' | 'CRITICAL';
  hopCount?: number;
  is_vasp?: boolean;
  vasp_name?: string;
}

export const WalletNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [copied, setCopied] = useState(false);
  const nodeData = data as unknown as WalletNodeData;

  const address = nodeData.address || '0x0000...0000';
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const nodeType = nodeData.type || 'intermediary';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Forensic classification badge colors
  const getBadgeStyle = () => {
    if (nodeData.is_vasp) {
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.6)',
          text: '#6ee7b7',
          glow: '0 0 15px rgba(16, 185, 129, 0.3)',
          label: nodeData.vasp_name ? `HOT WALLET: ${nodeData.vasp_name.toUpperCase()}` : 'VASP DEPOSIT',
          icon: Building2
        };
    }
    
    switch (nodeType) {
      case 'suspect':
      case 'victim':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.6)',
          text: '#fca5a5',
          glow: '0 0 15px rgba(239, 68, 68, 0.4)',
          label: 'ROOT SUSPECT',
          icon: ShieldAlert
        };
      case 'exchange':
      case 'defi':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.6)',
          text: '#6ee7b7',
          glow: '0 0 15px rgba(16, 185, 129, 0.3)',
          label: nodeType === 'exchange' ? 'VASP DEPOSIT' : 'DEFI POOL',
          icon: Building2
        };
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.6)',
          text: '#fcd34d',
          glow: '0 0 12px rgba(245, 158, 11, 0.3)',
          label: nodeData.hopCount ? `HOP ${nodeData.hopCount}` : 'INTERMEDIARY',
          icon: GitCommit
        };
    }
  };

  const style = getBadgeStyle();
  const IconComponent = style.icon;

  return (
    <div
      style={{
        width: 240,
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        border: `1.5px solid ${selected ? '#38bdf8' : style.border}`,
        boxShadow: selected ? '0 0 20px rgba(56, 189, 248, 0.5)' : style.glow,
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'all 0.2s ease-in-out',
        position: 'relative'
      }}
    >
      {/* Input Connection Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: style.text,
          width: 10,
          height: 10,
          border: '2px solid #0f172a'
        }}
      />

      {/* Card Header: Classification Badge & Icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: style.bg,
            border: `1px solid ${style.border}`,
            color: style.text,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}
        >
          <IconComponent size={12} />
          <span>{style.label}</span>
        </div>

        {nodeData.riskScore && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: nodeData.riskScore === 'HIGH' || nodeData.riskScore === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.3)',
              color: nodeData.riskScore === 'HIGH' || nodeData.riskScore === 'CRITICAL' ? '#f87171' : '#cbd5e1'
            }}
          >
            {nodeData.riskScore}
          </span>
        )}
      </div>

      {/* Address & Copy Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span
          style={{
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: '13px',
            fontWeight: 600,
            color: '#e2e8f0'
          }}
          title={address}
        >
          {truncatedAddress}
        </span>

        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#4ade80' : '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            transition: 'color 0.15s ease'
          }}
          title="Copy full address"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Output Connection Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: style.text,
          width: 10,
          height: 10,
          border: '2px solid #0f172a'
        }}
      />
    </div>
  );
};

export default WalletNode;
