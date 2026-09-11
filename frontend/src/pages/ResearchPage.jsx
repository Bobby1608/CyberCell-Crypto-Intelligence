import React from 'react';
import PageTransition from '../components/PageTransition';
import { Network, Braces, Lock } from 'lucide-react';

export default function ResearchPage() {
  return (
    <PageTransition>
      <div className="w-full min-h-screen pt-32 pb-24 px-6 md:px-12 bg-[#0B192C]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Research & Implementation</h1>
          <p className="text-xl text-slate-400 mb-16 max-w-3xl leading-relaxed">
            Exploring the algorithms and causal analysis driving our automated fraud attribution engine.
          </p>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-8 items-start border-b border-[#334155] pb-12">
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#334155] shrink-0">
                <Network className="w-10 h-10 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">NetworkX Causal Analysis</h3>
                <p className="text-slate-400 leading-relaxed">
                  The <code>temporal_analyzer.py</code> builds a MultiDiGraph and enforces chronological monotonicity (a hop is only valid if its timestamp is ≥ the parent hop's). This is a real, non-trivial correctness property for fund-flow tracing, genuinely implemented.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start border-b border-[#334155] pb-12">
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#334155] shrink-0">
                <Braces className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Idempotent Graph Loading</h3>
                <p className="text-slate-400 leading-relaxed">
                  <code>async_graph_loader.py</code> uses idempotent MERGE Cypher with ON CREATE SET. Unique constraints are placed on <code>Wallet.address</code> and <code>Transaction.tx_hash</code>. This is the correct pattern for re-processing safety.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#334155] shrink-0">
                <Lock className="w-10 h-10 text-saffron-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Section 63 BSA & Evidentiary Generation</h3>
                <p className="text-slate-400 leading-relaxed">
                  The PDF cites the statute in its text. The roadmap includes hashing, digital signature, timestamping authority, and immutable audit trails to support actual admissibility claims in court.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
