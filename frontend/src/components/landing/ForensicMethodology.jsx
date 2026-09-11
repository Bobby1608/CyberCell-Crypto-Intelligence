import React from 'react';

export default function ForensicMethodology() {
  return (
    <div className="space-y-12">
      <div className="max-w-3xl space-y-3">
        <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">SCIENTIFIC FOUNDATION // CAUSAL PROOFS</div>
        <h2 className="text-3xl font-medium tracking-tight text-white">Forensic Rigor & Admissibility</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Why traditional commercial crypto tools fail in court: black-box heuristic algorithms generate hallucinations that cannot withstand legal cross-examination. CyberCell is founded on deterministic causal graph theory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Math Rule 1 */}
        <div className="p-6 rounded-lg bg-[#0B111E] border border-white/[0.08] space-y-4">
          <div className="flex items-center space-x-2 text-slate-200">
            <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs">1</span>
            <h3 className="text-base font-medium">Temporal Monotonicity Invariant</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            In common crypto analytics, automated graph traversals often commit causal inversion—tracing funds from a wallet that received victim funds <span className="text-red-400 font-mono">after</span> sending a payment. CyberCell guarantees that every edge conforms to monotonic block timestamps:
          </p>
          <div className="p-4 rounded bg-[#070B12] border border-white/[0.06] font-mono text-xs text-slate-300 space-y-1">
            <div className="text-slate-500">// Formal Invariant Definition</div>
            <div>∀ e(u, v) ∈ P : timestamp(e_k+1) ≥ timestamp(e_k) + Δt_block</div>
            <div className="text-emerald-400">// Inadmissible if time reversal detected</div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Result: 100% causal certainty that the funds arriving at an exchange hot wallet were directly downstream from the reported cyber-heist.
          </p>
        </div>

        {/* Math Rule 2 */}
        <div className="p-6 rounded-lg bg-[#0B111E] border border-white/[0.08] space-y-4">
          <div className="flex items-center space-x-2 text-slate-200">
            <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs">2</span>
            <h3 className="text-base font-medium">Peel-Chain & Mixer De-Anonymization</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sybil wash-trading and cyclical tumbler mixers attempt to exhaust analyst memory buffers. CyberCell computes canonical state invariants to isolate change outputs from destination transfers:
          </p>
          <div className="p-4 rounded bg-[#070B12] border border-white/[0.06] font-mono text-xs text-slate-300 space-y-1">
            <div className="text-slate-500">// Peel Ratio Threshold Heuristic</div>
            <div>R_peel = Value(Change_Tx) / Value(Parent_Inflow)</div>
            <div>if R_peel &gt; 0.85 ∧ FanOut == 2 : Tag(Node, "Mule_Intermediary")</div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cycles are pruned instantly via topological cycle detection, isolating the high-value exit node terminating at Indian FIU-registered reporting entities.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-[#0B111E] overflow-hidden">
        <div className="p-4 px-6 border-b border-white/[0.06] bg-[#080D17]">
          <h3 className="text-xs font-mono font-medium text-white tracking-wider uppercase">Comparative Admissibility & Sovereign Evaluation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#070B12] text-slate-400 border-b border-white/[0.06] text-[11px]">
              <tr>
                <th className="px-6 py-3 font-medium">FORENSIC VECTOR</th>
                <th className="px-6 py-3 font-medium">COMMERCIAL FOREIGN TOOLS</th>
                <th className="px-6 py-3 font-medium text-white">CYBERCELL SOVEREIGN PIPELINE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              <tr>
                <td className="px-6 py-3.5 text-slate-400">Judicial Notice Compliance</td>
                <td className="px-6 py-3.5 text-slate-500">Generic export; requires manual police drafting</td>
                <td className="px-6 py-3.5 text-emerald-400 font-medium">Instant Section 94 BNSS Requisition PDF</td>
              </tr>
              <tr>
                <td className="px-6 py-3.5 text-slate-400">Evidence Certification</td>
                <td className="px-6 py-3.5 text-slate-500">Proprietary score; uncertified</td>
                <td className="px-6 py-3.5 text-emerald-400 font-medium">Section 63 BSA Cryptographic Certificate</td>
              </tr>
              <tr>
                <td className="px-6 py-3.5 text-slate-400">Data Sovereignty</td>
                <td className="px-6 py-3.5 text-slate-500">LEA case queries transmitted to foreign cloud</td>
                <td className="px-6 py-3.5 text-white font-medium">100% On-Premises Sovereign Hardware</td>
              </tr>
              <tr>
                <td className="px-6 py-3.5 text-slate-400">Licensing Model</td>
                <td className="px-6 py-3.5 text-slate-500">Per-seat USD recurring subscription (&gt; ₹40L/seat)</td>
                <td className="px-6 py-3.5 text-white font-medium">District-wide Sovereign CapEx + AMC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
