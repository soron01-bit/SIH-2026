import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { AIModelProvider } from './context/AIModelContext';
import { UserLocationProvider } from './context/UserLocationContext';
import VoiceTextWidget from './components/ai/VoiceTextWidget';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TrackingPage from './pages/TrackingPage';
import CycloneDetailsPage from './pages/CycloneDetailsPage';
import AlertsPage from './pages/AlertsPage';

import ErrorBoundary from './components/common/ErrorBoundary';

export function App() {
  return (
    <ThemeProvider>
      <AIModelProvider>
        <UserLocationProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-50 dark:bg-[#080c15] text-slate-800 dark:text-slate-100 flex flex-col selection:bg-sky-500/20 selection:text-sky-600 dark:selection:text-sky-300 transition-colors duration-200">
              {/* Main Top Navigation */}
              <Navbar />

              {/* Dynamic Content View */}
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/analysis" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/tracking" element={<TrackingPage />} />
                    <Route path="/cyclones/:id" element={<CycloneDetailsPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </ErrorBoundary>
              </main>

              {/* Calm Meteorological Footer */}
              <Footer />

              {/* Floating AI Voice + Text Assistant (all pages) */}
              <ErrorBoundary fallback={null}>
                <VoiceTextWidget />
              </ErrorBoundary>
            </div>
          </BrowserRouter>
        </UserLocationProvider>
      </AIModelProvider>
    </ThemeProvider>
  );
}

export default App;
