import React, { useState } from 'react';

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
};

const VASP_NODAL_DIRECTORY = {
  binance: {
    name: 'Binance Holdings Ltd.',
    desk: 'Binance Law Enforcement Portal (Kodex)',
    email: 'case-response@binance.com',
    portal: 'https://www.binance.com/en/support/law-enforcement',
  },
  wazirx: {
    name: 'Zanmai Labs Pvt Ltd (WazirX)',
    desk: 'Nodal Compliance Officer Desk',
    email: 'nodalofficer@wazirx.com',
    portal: 'https://wazirx.com/law-enforcement',
  },
  okx: {
    name: 'OKX Operations Legal Desk',
    desk: 'OKX Law Enforcement Desk',
    email: 'enforcement@okx.com',
    portal: 'https://www.okx.com',
  },
  kraken: {
    name: 'Payward, Inc. (Kraken)',
    desk: 'Kraken Compliance & Legal Investigations',
    email: 'compliance@kraken.com',
    portal: 'https://www.kraken.com/legal/law-enforcement',
  },
};

export default function ComplianceDrawer({ isOpen, onClose, selectedNode, caseMetadata }) {
  if (!isOpen || !selectedNode) return null;

  const [copiedSection, setCopiedSection] = useState(null);

  const label = selectedNode.data?.label?.toLowerCase() || '';
  const vaspKey = label.includes('binance') ? 'binance'
    : label.includes('wazirx') ? 'wazirx'
    : label.includes('okx') ? 'okx'
    : label.includes('kraken') ? 'kraken'
    : null;

  const nodalInfo = vaspKey
    ? VASP_NODAL_DIRECTORY[vaspKey]
    : {
        name: selectedNode.data?.label || 'Unknown VASP',
        desk: 'General Exchange Compliance Desk',
        email: 'legal-compliance@vasp.org',
        portal: 'N/A',
      };

  const caseId = caseMetadata?.caseId || 'SIH-2026-CR-PENDING';
  const targetWallet = selectedNode.data?.address || selectedNode.id;

  const formalNoticeText = `NOTICE UNDER SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
To: ${nodalInfo.desk} (${nodalInfo.name})
Subject: Urgent Requisition & Asset Freeze Order for Digital Assets Linked to Cyber Crime Case ${caseId}

Sir/Madam,
During the investigation of FIR/Case No. ${caseId}, on-chain tracing analysis has established that proceeds of crime have routed to terminal deposit address:
Destination Wallet: ${targetWallet}
Entity Tag: ${selectedNode.data?.label || 'Exchange Deposit'}

In exercise of powers conferred under Section 94 of BNSS, 2023, you are hereby directed to:
1. Immediately FREEZE/DEBIT-FREEZE the account/wallet associated with ${targetWallet}.
2. Furnish complete KYC details, IP logs, registered email, and banking cashout details of the account holder within 24 hours.

Failure to comply constitutes an offense under relevant sections of the Bharatiya Nyaya Sanhita (BNS), 2023.

Investigating Officer
Cyber Crime Investigation Wing`;

  const sahyogPayload = {
    schema_version: '1.4.0',
    ncrp_reference_id: caseId,
    timestamp: new Date().toISOString(),
    requisition_type: 'SEC_94_BNSS_FREEZE',
    target_entity: {
      vasp_name: nodalInfo.name,
      wallet_address: targetWallet,
      entity_type: selectedNode.data?.type || 'exchange',
      confidence_score: selectedNode.data?.riskScore || caseMetadata?.confidenceScore || 'HIGH',
    },
    trace_origin: caseMetadata?.inputAddress || 'Unknown',
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(type);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadJsonPayload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sahyogPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SAHYOG_${caseId}_${targetWallet.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const s = {
    overlay: {
      position: 'fixed', top: 0, right: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(11,25,44,0.75)', backdropFilter: 'blur(6px)',
      zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
    },
    drawer: {
      width: '780px', maxWidth: '50vw', minWidth: '600px', height: '100%',
      background: T.panel, borderLeft: `1px solid ${T.border}`,
      boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
      padding: '28px', boxSizing: 'border-box',
      overflowY: 'auto', color: T.inkPri,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      borderBottom: `1px solid ${T.border}`, paddingBottom: '18px', marginBottom: '20px',
    },
    badge: {
      fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em',
      color: T.cyan, marginBottom: '5px',
    },
    title: { margin: 0, fontSize: '20px', fontWeight: 800, color: T.inkPri },
    closeButton: {
      background: T.elevated, border: `1px solid ${T.border}`,
      color: T.inkSec, width: '32px', height: '32px',
      borderRadius: '4px', fontSize: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    },
    section: {
      marginBottom: '20px', background: T.elevated,
      padding: '16px', borderRadius: '4px', border: `1px solid ${T.border}`,
    },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    subTitle: { fontSize: '13px', fontWeight: 700, color: T.inkPri, marginBottom: '8px' },
    metaGrid: { fontSize: '12px', display: 'grid', gap: '8px', color: T.inkSec },
    code: {
      color: T.cyan, fontFamily: '"JetBrains Mono", ui-monospace, Consolas, monospace',
      fontSize: '12px', wordBreak: 'break-all', fontWeight: 700,
    },
    preBlock: {
      background: T.panel, border: `1px solid ${T.border}`,
      padding: '14px', borderRadius: '4px',
      fontSize: '12px', lineHeight: 1.6, color: T.inkPri,
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      maxHeight: '300px', overflowY: 'auto', margin: 0,
      fontFamily: '"JetBrains Mono", ui-monospace, Consolas, monospace', fontWeight: 500,
    },
    actionBtn: {
      background: T.cyan, color: T.panel, border: 'none',
      padding: '7px 14px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 800, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '6px',
      letterSpacing: '0.04em',
    },
  };

  return (
    <div style={s.overlay}>
      <div style={s.drawer}>
        <div style={s.header}>
          <div>
            <div style={s.badge}>LEA STATUTORY ACTION PANEL</div>
            <h2 style={s.title}>NCRP / SAHYOG Compliance Desk</h2>
          </div>
          <button onClick={onClose} style={s.closeButton}>✕</button>
        </div>

        <div style={s.section}>
          <div style={s.subTitle}>1. Target Exchange & Nodal Officer</div>
          <div style={s.metaGrid}>
            <div><strong style={{ color: T.inkPri }}>Entity:</strong> {nodalInfo.name}</div>
            <div><strong style={{ color: T.inkPri }}>Desk:</strong> {nodalInfo.desk}</div>
            <div><strong style={{ color: T.inkPri }}>Target Address:</strong>{' '}
              <code style={s.code}>{targetWallet}</code></div>
            <div><strong style={{ color: T.inkPri }}>Liaison Email:</strong> {nodalInfo.email}</div>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionHeader}>
            <div style={s.subTitle}>2. Section 94 BNSS Requisition Notice</div>
            <button style={s.actionBtn} onClick={() => copyToClipboard(formalNoticeText, 'notice')}>
              {copiedSection === 'notice' ? 'COPIED!' : 'COPY NOTICE'}
            </button>
          </div>
          <pre style={s.preBlock}>{formalNoticeText}</pre>
        </div>

        <div style={s.section}>
          <div style={s.sectionHeader}>
            <div style={s.subTitle}>3. SAHYOG Machine-Readable Payload</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={s.actionBtn}
                onClick={() => copyToClipboard(JSON.stringify(sahyogPayload, null, 2), 'payload')}>
                {copiedSection === 'payload' ? 'COPIED!' : 'COPY JSON'}
              </button>
              <button style={{ ...s.actionBtn, background: T.emerald }}
                onClick={downloadJsonPayload}>
                DOWNLOAD .JSON
              </button>
            </div>
          </div>
          <pre style={s.preBlock}>{JSON.stringify(sahyogPayload, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}