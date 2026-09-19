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
};
