import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0B192C] border-t border-[#334155]/50 py-12 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-white" />
            <span className="font-bold text-lg tracking-wide text-white">CyberCell</span>
          </Link>
          <p className="text-sm text-slate-400 max-w-xs">
            Automated crypto-fraud attribution and intelligence platform. Designed for district-level cyber cells.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-white font-medium mb-1">Platform</span>
            <Link to="/products" className="text-sm text-slate-400 hover:text-white transition-colors">Architecture</Link>
            <Link to="/research" className="text-sm text-slate-400 hover:text-white transition-colors">Research</Link>
            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-white font-medium mb-1">Company</span>
            <Link to="/business" className="text-sm text-slate-400 hover:text-white transition-colors">Strategy</Link>
            <Link to="/business" className="text-sm text-slate-400 hover:text-white transition-colors">Deployment Model</Link>
          </div>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#334155]/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} CyberCell Crypto Intelligence. Audited strategy — SIH26183.
        </p>
      </div>
    </footer>
  );
}
