import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardStats = (month) => api.get('/dashboard/stats', { params: { month } });
export const getGoods = (factory, month) => api.get('/goods', { params: { factory, month } });
export const createGoods = (data) => api.post('/goods', data);
export const getGoodsDetail = (id) => api.get(`/goods/${id}`);
export const createSale = (goodsId, data) => api.post(`/goods/${goodsId}/sales`, data);
export const getTransactions = (filterType, month) => api.get('/transactions', { params: { filter_type: filterType, month } });
export const getAccountHolders = () => api.get('/account-holders');
export const createAccountHolder = (data) => api.post('/account-holders', data);
export const getAccountHistory = (id) => api.get(`/account-holders/${id}/history`);
export const getExpenses = (factory, month) => api.get('/expenses', { params: { factory, month } });
export const createExpense = (data) => api.post('/expenses', data);
export const getReports = (month, factory) => api.get('/reports', { params: { month, factory } });

export default api;
