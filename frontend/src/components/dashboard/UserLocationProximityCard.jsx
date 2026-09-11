import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Compass,
  ChevronDown,
  Building2,
  Radio,
} from 'lucide-react';
import { useUserLocation } from '../../context/UserLocationContext';

export const UserLocationProximityCard = ({ activeCyclone }) => {
  const {
    location,
    permissionState,
    requestLocation,
    setCityManual,
    coastalCities,
    getProximityToStorm,
    error,
  } = useUserLocation();

  const [showCityPicker, setShowCityPicker] = useState(false);

  const proximity = activeCyclone ? getProximityToStorm(activeCyclone) : null;

  // Determine risk colors
  const riskColorMap = {
    CRITICAL: {
      bg: 'bg-rose-950/70 border-rose-600/80 text-rose-300',
      dot: 'bg-rose-500',
      badge: 'bg-rose-600 text-white',
    },
    HIGH: {
      bg: 'bg-orange-950/70 border-orange-600/80 text-orange-300',
      dot: 'bg-orange-500',
      badge: 'bg-orange-600 text-white',
    },
    MODERATE: {
      bg: 'bg-amber-950/70 border-amber-600/80 text-amber-300',
      dot: 'bg-amber-500',
      badge: 'bg-amber-500 text-slate-900',
    },
    SAFE: {
      bg: 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-600 text-white',
    },
    LOW: {
      bg: 'bg-sky-950/60 border-sky-600/70 text-sky-300',
      dot: 'bg-sky-500',
      badge: 'bg-sky-600 text-white',
    },
  };

  const riskStyle = proximity ? riskColorMap[proximity.riskLevel] || riskColorMap.SAFE : riskColorMap.SAFE;

  return (
    <div className="bg-[#0c1220] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Top Banner / Location Status Header */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-[#0e172a] to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                User Location & Proximity Risk Intelligence
              </h2>
              {permissionState === 'granted' ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Live GPS Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-700/60 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Location Verification Needed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hyper-local storm distance, bearing calculations, and IMD coastal zone advisories
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={requestLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Detect current location via browser GPS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${permissionState === 'loading' ? 'animate-spin' : ''}`} />
            <span>Detect My GPS</span>
          </button>

          <button
            onClick={() => setShowCityPicker(!showCityPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Select Coastal City</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showCityPicker ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Optional City Picker Dropdown / Bar */}
      {showCityPicker && (
        <div className="p-3 bg-slate-900/90 border-b border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2">
            Quick-Select Coastal Stations (Bay of Bengal & Arabian Sea):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {coastalCities?.map((city) => (
              <button
                key={city.name}
                onClick={() => {
                  setCityManual(city.name);
                  setShowCityPicker(false);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  location?.city === city.name
                    ? 'bg-sky-600 text-white font-bold shadow'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
              >
                {city.name} ({city.state.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Location Content Body */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left: User Detected Coordinates */}
        <div className="md:col-span-4 bg-slate-900/50 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Your Current Station</span>
            <span className="font-mono text-[10px] text-sky-400">
              {location?.isDefault ? 'Fallback Station' : location?.isManual ? 'Manual Station' : 'GPS Device'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tracking-tight">
              {location?.city || 'Detecting Location...'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {location?.state}
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Latitude:</span>
              <span className="text-slate-200">{location?.latitude != null ? `${location.latitude}°N` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Longitude:</span>
              <span className="text-slate-200">{location?.longitude != null ? `${location.longitude}°E` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <span className="text-emerald-400">±{location?.accuracy || 15}m</span>
            </div>
          </div>
        </div>

        {/* Center: Distance & Bearing to Active Cyclone */}
        <div className="md:col-span-4 bg-slate-900/50 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Proximity to {activeCyclone?.name || 'Active Storm'}</span>
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
          </div>

          {proximity ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {proximity.distanceKm}
                </span>
                <span className="text-sm font-semibold text-slate-300">km</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950/70 border border-sky-700/60 text-sky-300 font-bold ml-auto font-mono">
                  Bearing: {proximity.bearingFromUser}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span>Storm eye located {proximity.distanceKm} km {proximity.bearingFromUser} of your position</span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-xs text-slate-400">
              No active storm coordinates to measure against.
            </div>
          )}
        </div>

        {/* Right: Localized Hazard Level & Advisory */}
        <div className={`md:col-span-4 border rounded-lg p-3.5 space-y-2 ${riskStyle.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${riskStyle.dot} animate-ping`} />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                Localized Impact Rating
              </span>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${riskStyle.badge}`}>
              {proximity?.riskLevel || 'SAFE'}
            </span>
          </div>

          <p className="text-xs font-medium leading-relaxed">
            {proximity?.advisory || 'Normal coastal weather conditions. No cyclonic threat detected.'}
          </p>

          <div className="text-[10px] opacity-80 pt-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>AI Voice & Text Assistant is synched to your station coordinates.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLocationProximityCard;
