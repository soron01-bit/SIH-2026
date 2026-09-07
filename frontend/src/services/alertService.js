import api from './api';
import { MOCK_ALERTS } from '../data/mockAlerts';

export const alertService = {
  /**
   * Fetch all active & archived bulletins
   */
  async getAll() {
    try {
      const res = await api.get('/alerts/');
      return { data: res.data, isMock: false };
    } catch (err) {
      return { data: MOCK_ALERTS, isMock: true };
    }
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
  }
};

export default alertService;
