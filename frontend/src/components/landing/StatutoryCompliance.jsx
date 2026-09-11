import React from 'react';
import { Gavel, Verified, Download } from 'lucide-react';

export default function StatutoryCompliance() {
  return (
    <div className="space-y-12">
      <div className="max-w-3xl space-y-3">
        <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">CRIMINAL LAW INTEGRATION // BHARATIYA NYAYA SANHITA</div>
        <h2 className="text-3xl font-medium tracking-tight text-white">Statutory Enforcement Framework</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          CyberCell bridges raw cryptographic ledger data directly with Indian procedural criminal laws, converting graph insights into legally enforceable freeze mandates under Section 94 BNSS and Section 63 BSA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Legal Explanation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-lg bg-[#0B111E] border border-white/[0.08] space-y-3">
            <h3 className="text-sm font-mono font-medium text-white flex items-center space-x-2">
              <Gavel className="w-5 h-5 text-amber-400" />
              <span>Section 94 BNSS, 2023</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowers the Officer-in-Charge of a Cyber Police Station to summon or requisition any document, digital asset record, or transactional log deemed necessary for criminal investigation.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-[#070B12] p-2.5 rounded border border-white/[0.05]">
              Target: Indian FIU-Registered VASPs (Binance, CoinDCX, WazirX, Mudrex)
            </div>
          </div>

          <div className="p-5 rounded-lg bg-[#0B111E] border border-white/[0.08] space-y-3">
            <h3 className="text-sm font-mono font-medium text-white flex items-center space-x-2">
              <Verified className="w-5 h-5 text-emerald-400" />
              <span>Section 63 BSA, 2023</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides the formal certificate for electronic evidence admissibility. CyberCell automatically computes the SHA-256 digital fingerprint of the block JSON payload and graph path.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-[#070B12] p-2.5 rounded border border-white/[0.05]">
              Output: Court-admissible sworn certificate with timestamped consensus hash
            </div>
          </div>

          <button className="w-full py-2.5 rounded bg-white text-[#070B12] text-xs font-mono font-medium hover:bg-slate-200 transition flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Sample Court Dossier (PDF)</span>
          </button>
        </div>

        {/* Right: Real-world Notice Document Preview */}
        <div className="lg:col-span-7 rounded-lg border border-white/[0.1] bg-[#080D17] p-6 shadow-2xl font-mono text-xs text-slate-300 space-y-4">
          <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">OFFICIAL REQUISITION TEMPLATE</div>
              <div className="text-sm font-medium text-white">FORM CC-94 // STATUTORY FREEZE MANDATE</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">URGENT</span>
          </div>

          <div className="bg-[#0B111E] p-4 rounded border border-white/[0.06] space-y-3 leading-relaxed text-[11px]">
            <div className="text-slate-400">
              <strong className="text-white">TO:</strong> Compliance & Nodal Officer, Binance India / FIU Entities<br />
              <strong className="text-white">FROM:</strong> Office of the Deputy Superintendent of Police, Cyber Crime Cell<br />
              <strong className="text-white">REF:</strong> FIR No. 248/2024 u/s 318(4), 319(2) BNS & Sec 66D IT Act
            </div>
            
            <div className="border-t border-white/[0.05] pt-3 text-slate-300 space-y-2">
              <p><strong>SUBJECT: Requisition under Section 94 BNSS, 2023 for Immediate Debit Freeze & KYC Disclosure.</strong></p>
              <p className="text-slate-400">
                You are hereby directed to forthwith place an absolute debit and liquidation freeze on the following identified wallet address and its registered user profile:
              </p>
              <div className="bg-[#070B12] p-2.5 rounded border border-white/[0.08] text-slate-300 space-y-1">
                <div>• Beneficiary Hot Wallet: <span className="text-emerald-400">0xb7274a244c8cf6e65e5c88871c2721c4ed29d386</span></div>
                <div>• Inflow Incident TX: <span className="text-slate-400">0x4ea85cd2785929285729482928...</span></div>
                <div>• Attributed Inflow Volume: <span className="text-white">14.820 ETH equivalent</span></div>
                <div>• Causal Attribution Confidence: <span className="text-emerald-400">100.0% (Exact Hot Wallet Match)</span></div>
                <div>• Evidence Hash (Sec 63 BSA): <span className="text-slate-500">sha256:d8a94e82b714...</span></div>
              </div>
              <p className="text-slate-400 text-[10px]">
                Failure to comply within two (2) hours of receipt renders the entity liable to penal proceedings under Section 223 of Bharatiya Nyaya Sanhita (BNS), 2023.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
            <span>Cryptographically sealed via Sovereign HSM #7701</span>
            <button className="text-white hover:underline flex items-center space-x-1">
              <span>Open editable template modal →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
