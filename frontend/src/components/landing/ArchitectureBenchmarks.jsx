import React from 'react';

export default function ArchitectureBenchmarks() {
  return (
    <div className="space-y-12">
      <div className="max-w-3xl space-y-3">
        <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">TECHNICAL SPECIFICATION // DOC-ARCH-2024</div>
        <h2 className="text-3xl font-medium tracking-tight text-white">System Architecture & Data Pipeline</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          From multi-chain WebSocket RPC ingestion down to automated statutory notice issuance. Fully sovereign, containerized, and auditable architecture built for state cyber cells.
        </p>
      </div>

      <div className="rounded-lg border border-white/[0.1] bg-[#0B111E] overflow-hidden">
        <div className="p-4 px-6 border-b border-white/[0.06] bg-[#080D17] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono font-medium text-white tracking-wider">CYBERCELL MULTI-STAGE FORENSIC BLUEPRINT</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span>STATUS: VERIFIED</span>
            <span className="text-slate-600">|</span>
            <span>SEC OPS V2.1</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-[#070B12] flex items-center justify-center">
          <img 
            alt="CyberCell Technical Forensic System Architecture" 
            className="w-full h-auto rounded border border-white/[0.08] shadow-2xl object-contain max-h-[640px]" 
            src="https://lh3.googleusercontent.com/aida/AEtjO1VLiqMsa2BHCzzspQchXu1JwOITIpP9RYz8xxkZklkVLufMeNLZOdY-JqOtLnR7bYPJhSM36VvlxX8b6JoPQSVPbI5w-W-B2-mhmfA1VM0UEjn7GWZRcadSIwXVXlgnRGXjK2RYfRRyYp34F8v_sikpyWVDR-zFaEbJhqsu3fzUUmowaW0jR789JI9jqqfoxNdMzIamjp0ie3R8qO_mQSQXpCWCA5OkaI5ROzcQ5li6JJD2ZPOeSwXvwn2U" 
          />
        </div>
        
        <div className="p-4 px-6 bg-[#080D17] border-t border-white/[0.06] text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>Figure 1.0: End-to-end data flow: RPC Ingestion → Neo4j → NetworkX Causal Graph → Section 94 Notice Generator</span>
          <span className="text-slate-500">100% On-Premises Air-Gapped Deployable</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        <div className="p-5 rounded border border-white/[0.08] bg-[#0B111E] space-y-2.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">STAGE 01</div>
          <h4 className="text-sm font-medium text-white">RPC Telemetry & Ingestion</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            WebSocket listeners for Ethereum, Tron USDT, and Bitcoin mempool with &lt;15ms latency. Real-time extraction of Transfer event signatures and temporal nonces.
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500">wss:// alchemy_newHeads</div>
        </div>

        <div className="p-5 rounded border border-white/[0.08] bg-[#0B111E] space-y-2.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">STAGE 02</div>
          <h4 className="text-sm font-medium text-white">Neo4j Directed Graph</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Nodes indexed as Address entities; edges store weighted transactions. Enforces strict temporal monotonicity: t(n+1) ≥ t(n).
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500">Cypher B-Tree Indexing</div>
        </div>

        <div className="p-5 rounded border border-white/[0.08] bg-[#0B111E] space-y-2.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">STAGE 03</div>
          <h4 className="text-sm font-medium text-white">NetworkX Causal Engine</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Temporal BFS with heuristic classification for peel chains (ratio &gt; 0.85), rapid transit (Δt ≤ 180s), and fan-out dispersion scoring (0.00 to 1.00).
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500">Max Hop: 6 • Dedup Logic</div>
        </div>

        <div className="p-5 rounded border border-white/[0.08] bg-[#0B111E] space-y-2.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">STAGE 04</div>
          <h4 className="text-sm font-medium text-white">Legal Enforcement</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct mapping against FIU-registered exchange hot wallets. One-click issuance of Section 94 BNSS freeze mandates and Section 63 BSA court evidence dossiers.
          </p>
          <div className="pt-2 text-[10px] font-mono text-slate-500">SHA-256 HSM Signed</div>
        </div>
      </div>
    </div>
  );
}
