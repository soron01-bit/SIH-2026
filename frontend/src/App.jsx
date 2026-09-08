import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { AIModelProvider } from './context/AIModelContext';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import TrackingPage from './pages/TrackingPage';
import CycloneDetailsPage from './pages/CycloneDetailsPage';
import AlertsPage from './pages/AlertsPage';

export function App() {
  return (
    <AIModelProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#080c15] text-slate-100 flex flex-col selection:bg-sky-500/20 selection:text-sky-300">
          {/* Main Top Navigation */}
          <Navbar />

          {/* Dynamic Content View */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/cyclones/:id" element={<CycloneDetailsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Calm Meteorological Footer */}
          <Footer />
        </div>
      </BrowserRouter>
    </AIModelProvider>
  );
}

export default App;
