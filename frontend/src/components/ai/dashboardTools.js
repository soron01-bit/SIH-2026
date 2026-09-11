/**
 * dashboardTools.js
 *
 * Tool/function handler registry for the Gemini Live AI assistant.
 * Each entry maps a tool name (declared in the Live API session config)
 * to a JavaScript handler that executes the actual dashboard action.
 *
 * Handlers receive the function arguments from the model and a `context`
 * object containing router navigate + shared state setters injected at mount.
 */

import { MOCK_CYCLONES } from '../../data/mockCyclones';

export const TOOL_DECLARATIONS = [
  {
    name: 'navigate_to_storm',
    description: 'Open the dashboard view for a specific storm by name or id (e.g., Dana, Fengal, Remal, Michaung, Asna, Mocha)',
    parameters: {
      type: 'object',
      properties: {
        storm_id: { type: 'string', description: 'The cyclone id or name to navigate to' },
      },
      required: ['storm_id'],
    },
  },
  {
    name: 'toggle_map_layer',
    description: 'Show or hide a map layer on the cyclone tracking map',
    parameters: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          enum: ['cyclone_mask', 'forecast_cone', 'impact_zone', 'track'],
          description: 'The layer to toggle',
        },
        visible: { type: 'boolean', description: 'true to show, false to hide' },
      },
      required: ['layer', 'visible'],
    },
  },
  {
    name: 'start_replay',
    description: 'Start historical replay mode for a storm between two timestamps',
    parameters: {
      type: 'object',
      properties: {
        storm_id: { type: 'string' },
        from: { type: 'string', description: 'ISO 8601 start timestamp' },
        to: { type: 'string', description: 'ISO 8601 end timestamp' },
      },
      required: ['storm_id'],
    },
  },
  {
    name: 'open_alert_panel',
    description: 'Open the alert panel for the currently viewed storm',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_storm_status',
    description: 'Fetch the latest prediction summary or historical report for a cyclone (e.g. Dana, Fengal, Remal, Michaung, Asna, Mocha)',
    parameters: {
      type: 'object',
      properties: {
        storm_id: { type: 'string' },
      },
      required: ['storm_id'],
    },
  },
  {
    name: 'get_user_location_risk',
    description: 'Check the user proximity, distance in km, bearing, and localized risk level (CRITICAL, HIGH, MODERATE, SAFE) relative to an active cyclone',
    parameters: {
      type: 'object',
      properties: {
        cyclone_name: { type: 'string', description: 'Name of the cyclone (e.g. Dana, Remal)' },
      },
    },
  },
];

/**
 * Build the handler map. Called once in VoiceTextWidget with live context.
 *
 * @param {object} ctx - { navigate, cyclones, setSelectedCycloneById }
 * @returns {Record<string, (args) => Promise<string>>}
 */
export function buildToolHandlers(ctx) {
  const { navigate, cyclones = [], setSelectedCycloneById } = ctx;
  const pool = cyclones.length > 0 ? cyclones : MOCK_CYCLONES;

  return {
    async navigate_to_storm({ storm_id }) {
      const q = (storm_id || '').toLowerCase();
      const found = pool.find(
        (c) => c.id === storm_id || c.name?.toLowerCase().includes(q)
      );
      if (found) {
        setSelectedCycloneById?.(found.id);
        navigate?.('/dashboard');
        return `Navigated to ${found.name} (${found.classificationCode}). Peak winds: ${found.windSpeedKnots} kt, Pressure: ${found.pressureHpa} hPa.`;
      }
      navigate?.('/tracking');
      return `Switched to tracking map. Available cyclones: Dana, Fengal, Remal, Michaung, Asna, Mocha.`;
    },

    async toggle_map_layer({ layer, visible }) {
      window.dispatchEvent(
        new CustomEvent('cyclonex:toggle-layer', { detail: { layer, visible } })
      );
      return `Layer "${layer}" is now ${visible ? 'visible' : 'hidden'}.`;
    },

    async start_replay({ storm_id, from, to }) {
      window.dispatchEvent(
        new CustomEvent('cyclonex:start-replay', { detail: { storm_id, from, to } })
      );
      navigate?.('/tracking');
      return `Replay mode started for storm ${storm_id}${from ? ` from ${from}` : ''}.`;
    },

    async open_alert_panel() {
      navigate?.('/alerts');
      return 'Opened the alert panel.';
    },

    async get_storm_status({ storm_id }) {
      try {
        const q = (storm_id || '').toLowerCase();
        const found = pool.find(
          (c) => c.id === storm_id || c.name?.toLowerCase().includes(q)
        ) || pool[0];

        if (!found) return 'No cyclone record available.';

        const landfallStr = found.landfall ? ` Landfall: ${found.landfall.location} on ${found.landfall.date}.` : '';
        return (
          `${found.name} (${found.classificationCode}): ` +
          `Peak winds ${found.windSpeedKnots} kt (${found.windSpeedKmh} km/h), min pressure ${found.pressureHpa} hPa, ` +
          `centered at ${found.latitude?.toFixed(1)}°N, ${found.longitude?.toFixed(1)}°E over ${found.basin}.${landfallStr}`
        );
      } catch (e) {
        return 'Could not fetch storm status at this time.';
      }
    },

    async get_user_location_risk({ cyclone_name } = {}) {
      const loc = ctx.location;
      if (!loc) {
        return 'User location is not verified. Please allow location access or select your coastal station on the dashboard.';
      }

      const active = (cyclone_name
        ? pool.find((c) => c.name?.toLowerCase().includes(cyclone_name.toLowerCase()))
        : null) || pool[0];

      const prox = ctx.getProximityToStorm ? ctx.getProximityToStorm(active) : null;
      if (!prox) {
        return `User is at ${loc.city}, ${loc.state} (${loc.latitude}°N, ${loc.longitude}°E).`;
      }

      return (
        `User is located at ${loc.city}, ${loc.state} (${loc.latitude}°N, ${loc.longitude}°E). ` +
        `Distance to ${active.name}: ${prox.distanceKm} km (${prox.bearingFromUser}). ` +
        `Risk level: ${prox.riskLevel}. Local advisory: ${prox.advisory}`
      );
    },
  };
}
