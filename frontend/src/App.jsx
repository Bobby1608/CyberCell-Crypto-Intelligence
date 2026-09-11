import React, { useEffect, useState } from 'react';
import { InvestigationDashboard } from './pages/InvestigationDashboard';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openPlatform = () => {
    window.history.pushState({}, '', '/app');
    setPath('/app');
    window.scrollTo(0, 0);
  };

  if (path.startsWith('/app')) {
    return <InvestigationDashboard />;
  }

  return <LandingPage onTryPlatform={openPlatform} />;
}