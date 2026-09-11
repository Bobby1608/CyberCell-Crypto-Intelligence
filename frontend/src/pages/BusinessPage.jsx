import React from 'react';
import PageTransition from '../components/PageTransition';

export default function BusinessPage() {
  return (
    <PageTransition>
      <div className="w-full min-h-screen pt-32 pb-24 px-6 md:px-12 bg-[#0B192C]">
        <div className="max-w-4xl mx-auto prose prose-invert prose-slate prose-headings:text-white prose-a:text-cyan-400">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">CyberCell-Crypto-Intelligence</h1>
          <h2 className="text-xl md:text-2xl font-medium text-slate-400 mb-12 border-b border-[#334155] pb-8">
            Audited Business, Operational & Deployment Strategy — SIH26183
          </h2>

          <p className="italic text-slate-400 border-l-2 border-cyan-500 pl-4 bg-[#0F172A] py-3 px-4 rounded-r-lg mb-10">
            Prepared against direct inspection of the current repository. Every capability below is classified as: <strong>(1) Working & demonstrable</strong>, <strong>(2) Implemented but dependent on external infrastructure</strong>, <strong>(3) Architecturally prepared but not implemented end-to-end</strong>, or <strong>(4) Future roadmap only</strong>.
          </p>

          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-white mb-4">1. Executive Verdict</h3>
            <p>
              CyberCell is a genuinely working, code-verified prototype for automated crypto-fraud attribution on Ethereum/Sepolia — not a slide deck with a demo attached. The ingestion → graph → risk-scoring → VASP-attribution → dossier pipeline is real, tested (8 unit-test files present), and internally consistent end to end. That is the honest, defensible claim.
            </p>
            <p className="mt-4">
              What it is <strong>not</strong>, yet: a production system, a multi-chain platform, a system with cryptographically defensible evidence output, or a system with any live exchange or government-portal integration. The strongest pitch available is: <em>"a working, auditable mechanism proven on testnet, with a scoped and realistic path to production"</em>.
            </p>
          </section>

          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-white mb-4">2. GovTech Value Proposition</h3>
            <p>
              <strong>The workflow CyberCell automates:</strong> Victim reports suspect wallet → investigator traces transactions → intermediary wallets identified → laundering/fraud pattern detected → terminal destination identified → VASP attributed → evidence assembled → investigator reviews and acts.
            </p>
            <p className="mt-4">
              Today, an investigating officer performs most of this manually via block explorers. CyberCell's demonstrated capability compresses the <strong>trace-and-draft</strong> portion of this workflow into a single automated pipeline run.
            </p>
            <ul className="mt-4 list-disc pl-6 text-slate-300">
              <li><strong>Manual block-explorer tracing</strong>: no automation, no reusable evidence, does not scale.</li>
              <li><strong>Foreign commercial platforms</strong>: mature but with enterprise licensing models that are a genuine adoption barrier at the district level.</li>
              <li><strong>CyberCell</strong>: sovereign, auditable, and structurally accessible at district scale.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-white mb-4">3. Production Architecture Roadmap</h3>
            <div className="space-y-6">
              <div>
                <strong className="text-cyan-400 text-lg">A. Multi-chain (Future roadmap)</strong>
                <p>Tron support requires new decoders but reuses the existing graph model. Bitcoin requires a materially different UTXO tracing approach.</p>
              </div>
              <div>
                <strong className="text-cyan-400 text-lg">B. Blockchain infrastructure</strong>
                <p>Multi-provider failover, self-hosted/archive node option, actual retry/backoff implementation.</p>
              </div>
              <div>
                <strong className="text-cyan-400 text-lg">C. Evidentiary integrity</strong>
                <p>Cryptographic hashing of dossier content at generation time, digital signing, and an immutable audit log.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-white mb-4">4. B2G Deployment Model</h3>
            <p>
              <strong>Recommendation: Centralized I4C pilot first</strong>, not state-level or hybrid at launch.
            </p>
            <ul className="mt-4 list-disc pl-6 text-slate-300 space-y-2">
              <li><strong>Phase 1 — Controlled I4C pilot</strong>: core workflow hardened for mainnet, security baseline implemented, and measurable KPIs instrumented.</li>
              <li><strong>Phase 2 — State Cyber Cell expansion</strong>: additional chain support (Tron priority), state-specific integrations.</li>
              <li><strong>Phase 3 — National platform</strong>: federated multi-state deployment, cross-agency intelligence sharing.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-white mb-4">5. Risks and Judge Attack Points</h3>
            <ul className="mt-4 list-disc pl-6 text-slate-300 space-y-4">
              <li>
                <strong>"Is that really Binance's wallet, or one you made up?"</strong> <br/>
                Real, Etherscan-independently-verified address. Demonstrates correct attribution mechanism, not live exchange integration.
              </li>
              <li>
                <strong>"Does this actually send the freeze notice to the exchange?"</strong> <br/>
                No. It drafts it. A human investigator sends it through official channels.
              </li>
              <li>
                <strong>"Is this PDF actually court-admissible evidence?"</strong> <br/>
                Not yet. Lacks hashing, signing, and audit-trail infrastructure. Scoped as a Phase 1 item.
              </li>
            </ul>
          </section>

        </div>
      </div>
    </PageTransition>
  );
}
