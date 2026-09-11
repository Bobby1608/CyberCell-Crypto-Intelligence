import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Terminal, ArrowUpRight, Building2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const tabs = [
    { id: 'Overview', label: '01 Overview' },
    { id: 'Architecture', label: '02 Architecture' },
    { id: 'ForensicMethodology', label: '03 Forensic Methodology' },
    { id: 'StatutoryCompliance', label: '04 Statutory Compliance' },
    { id: 'BusinessDeployment', label: '05 Business & Deployment' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#070B12]/85 backdrop-blur-xl border-b border-white/[0.07]">
      {/* Top Sovereign Agency Line */}
      <div className="border-b border-white/[0.04] bg-[#05080E] py-1.5 px-6 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
              MHA • I4C DIVISION
            </span>
            <span className="text-slate-500">//</span>
            <span className="text-slate-400">STATE CYBER CRIME INVESTIGATION WING DIRECTIVE COMPLIANT</span>
          </div>
          <div className="flex items-center space-x-4 text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Sepolia Telemetry: Active</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Neo4j Causal Graph: In-Sync</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Sec 94 BNSS / 63 BSA Certified</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Sovereign Brand Identity */}
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center space-x-2.5 text-left group focus:outline-none" 
            onClick={() => setActiveTab('Overview')}
          >
            <div className="w-8 h-8 rounded bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-200 group-hover:border-white/25 transition">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-[15px] tracking-tight text-white group-hover:text-slate-200">CyberCell</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono text-slate-400 bg-white/[0.05] border border-white/10">v2.4 LEA</span>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase -mt-0.5">Sovereign Forensics</div>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 font-mono text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-3 py-1.5 rounded hover:text-white border border-transparent transition ${
                activeTab === tab.id ? 'active-nav-tab' : 'text-slate-400'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <button
            className="px-3 py-1.5 rounded text-slate-400 hover:text-white border border-transparent transition"
            onClick={() => navigate('/dashboard')}
          >
            06 Live Station
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded border border-white/[0.08] bg-[#0B111E] text-slate-400 hover:text-slate-200 hover:border-white/20 transition" title="Inspect Local Engine Telemetry">
            <Terminal className="w-4 h-4" />
          </button>
          <button 
            className="px-4 py-2 rounded text-xs font-mono font-medium tracking-wide bg-white text-[#070B12] hover:bg-slate-200 active:scale-[0.98] transition flex items-center space-x-1.5 shadow-[0_1px_8px_rgba(255,255,255,0.1)]" 
            onClick={() => navigate('/dashboard')}
          >
            <span>Launch Forensic Workstation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
