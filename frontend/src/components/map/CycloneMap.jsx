import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IMD_CATEGORIES } from '../../data/mockCyclones';
import { Compass, Radio } from 'lucide-react';

// Dynamically center map
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 5, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

// Create custom pulsating SVG marker for cyclone center
const createPulsingCycloneIcon = (name, categoryCode) => {
  const category = IMD_CATEGORIES[categoryCode] || IMD_CATEGORIES.CS;
  const color = category.color;

  return L.divIcon({
    className: 'custom-cyclone-center-marker',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
        <span class="absolute w-10 h-10 rounded-full animate-ping opacity-60" style="background-color: ${color};"></span>
        <span class="absolute w-8 h-8 rounded-full animate-pulse opacity-80" style="background-color: ${color};"></span>
        <div class="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style="background-color: #0b1120;">
          <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></div>
        </div>
        <div class="absolute -bottom-5 whitespace-nowrap bg-slate-900/90 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 shadow-md">
          ${name}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Create small dot marker for track points
const createTrackPointIcon = (categoryCode, isForecast = false) => {
  const category = IMD_CATEGORIES[categoryCode] || IMD_CATEGORIES.D;
  const color = isForecast ? '#f59e0b' : category.color;

  return L.divIcon({
    className: 'custom-track-point-marker',
    html: `
      <div class="w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
        isForecast ? 'border-dashed border-amber-400 bg-amber-500/60' : 'border-white'
      } shadow-md" style="background-color: ${color};"></div>
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
    <div className={`relative w-full rounded-xl overflow-hidden border border-meteor-border shadow-2xl ${className}`} style={{ height }}>
      {/* Top Map HUD overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-meteor-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-meteor-border text-xs flex items-center gap-3 font-mono">
        {cyclone ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-slate-200 font-semibold">
                {cyclone.name} ({cyclone.classificationCode})
              </span>
            </div>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">
              {cyclone.latitude.toFixed(1)}°N, {cyclone.longitude.toFixed(1)}°E
            </span>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Monitoring Sector:</span>
            <span className="text-white font-semibold">North Indian Ocean (Standby)</span>
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

        {/* Free, reliable OpenStreetMap tiles (styled dark via CSS, ZERO watermarks or API key requirements) */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* Historical Track Line */}
        {historicalCoords.length > 1 && (
          <Polyline
            positions={historicalCoords}
            pathOptions={{
              color: '#06b6d4',
              weight: 3,
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
              weight: 2.5,
              dashArray: '6, 6',
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
                fillOpacity: 0.12,
                weight: 1,
                dashArray: '3, 4',
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
              <div className="p-1 space-y-1 text-slate-200 font-mono text-xs">
                <div className="font-bold text-cyan-400">{pt.classification}</div>
                <div>{new Date(pt.timestamp).toUTCString()}</div>
                <div>Winds: {pt.windSpeedKnots} kt | Pressure: {pt.pressureHpa} hPa</div>
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
              <div className="p-1 space-y-1 text-slate-200 font-mono text-xs">
                <div className="font-bold text-amber-400">Projected ({fc.forecastHour})</div>
                <div>{fc.classification}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active Cyclone Marker */}
        {cyclone && (
          <Marker
            position={currentCenter}
            icon={createPulsingCycloneIcon(cyclone.name, cyclone.classificationCode)}
          >
            <Popup>
              <div className="p-1.5 space-y-2 min-w-[200px] text-slate-200 font-mono text-xs">
                <div className="font-bold text-cyan-400">{cyclone.name}</div>
                <div>{cyclone.classification}</div>
                <div>Winds: {cyclone.windSpeedKnots} kt ({cyclone.windSpeedKmh} km/h)</div>
                <div>Pressure: {cyclone.pressureHpa} hPa</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-meteor-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-meteor-border text-[11px] font-mono text-slate-300 hidden sm:block">
        <div className="font-bold text-slate-200 text-xs mb-1 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          Map Legend
        </div>
        <div className="space-y-1 text-slate-400">
          <div>• Observed Track</div>
          <div>• Forecast Path</div>
          <div>• Cone of Uncertainty</div>
        </div>
      </div>
    </div>
  );
};

export default CycloneMap;
