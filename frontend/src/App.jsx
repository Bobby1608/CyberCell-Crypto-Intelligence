import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/landing/Navbar';
import Footer from './components/landing/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import BusinessPage from './pages/BusinessPage';
import ResearchPage from './pages/ResearchPage';
import ProductsPage from './pages/ProductsPage';
import { InvestigationDashboard } from './pages/InvestigationDashboard';

export default function App() {
  const location = useLocation();

  // The Dashboard page will be full screen without the public landing navbar/footer
  // For simplicity, we can just hide them if the path is /dashboard
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="flex flex-col min-h-screen bg-[#0B192C] text-slate-50 font-sans overflow-x-hidden">
      {!isDashboard && <Navbar />}
      
      <main className="flex-grow flex flex-col relative w-full h-full">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/dashboard" element={<InvestigationDashboard />} />
          </Routes>
        </AnimatePresence>
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
}