import api from './api';
import { MOCK_ALERTS } from '../data/mockAlerts';

const STORAGE_KEY = 'cyclonex_active_alerts';

export const createAlertFromCyclone = (cyclone) => {
  return {
    id: 'alert-detected-01',
    bulletinNo: 'IMD/BOB/01/2026',
    title: `Cyclone Warning: ${cyclone.name} in ${cyclone.basin}`,
    severity: cyclone.riskLevel === 'EXTREME' ? 'EXTREME' : 'HIGH',
    warningColor: 'Orange',
    location: 'North Andhra - South Odisha Coast',
    state: 'Odisha / Andhra Pradesh',
    timestamp: new Date().toISOString(),
    description: `A ${cyclone.classification} has been identified by satellite remote sensing at coordinates ${cyclone.latitude}°N, ${cyclone.longitude}°E. Movement is projected ${cyclone.movementDirection} towards coastal sectors.`,
    windWarning: `Squally winds reaching ${cyclone.windSpeedKmh} km/h (${cyclone.windSpeedKnots} kt) expected along and off coastal districts.`,
    seaCondition: `High to very rough sea conditions prevailing. Fishermen advised not to venture into deep waters.`,
    isActive: true,
  };
};

export const alertService = {
  /**
   * Fetch all active & archived bulletins
   */
  async getAll() {
    try {
      const res = await api.get('/alerts/');
      if (res.data && res.data.length > 0) {
        return { data: res.data, isMock: false };
      }
    } catch (err) {
      // Backend not yet connected
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { data: parsed, isMock: true };
        }
      }
    } catch (e) {
      console.warn('Could not read stored alerts', e);
    }

    return { data: MOCK_ALERTS, isMock: true };
  },

  /**
   * Fetch active alerts only
   */
  async getActive() {
    const { data, isMock } = await this.getAll();
    return {
      data: data.filter((item) => item.isActive !== false),
      isMock,
    };
  },

  saveAlert(alert) {
    try {
      const existing = this.getStoredAlerts();
      const filtered = existing.filter((a) => a.id !== alert.id);
      const updated = [alert, ...filtered];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [alert];
    }
  },

  clearAlerts() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  },

  getStoredAlerts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
};

export default alertService;
