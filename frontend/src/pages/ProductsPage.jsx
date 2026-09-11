import React from 'react';
import PageTransition from '../components/PageTransition';

export default function ProductsPage() {
  return (
    <PageTransition>
      <div className="w-full min-h-screen pt-32 pb-24 px-6 md:px-12 bg-[#0B192C]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Architecture & Products</h1>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl">
            A deep dive into the code-verified prototype for automated crypto-fraud attribution.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-[#334155]">
              <h3 className="text-2xl font-semibold text-white mb-4">Victim/Suspect Intake</h3>
              <p className="text-slate-400 mb-4">
                Working <code>POST /api/v1/integrations/ncrp/ingest</code> endpoint that accepts structured complaint payloads, runs baseline attribution, and broadcasts an SSE event. Compatible with NCRP's data shape.
              </p>
            </div>
            
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-[#334155]">
              <h3 className="text-2xl font-semibold text-white mb-4">Blockchain Ingestion</h3>
              <p className="text-slate-400 mb-4">
                <code>watcher.py</code> subscribes to <code>newHeads</code> via AsyncWeb3/WebSocketProvider. Decodes native ETH and ERC-20 Transfer logs to a Pydantic schema. Proven live on Sepolia testnet.
              </p>
            </div>

            <div className="bg-[#0F172A] p-8 rounded-2xl border border-[#334155]">
              <h3 className="text-2xl font-semibold text-white mb-4">Neo4j Graph Construction</h3>
              <p className="text-slate-400 mb-4">
                <code>async_graph_loader.py</code> uses idempotent MERGE Cypher with ON CREATE SET. Bounded multi-hop tracing extracts a sub-graph with specific hop-depths and ensures correct causal paths.
              </p>
            </div>

            <div className="bg-[#0F172A] p-8 rounded-2xl border border-[#334155]">
              <h3 className="text-2xl font-semibold text-white mb-4">Fraud Typology Scoring</h3>
              <p className="text-slate-400 mb-4">
                <code>scoring.py</code> implements deterministic, weighted detection of rapid pass-through, peel-chain, and fan-out patterns. Auditable and rule-based.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-8">Current Capability vs Production</h2>
          <div className="bg-[#0F172A] border border-[#334155] rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#1E293B]">
                <tr>
                  <th className="p-4 text-slate-300 font-medium border-b border-[#334155]">Capability</th>
                  <th className="p-4 text-slate-300 font-medium border-b border-[#334155]">Current Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-400 divide-y divide-[#334155]">
                <tr>
                  <td className="p-4">Chain Support</td>
                  <td className="p-4">Ethereum/EVM, Sepolia testnet only</td>
                </tr>
                <tr>
                  <td className="p-4">Evidentiary Integrity</td>
                  <td className="p-4">Formatted PDF citing statute text (Needs Cryptographic Hash)</td>
                </tr>
                <tr>
                  <td className="p-4">VASP Coverage</td>
                  <td className="p-4">2 verified testnet addresses</td>
                </tr>
                <tr>
                  <td className="p-4">Government Integration</td>
                  <td className="p-4">None live; NCRP-shaped intake endpoint only</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
