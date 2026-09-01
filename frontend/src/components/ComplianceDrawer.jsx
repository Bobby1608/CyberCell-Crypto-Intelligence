import React, { useState } from 'react';

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

export default function ComplianceDrawer({
  isOpen,
  onClose,
  selectedNode,
  caseMetadata,
}) {
  if (!isOpen || !selectedNode) return null;

  const [copiedSection, setCopiedSection] = useState(null);

  const label = selectedNode.data?.label?.toLowerCase() || '';
  const vaspKey = label.includes('binance')
    ? 'binance'
    : label.includes('wazirx')
    ? 'wazirx'
    : label.includes('okx')
    ? 'okx'
    : label.includes('kraken')
    ? 'kraken'
    : null;

  const nodalInfo = vaspKey
    ? VASP_NODAL_DIRECTORY[vaspKey]
    : {
        name: selectedNode.data?.label || 'Unknown VASP',
        desk: 'General Exchange Compliance Desk',
        email: 'legal-compliance@vasp.org',
        portal: 'N/A',
      };

  const caseId = caseMetadata?.caseId || 'SIH-2026-CR-MOCK99';
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

  return (
    <div style={styles.overlay}>
      <div style={styles.drawer}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>LEA STATUTORY ACTION PANEL</div>
            <h2 style={styles.title}>NCRP / SAHYOG Compliance Desk</h2>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.subTitle}>1. Target Exchange & Nodal Officer</div>
          <div style={styles.metaGrid}>
            <div>
              <strong>Entity:</strong> {nodalInfo.name}
            </div>
            <div>
              <strong>Desk:</strong> {nodalInfo.desk}
            </div>
            <div>
              <strong>Target Address:</strong>{' '}
              <code style={styles.code}>{targetWallet}</code>
            </div>
            <div>
              <strong>Liaison Email:</strong> {nodalInfo.email}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.subTitle}>
              2. Section 94 BNSS Requisition Notice
            </div>
            <button
              style={styles.actionBtn}
              onClick={() => copyToClipboard(formalNoticeText, 'notice')}
            >
              {copiedSection === 'notice' ? 'Copied!' : 'Copy Formal Notice'}
            </button>
          </div>
          <pre style={styles.preBlock}>{formalNoticeText}</pre>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.subTitle}>3. SAHYOG Machine-Readable Payload</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={styles.actionBtn}
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(sahyogPayload, null, 2),
                    'payload'
                  )
                }
              >
                {copiedSection === 'payload' ? 'Copied JSON!' : 'Copy JSON'}
              </button>
              <button
                style={{ ...styles.actionBtn, background: '#059669' }}
                onClick={downloadJsonPayload}
              >
                Download .JSON
              </button>
            </div>
          </div>
          <pre style={styles.preBlock}>
            {JSON.stringify(sahyogPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(3, 7, 18, 0.7)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '780px',
    maxWidth: '50vw',
    minWidth: '600px',
    height: '100%',
    background: '#0b1120',
    borderLeft: '1px solid #334155',
    boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
    padding: '32px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '20px',
    marginBottom: '24px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: '#38bdf8',
    marginBottom: '6px',
  },
  title: { margin: 0, fontSize: '22px', fontWeight: '700', textAlign: 'left' },
  closeButton: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  section: {
    marginBottom: '24px',
    background: '#0f172a',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #1e293b',
    textAlign: 'left',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  subTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: '10px',
    textAlign: 'left',
  },
  metaGrid: {
    fontSize: '14px',
    display: 'grid',
    gap: '10px',
    color: '#94a3b8',
    textAlign: 'left',
  },
  code: {
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontSize: '13px',
    wordBreak: 'break-all',
  },
  preBlock: {
    background: '#030712',
    border: '1px solid #1e293b',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#cbd5e1',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '320px',
    overflowY: 'auto',
    margin: 0,
    fontFamily: 'monospace',
    textAlign: 'left',
  },
  actionBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};