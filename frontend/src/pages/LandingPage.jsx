import React, { useState } from 'react';
import PageTransition from '../components/PageTransition';

import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeatureGrid from '../components/landing/FeatureGrid';
import ArchitectureBenchmarks from '../components/landing/ArchitectureBenchmarks';
import ForensicMethodology from '../components/landing/ForensicMethodology';
import StatutoryCompliance from '../components/landing/StatutoryCompliance';
import DeploymentModels from '../components/landing/DeploymentModels';
import LiveCanvas from '../components/landing/LiveCanvas';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#070B12] text-slate-300 font-sans antialiased selection:bg-slate-700 selection:text-white">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="pt-28 pb-24 max-w-7xl mx-auto px-6">
          {activeTab === 'Overview' && (
            <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <HeroSection setActiveTab={setActiveTab} />
              <FeatureGrid />
              <LiveCanvas />
            </div>
          )}

          {activeTab === 'Architecture' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ArchitectureBenchmarks />
            </div>
          )}

          {activeTab === 'ForensicMethodology' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ForensicMethodology />
            </div>
          )}

          {activeTab === 'StatutoryCompliance' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <StatutoryCompliance />
            </div>
          )}

          {activeTab === 'BusinessDeployment' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DeploymentModels />
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
