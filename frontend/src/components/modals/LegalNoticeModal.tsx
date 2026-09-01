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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', width: '600px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSignature size={20} color="#eab308" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>Draft Section 94 BNSS Notice</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="#ef4444" style={{ marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#fca5a5', fontSize: '13px' }}>Legally Binding Directive</h4>
              <p style={{ margin: 0, color: '#f87171', fontSize: '12px', lineHeight: '1.5' }}>
                Executing this action will formally transmit a freeze directive to the registered Nodal Officer of <strong>{attribution.vasp_name}</strong>.
              </p>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>Generated Notice Draft</label>
          <textarea 
            readOnly 
            value={draftText} 
            style={{ width: '100%', height: '220px', boxSizing: 'border-box', background: '#090d16', border: '1px solid #334155', padding: '12px', borderRadius: '6px', color: '#cbd5e1', fontSize: '13px', fontFamily: 'monospace', outline: 'none', resize: 'none' }} 
          />

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
            <button type="button" onClick={handleSend} style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Transmit Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalNoticeModal;
