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

  // Forensic classification badge styling (Light theme primary with high contrast)
  const getBadgeStyle = () => {
    if (nodeData.is_vasp) {
      return {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        text: '#047857',
        handleColor: '#059669',
        label: nodeData.vasp_name ? `HOT WALLET: ${nodeData.vasp_name.toUpperCase()}` : 'VASP DEPOSIT',
        icon: Building2
      };
    }

    switch (nodeType) {
      case 'suspect':
      case 'victim':
        return {
          bg: '#fef2f2',
          border: '#fca5a5',
          text: '#dc2626',
          handleColor: '#ef4444',
          label: 'ROOT SUSPECT',
          icon: ShieldAlert
        };
      case 'exchange':
      case 'defi':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#047857',
          handleColor: '#059669',
          label: nodeType === 'exchange' ? 'VASP DEPOSIT' : 'DEFI POOL',
          icon: Building2
        };
      default:
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          text: '#1d4ed8',
          handleColor: '#2563eb',
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
        width: 248,
        padding: '12px 14px',
        borderRadius: '12px',
        background: '#ffffff',
        border: selected ? '2px solid #0284c7' : `1.5px solid ${style.border}`,
        boxShadow: selected
          ? '0 0 0 3px rgba(2, 132, 199, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          : '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        transition: 'all 0.2s ease-in-out',
        position: 'relative'
      }}
    >
      {/* Input Connection Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: style.handleColor,
          width: 10,
          height: 10,
          border: '2px solid #ffffff',
          boxShadow: '0 0 4px rgba(0,0,0,0.15)'
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
            letterSpacing: '0.3px'
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
              background: nodeData.riskScore === 'HIGH' || nodeData.riskScore === 'CRITICAL' ? '#fef2f2' : '#f1f5f9',
              border: `1px solid ${nodeData.riskScore === 'HIGH' || nodeData.riskScore === 'CRITICAL' ? '#fca5a5' : '#cbd5e1'}`,
              color: nodeData.riskScore === 'HIGH' || nodeData.riskScore === 'CRITICAL' ? '#dc2626' : '#475569'
            }}
          >
            {nodeData.riskScore}
          </span>
        )}
      </div>

      {/* Address & Copy Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
        <span
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlop, Consolas, monospace',
            fontSize: '13px',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.2px'
          }}
          title={address}
        >
          {truncatedAddress}
        </span>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#ecfdf5' : '#f8fafc',
            border: `1px solid ${copied ? '#a7f3d0' : '#e2e8f0'}`,
            color: copied ? '#059669' : '#64748b',
            cursor: 'pointer',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '6px',
            transition: 'all 0.15s ease'
          }}
          title="Copy full address"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>

      {/* Output Connection Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: style.handleColor,
          width: 10,
          height: 10,
          border: '2px solid #ffffff',
          boxShadow: '0 0 4px rgba(0,0,0,0.15)'
        }}
      />
    </div>
  );
};

export default WalletNode;

