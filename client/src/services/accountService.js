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
};
