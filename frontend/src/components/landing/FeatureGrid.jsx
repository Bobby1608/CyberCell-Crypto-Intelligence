import React from 'react';

export default function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 rounded-lg bg-[#0B111E] border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition">
        <div className="space-y-3">
          <div className="w-8 h-8 rounded border border-white/10 bg-[#0F172A] flex items-center justify-center text-slate-300 font-mono text-xs">
            01
          </div>
          <h3 className="text-base font-medium text-white tracking-tight">Directed Causal Graph Engine</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Consumes real-time block transactions into a temporal graph. Strictly enforces that subsequent hops must have occurred after funds were deposited, eliminating time-impossible reverse paths.
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>ALGORITHM</span>
          <span className="text-slate-300">O(V + E) Monotonic BFS</span>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-[#0B111E] border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition">
        <div className="space-y-3">
          <div className="w-8 h-8 rounded border border-white/10 bg-[#0F172A] flex items-center justify-center text-slate-300 font-mono text-xs">
            02
          </div>
          <h3 className="text-base font-medium text-white tracking-tight">Deterministic Typology Detection</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Algorithmic classification of rapid pass-through transit (Δt ≤ 180s), peel chains (ratio &gt; 0.85), and fan-out dispersion matrices without non-deterministic generative models.
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>HEURISTICS</span>
          <span className="text-slate-300">Peel / Fan / Transit Matrix</span>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-[#0B111E] border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition">
        <div className="space-y-3">
          <div className="w-8 h-8 rounded border border-white/10 bg-[#0F172A] flex items-center justify-center text-slate-300 font-mono text-xs">
            03
          </div>
          <h3 className="text-base font-medium text-white tracking-tight">Judicial & Regulatory Compliance</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Direct generation of Section 94 BNSS freezing mandates and Section 63 BSA electronic evidence certificates with computed SHA-256 state hashes ready for magistrate submission.
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>LEGAL ADMISSIBILITY</span>
          <span className="text-slate-300">Sec 63 BSA Verified Hash</span>
        </div>
      </div>
    </div>
  );
}
