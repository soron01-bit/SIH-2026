import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserLocationContext = createContext();

// Haversine distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Bearing from point 1 to point 2
export function calculateBearing(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return '';
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  const deg = (brng + 360) % 360;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(deg / 22.5) % 16];
}

export const COASTAL_CITIES = [
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Digha', state: 'West Bengal', lat: 21.6266, lon: 87.5074 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
  { name: 'Puri', state: 'Odisha', lat: 19.8135, lon: 85.8312 },
  { name: 'Paradip', state: 'Odisha', lat: 20.3164, lon: 86.6114 },
  { name: 'Balasore', state: 'Odisha', lat: 21.4934, lon: 86.9135 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
  { name: 'Machilipatnam', state: 'Andhra Pradesh', lat: 16.1875, lon: 81.1389 },
  { name: 'Bapatla', state: 'Andhra Pradesh', lat: 15.9042, lon: 80.4674 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Puducherry', state: 'Puducherry', lat: 11.9416, lon: 79.8083 },
  { name: 'Cuddalore', state: 'Tamil Nadu', lat: 11.7480, lon: 79.7714 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Kutch / Mandvi', state: 'Gujarat', lat: 22.8333, lon: 69.3500 },
];

function findNearestCity(lat, lon) {
  let minD = Infinity;
  let nearest = COASTAL_CITIES[0];
  for (const c of COASTAL_CITIES) {
    const d = calculateDistanceKm(lat, lon, c.lat, c.lon);
    if (d < minD) {
      minD = d;
      nearest = c;
    }
  }
  return { ...nearest, distanceKm: minD };
}

export const UserLocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'loading'
  const [error, setError] = useState(null);

  // Request high-accuracy geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setPermissionState('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const accuracy = Math.round(pos.coords.accuracy);

        // Find nearest city or reverse geocode
        let city = 'Coastal Sector';
        let state = 'India';

        const nearest = findNearestCity(lat, lon);
        if (nearest.distanceKm < 150) {
          city = nearest.name;
          state = nearest.state;
        }

        // Try reverse geocoding via OpenStreetMap for exact street/district
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
            { headers: { 'User-Agent': 'CycloneAI-SIH2026-App' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            city = addr.city || addr.town || addr.county || addr.district || nearest.name;
            state = addr.state || nearest.state;
          }
        } catch {
          // fallback to nearest offline city
        }

        const locObj = {
          latitude: lat,
          longitude: lon,
          accuracy,
          city,
          state,
          label: `${city}, ${state} (${lat}°N, ${lon}°E)`,
          timestamp: new Date(),
        };

        setLocation(locObj);
        setPermissionState('granted');
        localStorage.setItem('cyclonex_user_location', JSON.stringify(locObj));
      },
      (err) => {
        console.warn('Geolocation access error:', err.message);
        setPermissionState('denied');
        setError(err.message);

        // Load previously saved or default to benchmark coastal city (Kolkata/Puri)
        const saved = localStorage.getItem('cyclonex_user_location');
        if (saved) {
          try {
            setLocation(JSON.parse(saved));
          } catch {}
        } else {
          // Default fallback city
          const defaultLoc = {
            latitude: 22.5726,
            longitude: 88.3639,
            accuracy: 1000,
            city: 'Kolkata',
            state: 'West Bengal',
            label: 'Kolkata, West Bengal (Default Coastal Reference)',
            timestamp: new Date(),
            isDefault: true,
          };
          setLocation(defaultLoc);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Request location on first mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Assess proximity & risk relative to an active cyclone
  const getProximityToStorm = useCallback(
    (cyclone) => {
      if (!location || !cyclone) return null;
      const stormLat = cyclone.latitude;
      const stormLon = cyclone.longitude;
      const distance = calculateDistanceKm(location.latitude, location.longitude, stormLat, stormLon);
      const bearing = calculateBearing(location.latitude, location.longitude, stormLat, stormLon);

      let riskLevel = 'SAFE';
      let advisory = 'No immediate hazard. Continue regular weather monitoring.';
      let color = '#10b981';

      if (distance <= 120) {
        riskLevel = 'CRITICAL';
        advisory = `Direct Core Hazard Zone! Cyclone eye is only ${distance} km ${bearing} of your area. Severe gale winds and torrential deluge imminent. Evacuate low-lying zones immediately.`;
        color = '#ef4444';
      } else if (distance <= 300) {
        riskLevel = 'HIGH';
        advisory = `High Impact Ring! Cyclone eye is ${distance} km ${bearing}. Expect gale winds (60-90 km/h), intense squalls, and localized flooding. Stay indoors.`;
        color = '#f97316';
      } else if (distance <= 600) {
        riskLevel = 'MODERATE';
        advisory = `Peripheral Band Watch. Cyclone is ${distance} km ${bearing}. Outer rain bands may produce gusty showers and rough seas.`;
        color = '#f59e0b';
      } else {
        riskLevel = 'LOW';
        advisory = `Cyclone is ${distance} km away over the ${cyclone.basin || 'Bay of Bengal'}. Safe from direct cyclonic core winds.`;
        color = '#38bdf8';
      }

      return {
        distanceKm: distance,
        bearingFromUser: bearing,
        riskLevel,
        advisory,
        color,
      };
    },
    [location]
  );

  // Allow user to manually select a coastal city for quick testing or fallback
  const setCityManual = useCallback((cityName) => {
    const cityObj = COASTAL_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (!cityObj) return;

    const locObj = {
      latitude: cityObj.lat,
      longitude: cityObj.lon,
      accuracy: 50,
      city: cityObj.name,
      state: cityObj.state,
      label: `${cityObj.name}, ${cityObj.state} (${cityObj.lat}°N, ${cityObj.lon}°E)`,
      timestamp: new Date(),
      isManual: true,
    };
    setLocation(locObj);
    setPermissionState('granted');
    localStorage.setItem('cyclonex_user_location', JSON.stringify(locObj));
  }, []);

  return (
    <UserLocationContext.Provider
      value={{
        location,
        setLocation,
        permissionState,
        requestLocation,
        setCityManual,
        coastalCities: COASTAL_CITIES,
        error,
        getProximityToStorm,
      }}
    >
      {children}
    </UserLocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(UserLocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a UserLocationProvider');
  }
  return context;
};

export default UserLocationContext;
