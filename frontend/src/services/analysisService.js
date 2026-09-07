import api from './api';

export const analysisService = {
  /**
   * Submit satellite image for AI cyclone identification and classification.
   * Connects to backend POST /api/analyze/ when the AI model is plugged in.
   */
  async analyzeImage(file) {
    const formData = new FormData();
    formData.append('satellite_image', file);

    try {
      const response = await api.post('/analyze/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err) {
      // Clean fallback: informs user that AI model integration occurs next, no fake numbers!
      return {
        success: false,
        model_ready: false,
        message: 'AI Model will be integrated in the next step. Image ready for inference.',
      };
    }
  },

  async getAnalysisById(id) {
    try {
      const response = await api.get(`/analysis/${id}/`);
      return response.data;
    } catch (err) {
      return null;
    }
  },
};

export default analysisService;
