import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection({ setActiveTab }) {
  const navigate = useNavigate();

  return (
    <div className="pt-10 pb-6 max-w-4xl mx-auto text-center space-y-8">
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/[0.08] bg-[#0B111E] text-[11px] font-mono tracking-wider text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>ETH-SEPOLIA CONTRACT: <span className="text-slate-200 select-all">0xb1ad40e5...2795a9ff</span></span>
        <span className="text-slate-600">// VERIFIED STATE PROOF</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.12]">
        Automated Crypto-Fraud <br />
        <span className="font-serif italic font-normal text-slate-300">Attribution & Causal Traversal</span>
      </h1>

      <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
        A sovereign, mathematically verifiable forensic pipeline purpose-built for district-level cyber crime cells. Replaces 48 hours of manual block explorer analysis with deterministic temporal graph BFS and instantaneous Section 94 BNSS legal requisitions.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button 
          className="px-6 py-2.5 rounded text-xs font-mono font-medium tracking-wider uppercase bg-white text-[#070B12] hover:bg-slate-200 transition shadow-[0_1px_8px_rgba(255,255,255,0.15)] flex items-center space-x-2"
          onClick={() => navigate('/dashboard')}
        >
          <span>Launch Live Attribution Station</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button 
          className="px-5 py-2.5 rounded text-xs font-mono tracking-wider uppercase bg-[#0F172A] text-slate-300 border border-white/[0.08] hover:border-white/20 transition"
          onClick={() => setActiveTab('Architecture')}
        >
          <span>Explore Architecture (4 Stages)</span>
        </button>
      </div>

      {/* Metric Benchmarks Grid */}
      <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded border border-white/[0.08] overflow-hidden text-left">
        <div className="p-5 bg-[#070B12]">
          <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">Traversal Latency</div>
          <div className="text-2xl font-mono font-medium text-white mt-1">&lt; 55 ms</div>
          <div className="text-[12px] text-slate-500 mt-0.5">Sub-second graph BFS query</div>
        </div>
        <div className="p-5 bg-[#070B12]">
          <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">Causal Monotonicity</div>
          <div className="text-2xl font-mono font-medium text-emerald-400 mt-1">100% Invariant</div>
          <div className="text-[12px] text-slate-500 mt-0.5">Zero temporal inversions</div>
        </div>
        <div className="p-5 bg-[#070B12]">
          <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">Statutory Drafts</div>
          <div className="text-2xl font-mono font-medium text-white mt-1">Sec 94 BNSS</div>
          <div className="text-[12px] text-slate-500 mt-0.5">Sec 63 BSA court certified</div>
        </div>
        <div className="p-5 bg-[#070B12]">
          <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">Target Resolution</div>
          <div className="text-2xl font-mono font-medium text-amber-400 mt-1">FIU-India</div>
          <div className="text-[12px] text-slate-500 mt-0.5">Registered VASP cluster map</div>
        </div>
      </div>
    </div>
  );
}
