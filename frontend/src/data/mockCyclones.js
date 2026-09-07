/**
 * CYCLONE DATA STORE
 * Clean state: Ready for live data connection from the trained AI model in the next step.
 */

export const IMD_CATEGORIES = {
  D: { name: 'Depression', code: 'D', windMin: 17, windMax: 27, color: '#38bdf8' },
  DD: { name: 'Deep Depression', code: 'DD', windMin: 28, windMax: 33, color: '#0ea5e9' },
  CS: { name: 'Cyclonic Storm', code: 'CS', windMin: 34, windMax: 47, color: '#10b981' },
  SCS: { name: 'Severe Cyclonic Storm', code: 'SCS', windMin: 48, windMax: 63, color: '#f59e0b' },
  VSCS: { name: 'Very Severe Cyclonic Storm', code: 'VSCS', windMin: 64, windMax: 89, color: '#f97316' },
  ESCS: { name: 'Extremely Severe Cyclonic Storm', code: 'ESCS', windMin: 90, windMax: 119, color: '#ef4444' },
  SuCS: { name: 'Super Cyclonic Storm', code: 'SuCS', windMin: 120, windMax: 999, color: '#a855f7' },
};

// No hardcoded or fake cyclone data - awaiting live AI model connection
export const MOCK_CYCLONES = [];

export const SYSTEM_TELEMETRY = {
  activeCyclonesCount: 0,
  monitoredBasins: ['Bay of Bengal', 'Arabian Sea'],
  sensorStatus: 'STANDBY',
  aiModelStatus: 'AWAITING_MODEL_INTEGRATION',
};
