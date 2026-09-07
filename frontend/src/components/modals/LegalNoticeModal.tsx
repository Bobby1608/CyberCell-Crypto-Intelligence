import React from 'react';
import { X, Mail, FileSignature, AlertTriangle } from 'lucide-react';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribution: any;
  rootAddress: string;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({ isOpen, onClose, attribution, rootAddress }) => {
  if (!isOpen || !attribution) return null;

  const handleSend = () => {
    alert(`Draft Notice successfully transmitted to ${attribution.nodal_email || 'exchange compliance desk'}.`);
    onClose();
  };

  const draftText = `TO: Compliance Officer / Nodal Authority (${attribution.vasp_name || 'VASP'})
EMAIL: ${attribution.nodal_email || 'compliance@exchange.com'}

SUBJECT: URGENT: Statutory Directive for Account Freeze under Section 94 BNSS 2023 (erstwhile 91 CrPC)

1. You are hereby directed to immediately FREEZE / DEBIT-FREEZE the wallet account associated with the deposit address:
${attribution.attributed_address}

2. This address is forensically linked as the terminal destination of laundered funds originating from suspect wallet ${rootAddress}, reported in active cyber fraud investigations.

3. Preserve and provide full KYC records, login IP audit logs, linked bank accounts, and withdrawal destination trails associated with this account within 24 hours of receipt of this notice.

Failure to comply may result in legal action under the Bharatiya Nyaya Sanhita (BNS) for facilitating the laundering of proceeds of crime.`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      zIndex: 100
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        width: '620px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fef3c7', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <FileSignature size={20} color="#d97706" />
            </div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Draft Section 94 BNSS Notice
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: '#fef2f2',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #fca5a5',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={20} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '13px', fontWeight: 700 }}>Legally Binding Directive</h4>
              <p style={{ margin: 0, color: '#b91c1c', fontSize: '12px', lineHeight: '1.5', fontWeight: 500 }}>
                Executing this action will formally transmit a freeze directive to the registered Nodal Officer of <strong>{attribution.vasp_name}</strong>.
              </p>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '8px', fontWeight: 700 }}>Generated Notice Draft</label>
          <textarea 
            readOnly 
            value={draftText} 
            style={{
              width: '100%',
              height: '220px',
              boxSizing: 'border-box',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '14px',
              borderRadius: '8px',
              color: '#0f172a',
              fontSize: '12.5px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlop, Consolas, monospace',
              outline: 'none',
              resize: 'none',
              lineHeight: '1.5',
              fontWeight: 500
            }} 
          />

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="button" onClick={handleSend} style={{ padding: '9px 20px', background: '#dc2626', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <Mail size={14} /> Transmit Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalNoticeModal;

