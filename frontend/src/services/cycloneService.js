import api from './api';
import { MOCK_CYCLONES } from '../data/mockCyclones';

export const cycloneService = {
  /**
   * Fetch list of all cyclones (Active + Historical Archives)
   */
  async getAll() {
    try {
      const res = await api.get('/cyclones/');
      return { data: res.data, isMock: false };
    } catch (err) {
      // Fallback to rich mock data when Django backend is not yet started in Phase 1
      return { data: MOCK_CYCLONES, isMock: true };
    }
  },

  /**
   * Fetch detailed storm dossier by id
   */
  async getById(id) {
    try {
      const res = await api.get(`/cyclones/${id}/`);
      return { data: res.data, isMock: false };
    } catch (err) {
      const found = MOCK_CYCLONES.find((c) => c.id === id) || MOCK_CYCLONES[0];
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
      const storm = MOCK_CYCLONES.find((c) => c.id === id) || MOCK_CYCLONES[0];
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
};

export default cycloneService;
