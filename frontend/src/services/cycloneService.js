import api from './api';
import { MOCK_CYCLONES } from '../data/mockCyclones';

const STORAGE_KEY = 'cyclonex_active_cyclones';

/**
 * Generate dynamic tracked storm object with historical observations and forecast cone points
 * calculated dynamically from the actual analyzed eye position and movement vector.
 */
export const createTrackedCycloneFromAnalysis = (analysis = {}) => {
  const basin = analysis.basin || 'Bay of Bengal';
  const isArabian = basin === 'Arabian Sea';
  const defaultLat = isArabian ? 16.5 : 15.8;
  const defaultLon = isArabian ? 67.2 : 87.5;
  const defaultName = isArabian ? 'Cyclone Asna' : 'Cyclone Dana';

  const lat = Number(analysis.eyeLocation?.latitude ?? defaultLat);
  const lon = Number(analysis.eyeLocation?.longitude ?? defaultLon);
  const windKmh = analysis.windSpeedKmh || 120;
  const windKt = analysis.windSpeedKnots || 65;
  const pressure = analysis.pressureHpa || 980;
  const name = analysis.stormName || defaultName;
  const classification = analysis.classification || 'Severe Cyclonic Storm (SCS)';
  const classificationCode = analysis.classificationCode || 'SCS';
  const movement = analysis.movement || (isArabian ? 'North-North-East' : 'North-West');
  const movementSpeedKmh = parseInt(analysis.movementSpeed, 10) || 14;
  const riskLevel = analysis.riskLevel || 'HIGH';
  const now = new Date();

  // Determine trajectory displacement vectors based on analysis sector or movement direction
  let dLatHist = analysis.dLatHist !== undefined ? analysis.dLatHist : 0.7;
  let dLonHist = analysis.dLonHist !== undefined ? analysis.dLonHist : -0.5;
  let dLatFore = analysis.dLatFore !== undefined ? analysis.dLatFore : 1.1;
  let dLonFore = analysis.dLonFore !== undefined ? analysis.dLonFore : -0.6;

  if (analysis.dLatFore === undefined) {
    const mLower = movement.toLowerCase();
    if (mLower.includes('north-east') || mLower.includes('north-north-east')) {
      dLatHist = 0.85;
      dLonHist = -0.4;
      dLatFore = 1.15;
      dLonFore = 0.7;
    } else if (mLower.includes('west-north-west')) {
      dLatHist = 0.5;
      dLonHist = 0.85;
      dLatFore = 0.65;
      dLonFore = -1.1;
    } else if (mLower.includes('north-west')) {
      dLatHist = 0.7;
      dLonHist = 0.55;
      dLatFore = 1.05;
      dLonFore = -0.65;
    } else if (mLower === 'north') {
      dLatHist = 0.9;
      dLonHist = 0.1;
      dLatFore = 1.3;
      dLonFore = 0.1;
    }
  }

  // Generate 3 Historical observation points leading up to current eye
  const historicalTrack = [
    {
      id: 'hist-1',
      timestamp: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(),
      latitude: Number((lat - 2.8 * dLatHist).toFixed(2)),
      longitude: Number((lon - 2.8 * dLonHist).toFixed(2)),
      windSpeedKnots: Math.max(25, windKt - 25),
      pressureHpa: pressure + 18,
      classification: 'Deep Depression',
      categoryCode: 'DD',
      uncertaintyRadiusKm: 0,
    },
    {
      id: 'hist-2',
      timestamp: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      latitude: Number((lat - 1.9 * dLatHist).toFixed(2)),
      longitude: Number((lon - 1.9 * dLonHist).toFixed(2)),
      windSpeedKnots: Math.max(35, windKt - 15),
      pressureHpa: pressure + 10,
      classification: 'Cyclonic Storm',
      categoryCode: 'CS',
      uncertaintyRadiusKm: 0,
    },
    {
      id: 'hist-3',
      timestamp: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      latitude: Number((lat - 0.95 * dLatHist).toFixed(2)),
      longitude: Number((lon - 0.95 * dLonHist).toFixed(2)),
      windSpeedKnots: Math.max(45, windKt - 5),
      pressureHpa: pressure + 4,
      classification: 'Cyclonic Storm',
      categoryCode: 'CS',
      uncertaintyRadiusKm: 0,
    },
  ];

  // Generate 4 Forecast trajectory points with dynamic Cone of Uncertainty radii
  const forecastTrack = [
    {
      id: 'fc-12h',
      forecastHour: '+12h',
      timestamp: new Date(now.getTime() + 12 * 3600 * 1000).toISOString(),
      latitude: Number((lat + 1.0 * dLatFore).toFixed(2)),
      longitude: Number((lon + 1.0 * dLonFore).toFixed(2)),
      windSpeedKnots: windKt + 5,
      pressureHpa: pressure - 4,
      classification: 'Severe Cyclonic Storm',
      categoryCode: 'SCS',
      uncertaintyRadiusKm: 35,
    },
    {
      id: 'fc-24h',
      forecastHour: '+24h',
      timestamp: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
      latitude: Number((lat + 2.0 * dLatFore).toFixed(2)),
      longitude: Number((lon + 2.0 * dLonFore).toFixed(2)),
      windSpeedKnots: windKt + 10,
      pressureHpa: pressure - 8,
      classification: 'Very Severe Cyclonic Storm',
      categoryCode: 'VSCS',
      uncertaintyRadiusKm: 65,
    },
    {
      id: 'fc-36h',
      forecastHour: '+36h',
      timestamp: new Date(now.getTime() + 36 * 3600 * 1000).toISOString(),
      latitude: Number((lat + 2.9 * dLatFore).toFixed(2)),
      longitude: Number((lon + 2.9 * dLonFore).toFixed(2)),
      windSpeedKnots: Math.max(45, windKt - 5),
      pressureHpa: pressure + 2,
      classification: 'Severe Cyclonic Storm',
      categoryCode: 'SCS',
      uncertaintyRadiusKm: 95,
    },
    {
      id: 'fc-48h',
      forecastHour: '+48h',
      timestamp: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
      latitude: Number((lat + 3.8 * dLatFore).toFixed(2)),
      longitude: Number((lon + 3.8 * dLonFore).toFixed(2)),
      windSpeedKnots: Math.max(35, windKt - 20),
      pressureHpa: pressure + 12,
      classification: 'Cyclonic Storm',
      categoryCode: 'CS',
      uncertaintyRadiusKm: 130,
    },
  ];

  return {
    id: `cyclone-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.round(lat * 10)}`,
    name,
    classification,
    classificationCode,
    status: 'ACTIVE_MONITORING',
    basin,
    latitude: lat,
    longitude: lon,
    windSpeedKnots: windKt,
    windSpeedKmh: windKmh,
    pressureHpa: pressure,
    movementDirection: movement,
    movementSpeedKmh,
    riskLevel,
    detectionConfidence: analysis.confidence || 92,
    detectedAt: now.toISOString(),
    satelliteSensor: 'INSAT-3DR Multispectral',
    eyeRadiusKm: 22,
    summary:
      analysis.humanSummary ||
      `Tropical cyclonic circulation identified with organized convective bands over the ${basin}, centered at ${lat}°N, ${lon}°E moving ${movement}.`,
    historicalTrack,
    forecastTrack,
  };
};

export const cycloneService = {
  /**
   * Fetch list of all cyclones (Active + Historical Archives)
   */
  async getAll() {
    try {
      const res = await api.get('/cyclones/');
      if (res.data && res.data.length > 0) {
        return { data: res.data, isMock: false };
      }
    } catch (err) {
      // Backend not yet running; fall back to client session / mock
    }

    // Check localStorage for any actively analyzed storm and merge with all archived cyclones
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map((p) => p.id));
          const merged = [...parsed, ...MOCK_CYCLONES.filter((m) => !storedIds.has(m.id))];
          return { data: merged, isMock: true };
        }
      }
    } catch (e) {
      console.warn('Could not read stored cyclones', e);
    }

    return { data: MOCK_CYCLONES, isMock: true };
  },

  /**
   * Fetch detailed storm dossier by id
   */
  async getById(id) {
    try {
      const res = await api.get(`/cyclones/${id}/`);
      return { data: res.data, isMock: false };
    } catch (err) {
      const { data } = await this.getAll();
      const found = data.find((c) => c.id === id) || data[0];
      return { data: found, isMock: true };
    }
  },

  /**
   * Fetch track points & forecast trajectory
   */
  async getTrack(id) {
    try {
      const res = await api.get(`/cyclones/${id}/track/`);
      return { data: res.data, isMock: false };
    } catch (err) {
      const { data } = await this.getAll();
      const storm = data.find((c) => c.id === id) || data[0];
      if (!storm) return { data: null, isMock: true };
      return {
        data: {
          historicalTrack: storm.historicalTrack,
          forecastTrack: storm.forecastTrack,
          currentLocation: { latitude: storm.latitude, longitude: storm.longitude },
        },
        isMock: true,
      };
    }
  },

  /**
   * Helper to get current active tracked storm
   */
  async getActiveCyclone() {
    const { data } = await this.getAll();
    const active = data.find((c) => c.status === 'ACTIVE_MONITORING') || data[0];
    return active;
  },

  /**
   * Save a detected cyclone from AI analysis into active monitoring store
   */
  saveDetectedCyclone(cycloneData) {
    try {
      const existing = this.getStoredCyclones();
      // Remove any duplicate or legacy mock entries
      const filtered = existing.filter(
        (c) => c.id !== cycloneData.id && !c.id.includes('remal-detected')
      );
      const updated = [cycloneData, ...filtered];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cyclonex:cyclone-updated', { detail: cycloneData }));
      return updated;
    } catch (e) {
      console.error('Error saving detected cyclone:', e);
      return [cycloneData];
    }
  },

  /**
   * Clear any detected cyclones (reset to clean standby)
   */
  clearDetectedCyclone() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('cyclonex:cyclone-updated', { detail: null }));
    } catch (e) {
      console.error('Error clearing stored cyclones:', e);
    }
  },

  getStoredCyclones() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Filter out outdated static Remal artifact from earlier debugging sessions
      const cleanList = parsed.filter(
        (c) =>
          !(
            c.name?.includes('Remal') &&
            Number(c.latitude) >= 16.0 &&
            Number(c.latitude) <= 18.0 &&
            Number(c.longitude) >= 85.0 &&
            Number(c.longitude) <= 87.0
          )
      );

      if (cleanList.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
      }
      return cleanList;
    } catch (e) {
      return [];
    }
  }
};

export default cycloneService;
