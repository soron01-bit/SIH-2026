import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Compass,
  Activity,
  Layers,
  MapPin,
  Bell,
  Menu,
  X,
  Radar,
  Clock,
} from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import { useAIModel } from '../../context/AIModelContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState({
    utc: '',
  });

  const { isModelConnected, isDetecting } = useAIModel();
  const showDetecting = isModelConnected || isDetecting;

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setCurrentTime({
        utc: now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      });
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Compass },
    { to: '/dashboard', label: 'Dashboard', icon: Activity },
    { to: '/analysis', label: 'AI Analysis', icon: Layers },
    { to: '/tracking', label: 'Tracking Map', icon: MapPin },
    { to: '/alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-50 bg-meteor-950/95 backdrop-blur-md border-b border-meteor-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <Radar className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg tracking-wider text-white">
                  CYCLONE<span className="text-cyan-400">X</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  SIH26070
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
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium tracking-wide transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action / Telemetry Status */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300 font-medium">{currentTime.utc}</span>
            </div>

            <div className="h-6 w-px bg-meteor-border" />

            {/* Dynamic Status: When model connects, "READY FOR AI MODEL" disappears and "AI Detecting..." appears */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-meteor-border transition-all">
              {showDetecting ? (
                <StatusIndicator status="active" label="AI Detecting..." pulse={true} />
              ) : (
                <StatusIndicator status="standby" label="READY FOR AI MODEL" />
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-meteor-border bg-meteor-900/95 px-4 pt-2 pb-4 space-y-1 shadow-2xl">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="pt-3 border-t border-meteor-border flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{currentTime.utc}</span>
            {showDetecting ? (
              <StatusIndicator status="active" label="AI Detecting..." pulse={true} />
            ) : (
              <StatusIndicator status="standby" label="READY FOR AI MODEL" />
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
