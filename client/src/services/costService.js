import api from './api';

export const costService = {
  async getCostSummary(params = {}) {
    const response = await api.get('/costs/summary', { params });
    return response.data;
  },

  async getCostRecords(params = {}) {
    const response = await api.get('/costs/records', { params });
    return response.data;
  },

  async getCostArbitrage(params = {}) {
    const response = await api.get('/costs/arbitrage', { params });
    return response.data;
  },

  async getRealizedSavings(params = {}) {
    const response = await api.get('/costs/realized-savings', { params });
    return response.data;
  },
};

