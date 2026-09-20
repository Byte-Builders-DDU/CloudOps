import api from './api';

export const accountService = {
  async getAccounts() {
    const response = await api.get('/accounts');
    return response.data;
  },

  async syncAccount(id) {
    const response = await api.post(`/accounts/${id}/sync`);
    return response.data;
  },

  async createAccount(data) {
    const response = await api.post('/accounts', data);
    return response.data;
  },

  async deleteAccount(id) {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  async getAzureStatus() {
    const response = await api.get('/accounts/azure/status');
    return response.data;
  },

  async diagnoseAzure(data = {}) {
    const response = await api.post('/accounts/azure/diagnose', data);
    return response.data;
  },

  async getAwsStatus() {
    const response = await api.get('/accounts/aws/status');
    return response.data;
  },

  async diagnoseAws(data = {}) {
    const response = await api.post('/accounts/aws/diagnose', data);
    return response.data;
  },
};
