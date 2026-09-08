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
} from 'lucide-react';
import { useAIModel } from '../../context/AIModelContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');

  const { isModelConnected, isDetecting } = useAIModel();
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
    { to: '/analysis', label: 'AI Analysis', icon: Layers },
    { to: '/tracking', label: 'Tracking', icon: MapPin },
    { to: '/alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-2.5">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 group-hover:border-sky-400/50 transition-colors">
                <Wind className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-wider text-white">
                  CYCLONE<span className="text-sky-400">X</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal -mt-0.5">
                  Cyclone Monitoring & Prediction
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
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
                        ? 'bg-slate-800 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* System Status & Clock */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300 font-medium">{utcTime}</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Simple status indicator - not a futuristic HUD */}
            <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              {showDetecting ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AI Detecting...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
        </div>
      )}
    </header>
  );
};

export default Navbar;
