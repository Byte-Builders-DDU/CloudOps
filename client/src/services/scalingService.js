import api from './api';

export const scalingService = {
  async getRecommendations(params = {}) {
    const response = await api.get('/scaling/recommendations', { params });
    return response.data;
  },

  async applyRecommendation(id) {
    const response = await api.post(`/scaling/apply/${id}`);
    return response.data;
  },

  async dismissRecommendation(id) {
    const response = await api.post(`/scaling/dismiss/${id}`);
    return response.data;
  },
};
