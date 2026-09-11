import React from 'react';
import { Shield, Check } from 'lucide-react';

export default function DeploymentModels() {
  return (
    <div className="space-y-12">
      <div className="max-w-3xl space-y-3">
        <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">GOVERNMENT PROCUREMENT // SIH26183 ROADMAP</div>
        <h2 className="text-3xl font-medium tracking-tight text-white">Enterprise Business & Deployment Model</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Structured phased deployment blueprint designed for the Ministry of Home Affairs (MHA), Indian Cyber Crime Coordination Centre (I4C), and State Police Departments.
        </p>
      </div>

      <div className="rounded-lg border border-white/[0.1] bg-[#0B111E] overflow-hidden">
        <div className="p-4 px-6 border-b border-white/[0.06] bg-[#080D17] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-xs font-mono font-medium text-white tracking-wider">CYBERCELL: BUILT FOR GOVERNMENT-SCALE DEPLOYMENT</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">INSTITUTIONAL TIER SPECIFICATION</span>
        </div>

        <div className="p-4 sm:p-6 bg-[#070B12] flex items-center justify-center">
          <img 
            alt="CyberCell Enterprise Business and Deployment Model" 
            className="w-full h-auto rounded border border-white/[0.08] shadow-2xl object-contain max-h-[640px]" 
            src="https://lh3.googleusercontent.com/aida/AEtjO1WDkt53JVLN4gCXaxgnUWL_Y_jVhvBDqA_pnlbysZArrACD--sFx8MSfPd9LT9CihMIruUGtXGydP48rvWxt0QYsOfsSb5kyi9G4TR6EF9uAGiBJl1UZ23BKC3zk3z3546DRqpdyn7_011kqfrA8kmDL7L8NLiEmFT_K-hkKMo_esyyH7AW4ORBlo8UpCZYVXRoY6aQILfybj58deiyxIHgS3M025LgGnoFfweqJX143NquhDw9rvnwSX24" 
          />
        </div>
        
        <div className="p-4 px-6 bg-[#080D17] border-t border-white/[0.06] text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>Figure 2.0: Phased B2G rollout: Pilot (I4C/Single Agency) → State (CCTNS/Sahyog) → National (ICJS/FIU Federation)</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1"><Check className="w-4 h-4"/> GeM Portal Procurement Ready</span>
        </div>
      </div>

      <div className="p-5 rounded-lg bg-[#0B111E] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-2 text-white font-medium">
          <Shield className="text-emerald-400 w-5 h-5" />
          <span>SOVEREIGN SECURITY PROMISE:</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-slate-400">
          <span className="flex items-center space-x-1.5"><span className="text-emerald-400">✓</span> <span>No per-seat gating</span></span>
          <span className="flex items-center space-x-1.5"><span className="text-emerald-400">✓</span> <span>Sovereign on-prem hosting</span></span>
          <span className="flex items-center space-x-1.5"><span className="text-emerald-400">✓</span> <span>Transparent AMC</span></span>
          <span className="flex items-center space-x-1.5"><span className="text-emerald-400">✓</span> <span>100% Auditable algorithms</span></span>
        </div>
      </div>
    </div>
  );
}
