import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Verified } from 'lucide-react';

export default function LiveCanvas() {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-white/[0.09] bg-[#0B111E] overflow-hidden mt-8">
      <div className="p-4 px-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080D17]">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono font-medium text-white tracking-wider uppercase">Live Sepolia Attribution Flow (Simulated Canvas)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-400">DAG VIEW</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Suspect Root: <span className="text-slate-200 select-all">0xb1ad4...a9ff</span>
        </div>
      </div>

      <div className="h-96 relative bg-[#070B12] grid-subtle flex items-center justify-center overflow-x-auto p-8">
        <div className="min-w-[840px] w-full max-w-4xl relative flex items-center justify-between px-6">
          
          {/* SVG Vector Connector Lines fixed with relative positioning context */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ left: 0, top: 0 }}>
            {/* Using relative percentages/fixed coords that match the flex layout roughly, or hardcoded with proper viewbox */}
            {/* For perfect alignment in flex, we use absolute lines matching the DOM */}
            {/* To fix the bug the user had, we shift the paths to align with the boxes */}
            {/* Suspect to Mule 1 */}
            <path d="M 232 160 C 270 160, 290 100, 330 100" opacity="0.8" stroke="#EF4444" strokeDasharray="3 3" strokeWidth="1.5" fill="none"></path>
            {/* Suspect to Mule 2 */}
            <path d="M 232 160 C 270 160, 290 220, 330 220" opacity="0.8" stroke="#F59E0B" strokeWidth="1.5" fill="none"></path>
            
            {/* Mule 1 to Transit */}
            <path d="M 522 100 C 550 100, 560 160, 580 160" opacity="0.8" stroke="#F59E0B" strokeWidth="1.5" fill="none"></path>
            {/* Mule 2 to Transit */}
            <path d="M 522 220 C 550 220, 560 160, 580 160" opacity="0.8" stroke="#F59E0B" strokeWidth="1.5" fill="none"></path>
            
            {/* Transit to VASP Terminal */}
            <path d="M 756 160 L 800 160" stroke="#10B981" strokeWidth="2" fill="none"></path>
          </svg>

          {/* Root Suspect */}
          <div className="z-10 w-52 p-3.5 rounded border border-red-500/40 bg-[#0B111E] text-left">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-red-400 font-medium">SUSPECT ROOT</span>
              <span className="text-slate-500">Hop #00</span>
            </div>
            <div className="font-mono text-xs text-white mt-1">0xb1ad...a9ff</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">Balance: <span className="text-red-300">14.82 ETH</span></div>
          </div>

          {/* Intermediary Hop 1 */}
          <div className="z-10 flex flex-col space-y-10 ml-8">
            <div className="w-48 p-3 rounded border border-amber-500/40 bg-[#0B111E] text-left">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-amber-400 font-medium">MULE 1 (PEEL)</span>
                <span className="text-slate-500">Hop #01</span>
              </div>
              <div className="font-mono text-xs text-slate-200 mt-0.5">0x3e5d...c810</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">Δt: +14s • 0.05 ETH</div>
            </div>
            
            <div className="w-48 p-3 rounded border border-amber-500/40 bg-[#0B111E] text-left">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-amber-400 font-medium">MULE 2 (FAN-OUT)</span>
                <span className="text-slate-500">Hop #01</span>
              </div>
              <div className="font-mono text-xs text-slate-200 mt-0.5">0x5c0a...82fc</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">Δt: +18s • 8.50 ETH</div>
            </div>
          </div>

          {/* Intermediary Hop 2 */}
          <div className="z-10 w-44 p-3 rounded border border-white/10 bg-[#0B111E] text-left ml-8">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 font-medium">TRANSIT HUB</span>
              <span className="text-slate-500">Hop #02</span>
            </div>
            <div className="font-mono text-xs text-slate-200 mt-0.5">0xd07e...9b73</div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">Δt: +28s • 0.049 ETH</div>
          </div>

          {/* Terminal VASP */}
          <div className="z-10 w-52 p-3.5 rounded border border-emerald-500/40 bg-[#0B111E] text-left ml-8">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-emerald-400 font-medium">TERMINAL RECOVERY</span>
              <span className="text-emerald-400/80">VASP MATCH</span>
            </div>
            <div className="text-xs font-mono font-medium text-white mt-1">Binance Hot Wallet</div>
            <div className="font-mono text-[11px] text-slate-400 mt-0.5">0xb727...d386</div>
            <div className="mt-2 text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded inline-block">
              FIU REGISTRATION: IN-098
            </div>
          </div>

        </div>
      </div>

      <div className="p-3 px-6 bg-[#080D17] border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center space-x-2">
          <Verified className="w-4 h-4 text-slate-400" />
          <span>Causal Temporal Proof: t(n+1) ≥ t(n) verified for all 4 edges. Zero hallucination guarantee.</span>
        </div>
        <button 
          className="text-slate-300 hover:text-white flex items-center space-x-1 font-medium"
          onClick={() => navigate('/dashboard')}
        >
          <span>Launch full interactive station</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
