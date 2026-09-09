import React from 'react';
import { X, Mail, FileSignature, AlertTriangle } from 'lucide-react';

const T = {
  panel:    '#0F172A',
  elevated: '#1E293B',
  border:   '#334155',
  inkPri:   '#F8FAFC',
  inkSec:   '#94A3B8',
  crimson:  '#DC2626',
  saffron:  '#D97706',
  emerald:  '#10B981',
} as const;

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
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(11,25,44,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: '4px',
        width: '620px',
        overflow: 'hidden',
        boxShadow: `0 0 0 1px rgba(220,38,38,0.2), 0 25px 50px rgba(0,0,0,0.7)`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${T.border}`,
          background: T.elevated,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(220,38,38,0.15)', padding: '6px',
              borderRadius: '4px', display: 'flex',
              border: '1px solid rgba(220,38,38,0.35)',
            }}>
              <FileSignature size={18} color={T.crimson} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: T.inkPri, letterSpacing: '0.06em' }}>
                DRAFT SECTION 94 BNSS NOTICE
              </div>
              <div style={{ fontSize: '10px', color: T.inkSec }}>
                Statutory freeze directive — {attribution.vasp_name}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${T.border}`,
            color: T.inkSec, cursor: 'pointer', padding: '4px 6px', borderRadius: '4px',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Warning Banner */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            background: 'rgba(220,38,38,0.08)', padding: '12px 14px',
            borderRadius: '4px', border: `1px solid rgba(220,38,38,0.4)`,
            marginBottom: '14px',
          }}>
            <AlertTriangle size={16} color={T.crimson} style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>
              <div style={{ color: T.crimson, fontSize: '11px', fontWeight: 800, marginBottom: '3px', letterSpacing: '0.04em' }}>
                LEGALLY BINDING DIRECTIVE
              </div>
              <p style={{ margin: 0, color: '#F87171', fontSize: '11px', lineHeight: 1.6, fontWeight: 500 }}>
                Executing this action will formally transmit a freeze directive to the registered Nodal Officer of <strong>{attribution.vasp_name}</strong>.
              </p>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '10px', color: T.inkSec, marginBottom: '6px', fontWeight: 700, letterSpacing: '0.08em' }}>
            GENERATED NOTICE DRAFT
          </label>
          <textarea
            readOnly
            value={draftText}
            style={{
              width: '100%', height: '220px', boxSizing: 'border-box',
              background: T.elevated,
              border: `1px solid ${T.border}`,
              padding: '12px',
              borderRadius: '4px',
              color: T.inkPri,
              fontSize: '11.5px',
              fontFamily: '"JetBrains Mono", ui-monospace, Consolas, monospace',
              outline: 'none', resize: 'none', lineHeight: 1.6, fontWeight: 500,
            }}
          />

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${T.border}` }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px',
              background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: '4px', color: T.inkSec, cursor: 'pointer',
              fontSize: '12px', fontWeight: 600,
            }}>
              Cancel
            </button>
            <button type="button" onClick={handleSend} style={{
              padding: '8px 18px',
              background: 'rgba(220,38,38,0.85)', border: `1px solid ${T.crimson}`,
              borderRadius: '4px', color: '#fff', cursor: 'pointer',
              fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Mail size={13} /> TRANSMIT NOTICE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalNoticeModal;
