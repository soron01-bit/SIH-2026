import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IMD_CATEGORIES } from '../../data/mockCyclones';
import { Compass, Radio } from 'lucide-react';

// Center controller
const MapController = ({ center, zoom }) => {
  const map = useMap();
  const prevCenterRef = React.useRef(null);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      const [lat, lon] = center;
      const prev = prevCenterRef.current;
      if (!prev || prev[0] !== lat || prev[1] !== lon) {
        prevCenterRef.current = [lat, lon];
        map.setView([lat, lon], zoom || 5, { animate: true });
      }
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
};

// Clean, professional SVG marker for cyclone center (not sci-fi glowing)
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

export const CycloneMap = ({
  cyclone = null,
  height = '480px',
  interactive = true,
  showCone = true,
  className = '',
}) => {
  // Default oceanic center (North Indian Ocean / Bay of Bengal & Arabian Sea)
  const defaultCenter = [16.5, 82.5];
  const currentCenter = cyclone && cyclone.latitude ? [cyclone.latitude, cyclone.longitude] : defaultCenter;
  const zoom = cyclone ? 6 : 5;

  // Coordinates array for historical path
  const historicalCoords = cyclone?.historicalTrack?.map((pt) => [pt.latitude, pt.longitude]) || [];
  if (cyclone && historicalCoords.length > 0) {
    historicalCoords.push(currentCenter);
  }

  // Coordinates array for forecast path
  const forecastCoords = cyclone
    ? [currentCenter, ...(cyclone.forecastTrack?.map((pt) => [pt.latitude, pt.longitude]) || [])]
    : [];

  return (
    <div className={`relative w-full rounded-lg overflow-hidden border border-slate-800 bg-[#080c15] ${className}`} style={{ height }}>
      {/* Top Map Status Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded border border-slate-800 text-xs flex items-center gap-3 font-sans">
        {cyclone ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
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
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Sector:</span>
            <span className="text-white font-medium">North Indian Ocean (All Clear)</span>
          </div>
        )}
      </div>

      <MapContainer
        center={currentCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl={false}
        className="h-full w-full"
      >
        <MapController center={currentCenter} zoom={zoom} />

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
            <span className="text-slate-300">● Current</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400" />
            <span>— Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
            <span>— Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 border border-dashed border-amber-400/80 bg-amber-500/10 rounded-sm" />
            <span>▱ Uncertainty</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycloneMap;
