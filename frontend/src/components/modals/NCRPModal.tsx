import React, { useState } from 'react';
import { X, Send, ShieldCheck, AlertCircle } from 'lucide-react';

interface NCRPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  prefilledAddress?: string;
}

export const NCRPModal: React.FC<NCRPModalProps> = ({ isOpen, onClose, onSubmit, prefilledAddress = "" }) => {
  const [formData, setFormData] = useState({
    acknowledgement_no: `2026/NCRP/MH/${Math.floor(100000 + Math.random() * 900000)}`,
    incident_timestamp: Math.floor(Date.now() / 1000),
    crime_category: 'INVESTMENT_SCAM',
    victim_name: '',
    victim_contact: '',
    reported_wallet: prefilledAddress,
    chain: 'sepolia',
    reported_loss_inr: '',
    reported_loss_crypto: '',
    asset_symbol: 'ETH',
    police_station: '',
    district: '',
    state: 'Maharashtra'
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      reported_loss_inr: parseFloat(formData.reported_loss_inr) || 0,
      reported_loss_crypto: parseFloat(formData.reported_loss_crypto) || 0,
    });
  };

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
            <div style={{ background: '#e0f2fe', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <ShieldCheck size={20} color="#0284c7" />
            </div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              NCRP / SAHYOG Complaint Intake
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Victim Name</label>
              <input required name="victim_name" value={formData.victim_name} onChange={handleChange} style={inputStyle} placeholder="E.g. Aarav Sharma" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Contact Number</label>
              <input required name="victim_contact" value={formData.victim_contact} onChange={handleChange} style={inputStyle} placeholder="+91-..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Crime Category</label>
              <select name="crime_category" value={formData.crime_category} onChange={handleChange} style={inputStyle}>
                <option value="INVESTMENT_SCAM">Investment Scam</option>
                <option value="TASK_BASED_FRAUD">Task Based Fraud</option>
                <option value="SEXTORTION">Sextortion</option>
                <option value="RANSOMWARE">Ransomware</option>
                <option value="PHISHING_KEY_THEFT">Phishing / Key Theft</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Reported Wallet Address</label>
              <input required name="reported_wallet" value={formData.reported_wallet} onChange={handleChange} style={inputStyle} placeholder="0x..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Loss Amount (INR)</label>
              <input required type="number" name="reported_loss_inr" value={formData.reported_loss_inr} onChange={handleChange} style={inputStyle} placeholder="500000" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Loss Amount (Crypto)</label>
              <input required type="number" step="0.0001" name="reported_loss_crypto" value={formData.reported_loss_crypto} onChange={handleChange} style={inputStyle} placeholder="0.15" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Police Station</label>
              <input required name="police_station" value={formData.police_station} onChange={handleChange} style={inputStyle} placeholder="BKC Cyber Police Station" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>District</label>
              <input required name="district" value={formData.district} onChange={handleChange} style={inputStyle} placeholder="Mumbai Suburban" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', background: '#e0f2fe', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bae6fd', marginTop: '4px' }}>
             <AlertCircle size={18} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
             <p style={{ margin: 0, fontSize: '12px', color: '#0369a1', lineHeight: '1.5', fontWeight: 500 }}>
               Submitting this form will automatically trigger real-time surveillance and a downstream multi-hop graph crawl on the reported suspect wallet.
             </p>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '9px 20px', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <Send size={14} /> Submit to I4C
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: 700 };
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as 'border-box',
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
  fontWeight: 500
};

export default NCRPModal;

