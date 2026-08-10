import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Map, List, ItemDetail, Donate } from './pages';
import { Navigation, WelcomeModal, MobileFooter } from './components';
import { Unauthenticated } from 'convex/react';

function AppContent() {
  const location = useLocation();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const isMainView = location.pathname === '/' || location.pathname === '/list' || location.pathname === '/burger-week-2026' || location.pathname === '/burger-week-2026/';
  
  useEffect(() => {
    // Check if user has seen the welcome modal in the last 24 hours
    const lastSeenTimestamp = localStorage.getItem('burger-week-welcome-last-seen');
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (!lastSeenTimestamp || (now - parseInt(lastSeenTimestamp)) >= oneDayInMs) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('burger-week-welcome-last-seen', Date.now().toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className={`flex-1 min-h-0 relative ${isMainView ? 'mobile-footer-padding' : ''}`}>
        <Routes>
          <Route path="/" element={<Map />} />
          <Route path="/list" element={<List />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/donate" element={<Donate />} />
          {/* Catch-all route for unknown paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MobileFooter />
      <Unauthenticated>
        <WelcomeModal 
          isOpen={showWelcomeModal} 
          onClose={handleCloseWelcome}
        />
      </Unauthenticated>
    </div>
  );
}

function App() {
  return (
    <Router basename="/burger-week-2026">
      <AppContent />
    </Router>
  );
}

export default App;
