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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', width: '600px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>NCRP / SAHYOG Complaint Intake</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
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

          <div style={{ display: 'flex', gap: '10px', background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', marginTop: '8px' }}>
             <AlertCircle size={16} color="#38bdf8" style={{ marginTop: '2px' }} />
             <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>Submitting this form will automatically trigger real-time surveillance and a downstream multi-hop graph crawl on the reported suspect wallet.</p>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', border: 'none', borderRadius: '6px', color: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={14} /> Submit to I4C
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as 'border-box', background: '#090d16', border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' };

export default NCRPModal;
