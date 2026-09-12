import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IMD_CATEGORIES } from '../../data/mockCyclones';
import {
  Compass,
  Search,
  MapPin,
  X,
  Loader2,
  Navigation,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';

// Calculate distance in km between two coordinates (Haversine formula)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Calculate compass bearing direction (e.g. "NNE", "SE")
function calculateBearing(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return '';
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(brng / 22.5) % 16];
}

// Popular cyclone-prone coastal hubs and cities for instant suggestions
const POPULAR_COASTAL_PLACES = [
  { name: 'Puri', fullAddress: 'Puri Beach, Odisha, India', lat: 19.8135, lon: 85.8312, state: 'Odisha' },
  { name: 'Digha', fullAddress: 'Digha Coastal Belt, West Bengal, India', lat: 21.6266, lon: 87.5074, state: 'West Bengal' },
  { name: 'Paradip', fullAddress: 'Paradip Major Deepwater Port, Odisha, India', lat: 20.3165, lon: 86.6114, state: 'Odisha' },
  { name: 'Kolkata', fullAddress: 'Kolkata, West Bengal, India', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
  { name: 'Bhubaneswar', fullAddress: 'Bhubaneswar, Odisha, India', lat: 20.2961, lon: 85.8245, state: 'Odisha' },
  { name: 'Visakhapatnam', fullAddress: 'Visakhapatnam Coast, Andhra Pradesh, India', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh' },
  { name: 'Gopalpur', fullAddress: 'Gopalpur-on-Sea, Odisha, India', lat: 19.2606, lon: 84.9084, state: 'Odisha' },
  { name: 'Kakinada', fullAddress: 'Kakinada Port, Andhra Pradesh, India', lat: 16.9891, lon: 82.2475, state: 'Andhra Pradesh' },
  { name: 'Chennai', fullAddress: 'Chennai Marina Coast, Tamil Nadu, India', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  { name: 'Machilipatnam', fullAddress: 'Machilipatnam, Andhra Pradesh, India', lat: 16.1875, lon: 81.1389, state: 'Andhra Pradesh' },
  { name: 'Haldia', fullAddress: 'Haldia Industrial Port, West Bengal, India', lat: 22.0621, lon: 88.0664, state: 'West Bengal' },
  { name: 'Balasore', fullAddress: 'Balasore (Baleshwar), Odisha, India', lat: 21.4934, lon: 86.9135, state: 'Odisha' },
  { name: 'Cox\'s Bazar', fullAddress: 'Cox\'s Bazar Coastal Belt, Bangladesh', lat: 21.4272, lon: 92.0058, state: 'Bangladesh' },
  { name: 'Chittagong', fullAddress: 'Chittagong Port City, Bangladesh', lat: 22.3569, lon: 91.7832, state: 'Bangladesh' },
  { name: 'Mumbai', fullAddress: 'Mumbai Coast, Maharashtra, India', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  { name: 'Port Blair', fullAddress: 'Port Blair, South Andaman Island, India', lat: 11.6234, lon: 92.7265, state: 'Andaman & Nicobar' },
];

// Inner Leaflet Controller to animate view to searched place or back to storm center
const MapViewController = ({ targetFlyLocation, defaultCenter, defaultZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (targetFlyLocation && targetFlyLocation.lat != null && targetFlyLocation.lon != null) {
      map.flyTo([targetFlyLocation.lat, targetFlyLocation.lon], targetFlyLocation.zoom || 9, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [targetFlyLocation, map]);

  useEffect(() => {
    if (!targetFlyLocation && defaultCenter && Array.isArray(defaultCenter)) {
      map.setView(defaultCenter, defaultZoom || 5, { animate: true });
    }
  }, [defaultCenter?.[0], defaultCenter?.[1], defaultZoom, targetFlyLocation, map]);

  return null;
};

// Clean, professional SVG marker for cyclone center
const createCycloneCenterIcon = (name, categoryCode) => {
  const category = IMD_CATEGORIES[categoryCode] || IMD_CATEGORIES.CS;
  const color = category.color;

  return L.divIcon({
    className: 'clean-cyclone-center-marker',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 -translate-x-1/2 -translate-y-1/2">
        <span class="absolute w-8 h-8 rounded-full opacity-30 animate-ping" style="background-color: ${color};"></span>
        <div class="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow" style="background-color: #0f172a;">
          <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></div>
        </div>
        <div class="absolute -bottom-4 whitespace-nowrap bg-slate-900 text-white font-sans text-[11px] font-semibold px-1.5 py-0.5 rounded border border-slate-700 shadow-sm">
          ${name}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Clean dot marker for track points
const createTrackPointIcon = (categoryCode, isForecast = false) => {
  const category = IMD_CATEGORIES[categoryCode] || IMD_CATEGORIES.D;
  const color = isForecast ? '#f59e0b' : category.color;

  return L.divIcon({
    className: 'clean-track-point-marker',
    html: `
      <div class="w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
        isForecast ? 'border-amber-400 bg-amber-500' : 'border-white'
      } shadow-sm" style="background-color: ${color};"></div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Custom animated beacon pin for user-searched places
const createSearchLocationIcon = (name) => {
  return L.divIcon({
    className: 'search-location-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-full">
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 rounded-full bg-cyan-400 opacity-40 animate-ping"></span>
          <div class="relative w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border-2 border-white flex items-center justify-center shadow-lg shadow-cyan-500/50">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 21s-7-5.5-7-12a7 7 0 1114 0c0 6.5-7 12-7 12z"></path>
              <circle cx="12" cy="9" r="2.5" fill="white"></circle>
            </svg>
          </div>
        </div>
        <div class="mt-1 whitespace-nowrap bg-slate-900/95 text-cyan-200 font-sans text-[11px] font-bold px-2 py-0.5 rounded border border-cyan-500/50 shadow-md">
          📍 ${name}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export const CycloneMap = ({
  cyclone = null,
  height = '480px',
  interactive = true,
  showCone = true,
  showSearchBar = true,
  className = '',
}) => {
  // Default oceanic center (North Indian Ocean / Bay of Bengal & Arabian Sea)
  const defaultCenter = [16.5, 82.5];
  const currentCenter = cyclone && cyclone.latitude ? [cyclone.latitude, cyclone.longitude] : defaultCenter;
  const zoom = cyclone ? 6 : 5;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState([]);
  const [searchedPlace, setSearchedPlace] = useState(null);
  const [targetFlyLocation, setTargetFlyLocation] = useState(null);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local presets immediately
  const qClean = searchQuery.trim().toLowerCase();
  const localMatches = qClean
    ? POPULAR_COASTAL_PLACES.filter(
        (p) =>
          p.name.toLowerCase().includes(qClean) ||
          p.fullAddress.toLowerCase().includes(qClean) ||
          p.state?.toLowerCase().includes(qClean)
      )
    : POPULAR_COASTAL_PLACES.slice(0, 6);

  // Debounced geocoding via Nominatim OpenStreetMap API
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setDropdownOpen(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!val.trim() || val.trim().length < 2) {
      setGeocodeResults([]);
      setLoadingGeocode(false);
      return;
    }

    setLoadingGeocode(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          val.trim()
        )}&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'CycloneTracker-App/1.0',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setGeocodeResults(data || []);
        }
      } catch (err) {
        console.warn('Geocoding search note:', err);
      } finally {
        setLoadingGeocode(false);
      }
    }, 350);
  };

  // Select a place (from local presets or geocoded results)
  const handleSelectPlace = useCallback((place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    const placeObj = {
      name: place.name || place.display_name?.split(',')[0] || 'Selected Place',
      fullAddress: place.fullAddress || place.display_name || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
      lat,
      lon,
    };

    setSearchedPlace(placeObj);
    setTargetFlyLocation({ lat, lon, zoom: 9 });
    setSearchQuery(placeObj.name);
    setDropdownOpen(false);
  }, []);

  // Clear search and return view to cyclone eye
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchedPlace(null);
    setTargetFlyLocation(null);
    setGeocodeResults([]);
    setDropdownOpen(false);
  }, []);

  // Re-center storm view
  const handleRecenterStorm = useCallback(() => {
    if (cyclone && cyclone.latitude) {
      setTargetFlyLocation({ lat: cyclone.latitude, lon: cyclone.longitude, zoom: 6 });
    } else {
      setTargetFlyLocation({ lat: defaultCenter[0], lon: defaultCenter[1], zoom: 5 });
    }
  }, [cyclone, defaultCenter]);

  // Coordinates array for historical path
  const historicalCoords = cyclone?.historicalTrack?.map((pt) => [pt.latitude, pt.longitude]) || [];
  if (cyclone && historicalCoords.length > 0) {
    historicalCoords.push(currentCenter);
  }

  // Coordinates array for forecast path
  const forecastCoords = cyclone
    ? [currentCenter, ...(cyclone.forecastTrack?.map((pt) => [pt.latitude, pt.longitude]) || [])]
    : [];

  // Metrics for searched place relative to active cyclone
  const distanceToStorm = searchedPlace && cyclone?.latitude
    ? calculateDistanceKm(searchedPlace.lat, searchedPlace.lon, cyclone.latitude, cyclone.longitude)
    : null;

  const bearingToStorm = searchedPlace && cyclone?.latitude
    ? calculateBearing(searchedPlace.lat, searchedPlace.lon, cyclone.latitude, cyclone.longitude)
    : '';

  const riskLevel = distanceToStorm == null
    ? null
    : distanceToStorm <= 150
    ? { text: 'HIGH RISK', color: 'bg-rose-500/20 text-rose-300 border-rose-500/50' }
    : distanceToStorm <= 350
    ? { text: 'MODERATE RISK', color: 'bg-amber-500/20 text-amber-300 border-amber-500/50' }
    : { text: 'MONITORING', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' };

  return (
    <div className={`relative w-full rounded-lg overflow-hidden border border-slate-800 bg-[#080c15] ${className}`} style={{ height }}>
      {/* Top Left: Cyclone Status Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs flex items-center gap-3 font-sans shadow-lg">
        {cyclone ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-white font-semibold">
                {cyclone.name} ({cyclone.classificationCode})
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-mono text-xs">
              {cyclone.latitude.toFixed(1)}°N, {cyclone.longitude.toFixed(1)}°E
            </span>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Sector:</span>
            <span className="text-white font-medium">North Indian Ocean (All Clear)</span>
          </div>
        )}
      </div>

      {/* Top Right: Interactive Map Place Search Bar */}
      {showSearchBar && (
        <div ref={searchContainerRef} className="absolute top-3 right-3 z-[1000] w-64 sm:w-80 md:w-88 max-w-[calc(100%-1rem)]">
          <div className="relative flex items-center rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl transition-all focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/50">
            <div className="pl-3 pr-2 text-sky-400">
              {loadingGeocode ? (
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (localMatches.length > 0) {
                    handleSelectPlace(localMatches[0]);
                  } else if (geocodeResults.length > 0) {
                    const first = geocodeResults[0];
                    handleSelectPlace({
                      name: first.display_name.split(',')[0],
                      fullAddress: first.display_name,
                      lat: first.lat,
                      lon: first.lon,
                    });
                  }
                } else if (e.key === 'Escape') {
                  setDropdownOpen(false);
                }
              }}
              placeholder="Search place, city, coast..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none py-2 pr-2"
              aria-label="Search map location"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1.5 mr-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Preset Chips Row */}
          {!searchedPlace && !dropdownOpen && (
            <div className="mt-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {['Puri', 'Digha', 'Paradip', 'Kolkata', 'Vizag', 'Chennai'].map((placeName) => {
                const item = POPULAR_COASTAL_PLACES.find((p) => p.name === placeName);
                if (!item) return null;
                return (
                  <button
                    key={placeName}
                    type="button"
                    onClick={() => handleSelectPlace(item)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/90 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-700/80 shadow-sm whitespace-nowrap transition-colors"
                  >
                    📍 {placeName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Autocomplete & Results Dropdown */}
          {dropdownOpen && (
            <div className="mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800/80 animate-fadeIn text-xs">
              {/* Local Coastal Hotspots */}
              {localMatches.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                    <span>Coastal Hubs & Cities</span>
                    <span className="text-sky-400 font-normal">Instant Jump</span>
                  </div>
                  {localMatches.map((place) => {
                    const dist = cyclone?.latitude
                      ? calculateDistanceKm(place.lat, place.lon, cyclone.latitude, cyclone.longitude)
                      : null;
                    return (
                      <button
                        key={`${place.name}-${place.lat}`}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="w-full px-2.5 py-1.5 rounded-md text-left hover:bg-sky-600/20 hover:border-sky-500/40 border border-transparent flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="truncate">
                            <span className="text-slate-100 font-medium group-hover:text-sky-200">{place.name}</span>
                            <span className="text-slate-400 text-[11px] ml-1.5 truncate">({place.state})</span>
                          </div>
                        </div>
                        {dist != null && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2 group-hover:text-sky-300">
                            ~{dist} km
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Live Geocoded Global Results */}
              {geocodeResults.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    OpenStreetMap Global Places
                  </div>
                  {geocodeResults.map((item, idx) => {
                    const title = item.display_name.split(',')[0];
                    const subtitle = item.display_name.split(',').slice(1, 3).join(', ');
                    const dist = cyclone?.latitude
                      ? calculateDistanceKm(parseFloat(item.lat), parseFloat(item.lon), cyclone.latitude, cyclone.longitude)
                      : null;
                    return (
                      <button
                        key={`${item.place_id || idx}`}
                        type="button"
                        onClick={() =>
                          handleSelectPlace({
                            name: title,
                            fullAddress: item.display_name,
                            lat: item.lat,
                            lon: item.lon,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-md text-left hover:bg-sky-600/20 hover:border-sky-500/40 border border-transparent flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="truncate">
                            <span className="text-slate-100 font-medium group-hover:text-cyan-200">{title}</span>
                            {subtitle && <span className="text-slate-400 text-[11px] ml-1.5 truncate">{subtitle}</span>}
                          </div>
                        </div>
                        {dist != null && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2 group-hover:text-cyan-300">
                            ~{dist} km
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results notice */}
              {!loadingGeocode && localMatches.length === 0 && geocodeResults.length === 0 && searchQuery && (
                <div className="p-4 text-center text-slate-400 text-xs">
                  <AlertCircle className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  No place found matching &ldquo;{searchQuery}&rdquo;. Try another city name.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating "Recenter Cyclone" Button when user is inspecting a searched place */}
      {searchedPlace && (
        <div className="absolute top-16 right-3 z-[1000] flex items-center gap-2 animate-fadeIn">
          <button
            type="button"
            onClick={handleRecenterStorm}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-500/40 shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all hover:scale-105"
            title="Fly back to the cyclone storm eye"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Recenter {cyclone?.name || 'Cyclone'}</span>
          </button>
        </div>
      )}

      {/* Main Map Container */}
      <MapContainer
        center={currentCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl={false}
        className="h-full w-full"
      >
        <MapViewController
          targetFlyLocation={targetFlyLocation}
          defaultCenter={currentCenter}
          defaultZoom={zoom}
        />

        {/* High-legibility base map */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* Historical Track Line */}
        {historicalCoords.length > 1 && (
          <Polyline
            positions={historicalCoords}
            pathOptions={{
              color: '#38bdf8',
              weight: 2.5,
              opacity: 0.9,
            }}
          />
        )}

        {/* Forecast Track Line */}
        {forecastCoords.length > 1 && (
          <Polyline
            positions={forecastCoords}
            pathOptions={{
              color: '#f59e0b',
              weight: 2,
              dashArray: '5, 5',
              opacity: 0.9,
            }}
          />
        )}

        {/* Distance Line from Searched Place to Cyclone Eye */}
        {searchedPlace && cyclone && cyclone.latitude && (
          <Polyline
            positions={[
              [searchedPlace.lat, searchedPlace.lon],
              [cyclone.latitude, cyclone.longitude],
            ]}
            pathOptions={{
              color: '#06b6d4',
              weight: 2,
              dashArray: '4, 4',
              opacity: 0.8,
            }}
          />
        )}

        {/* Cone of Uncertainty */}
        {showCone &&
          cyclone?.forecastTrack?.map((fc) => (
            <Circle
              key={`cone-${fc.id}`}
              center={[fc.latitude, fc.longitude]}
              radius={(fc.uncertaintyRadiusKm || 50) * 1000}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '3, 3',
              }}
            />
          ))}

        {/* Historical Track Points */}
        {cyclone?.historicalTrack?.map((pt) => (
          <Marker
            key={pt.id}
            position={[pt.latitude, pt.longitude]}
            icon={createTrackPointIcon(pt.categoryCode, false)}
          >
            <Popup>
              <div className="p-1 space-y-1 text-slate-200 text-xs">
                <div className="font-semibold text-sky-400">{pt.classification}</div>
                <div className="text-slate-400 font-mono text-[11px]">{new Date(pt.timestamp).toUTCString()}</div>
                <div>Winds: {pt.windSpeedKnots} kt ({Math.round(pt.windSpeedKnots * 1.852)} km/h)</div>
                <div>Pressure: {pt.pressureHpa} hPa</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Forecast Points */}
        {cyclone?.forecastTrack?.map((fc) => (
          <Marker
            key={fc.id}
            position={[fc.latitude, fc.longitude]}
            icon={createTrackPointIcon('CS', true)}
          >
            <Popup>
              <div className="p-1 space-y-1 text-slate-200 text-xs">
                <div className="font-semibold text-amber-400">Forecast ({fc.forecastHour})</div>
                <div>{fc.classification}</div>
                <div className="text-slate-400 font-mono text-[11px]">{new Date(fc.timestamp).toUTCString()}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Searched Location Marker & Rich Telemetry Popup */}
        {searchedPlace && (
          <Marker
            position={[searchedPlace.lat, searchedPlace.lon]}
            icon={createSearchLocationIcon(searchedPlace.name)}
          >
            <Popup autoPan={true}>
              <div className="p-1.5 space-y-2 min-w-[210px] text-slate-200 text-xs font-sans">
                <div className="border-b border-slate-700/80 pb-1.5">
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{searchedPlace.name}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] truncate mt-0.5">
                    {searchedPlace.fullAddress}
                  </div>
                  <div className="font-mono text-slate-400 text-[10px] mt-0.5">
                    {searchedPlace.lat.toFixed(2)}°N, {searchedPlace.lon.toFixed(2)}°E
                  </div>
                </div>

                {distanceToStorm != null && (
                  <div className="space-y-1 bg-slate-800/60 p-2 rounded border border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Distance to Storm:</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {distanceToStorm} km
                      </span>
                    </div>
                    {bearingToStorm && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Bearing from Eye:</span>
                        <span className="font-mono text-slate-200">{bearingToStorm}</span>
                      </div>
                    )}
                    {riskLevel && (
                      <div className="mt-1 pt-1 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Risk Assessment:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${riskLevel.color}`}>
                          {riskLevel.text}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleRecenterStorm}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    View Storm Eye →
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Remove Pin
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Active Cyclone Center Marker */}
        {cyclone && (
          <Marker
            position={currentCenter}
            icon={createCycloneCenterIcon(cyclone.name, cyclone.classificationCode)}
          >
            <Popup>
              <div className="p-1.5 space-y-1.5 min-w-[190px] text-slate-200 text-xs">
                <div className="font-bold text-white text-sm">{cyclone.name}</div>
                <div className="text-sky-400 font-medium">{cyclone.classification}</div>
                <div className="font-mono text-slate-300">
                  Winds: {cyclone.windSpeedKmh} km/h ({cyclone.windSpeedKnots} kt)
                </div>
                <div className="font-mono text-slate-300">
                  Pressure: {cyclone.pressureHpa} hPa
                </div>
                <div className="font-mono text-slate-400 text-[11px]">
                  Movement: {cyclone.movementDirection} @ {cyclone.movementSpeedKmh || 14} km/h
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Clean Map Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded border border-slate-800 text-[11px] text-slate-300 hidden sm:block shadow-sm">
        <div className="font-semibold text-slate-200 text-xs mb-1.5 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Map Legend</span>
        </div>
        <div className="space-y-1 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-white bg-rose-500" />
            <span className="text-slate-300">● Cyclone Eye</span>
          </div>
          {searchedPlace && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-white bg-cyan-400" />
              <span className="text-cyan-300">📍 Searched Place</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400" />
            <span>— Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
            <span>— Forecast</span>
          </div>
          {showCone && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 border border-dashed border-amber-400/80 bg-amber-500/10 rounded-sm" />
              <span>▱ Uncertainty</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CycloneMap;
