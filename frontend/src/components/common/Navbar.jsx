import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Layers,
  MapPin,
  Bell,
  Menu,
  X,
  Clock,
  Wind,
  Sun,
  Moon,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { useAIModel } from '../../context/AIModelContext';
import { useUserLocation } from '../../context/UserLocationContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [viewMode, setViewMode] = useState('live'); // 'live' | 'replay'

  const { isModelConnected, isDetecting, detectedCyclone } = useAIModel();
  const { location, requestLocation, getProximityToStorm } = useUserLocation();
  const proximity = detectedCyclone ? getProximityToStorm(detectedCyclone) : null;
  const showDetecting = isModelConnected || isDetecting;

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Compass },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tracking', label: 'Tracking', icon: MapPin },
    { to: '/alerts', label: 'Alerts', icon: Bell },
  ];

  const activeCycloneName = detectedCyclone?.name ?? null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-2.5 gap-3">

          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:border-sky-400/50 transition-colors">
                <Wind className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-wider text-slate-900 dark:text-white">
                  CYCLONE<span className="text-sky-600 dark:text-sky-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal -mt-0.5">
                  North Indian Ocean • SIH-2K26
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 shrink-0">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-white font-semibold shadow-2xs border border-sky-200/60 dark:border-slate-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-850'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Center: Active Cyclone Pill */}
          {activeCycloneName && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-800 dark:text-white font-semibold">Cyclone {activeCycloneName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700/60 text-rose-600 dark:text-rose-400">
                  ACTIVE
                </span>
              </div>
            </div>
          )}

          {/* User Location & Proximity Pill */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {location ? (
              <button
                onClick={requestLocation}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 hover:border-sky-500/60 text-xs transition-colors group"
                title={`User Location: ${location.label}. Click to recalibrate GPS.`}
              >
                <MapPin className="w-3 h-3 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">{location.city}</span>
                {proximity && (
                  <>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">{proximity.distanceKm} km</span>
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: proximity.color || '#10b981' }}
                      title={`Risk Level: ${proximity.riskLevel}`}
                    />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={requestLocation}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/60 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors"
              >
                <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Allow Location</span>
              </button>
            )}
          </div>

          {/* Right: View Mode + Clock + Status */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">

            {/* Theme Toggle (Light / Dark) */}
            <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/50 p-0.5 shadow-2xs">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  theme === 'light'
                    ? 'bg-white text-amber-600 shadow-xs ring-1 ring-amber-500/20'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Light mode (Default)"
              >
                <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/30' : ''}`} />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-sky-300 shadow-xs ring-1 ring-sky-500/20'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Dark mode"
              >
                <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-sky-400 fill-sky-400/20' : ''}`} />
                <span>Dark</span>
              </button>
            </div>

            {/* Radar Telemetry Stream Mode */}
            <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/50 p-0.5">
              <button
                onClick={() => setViewMode('live')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  viewMode === 'live'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Live monitoring mode"
              >
                <Radio className="w-3 h-3" />
                <span>Live</span>
              </button>
              <button
                onClick={() => setViewMode('replay')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  viewMode === 'replay'
                    ? 'bg-white text-slate-800 dark:bg-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Historical replay mode"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Replay</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Clock */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">{utcTime}</span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* AI Status */}
            <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              {showDetecting ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI Detecting...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>AI Model: Ready</span>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-850 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0c1220] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{utcTime}</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {showDetecting ? 'AI Detecting...' : 'AI Model: Ready'}
            </span>
          </div>
          {/* Mobile Theme Selector */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Theme:</span>
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                  theme === 'light' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                  theme === 'dark' ? 'bg-slate-800 text-sky-300 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" /> Dark
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
