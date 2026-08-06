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
export const getGoods = (factory, month, batch) => api.get('/goods', { params: { factory, month, batch } });
export const createGoods = (data) => api.post('/goods', data);
export const getGoodsDetail = (id) => api.get(`/goods/${id}`);
export const createSale = (goodsId, data) => api.post(`/goods/${goodsId}/sales`, data);
export const getSalesSummary = (month) => api.get('/sales/summary', { params: { month } });
export const getAllSales = (month) => api.get('/sales', { params: { month } });
export const createMultiItemSale = (data) => api.post('/sales/multi', data);
export const getTransactions = (filterType, month) => api.get('/transactions', { params: { filter_type: filterType, month } });
export const getAccountHolders = () => api.get('/account-holders');
export const createAccountHolder = (data) => api.post('/account-holders', data);
export const adjustAccountHolderBalance = (id, data) => api.post(`/account-holders/${id}/adjust`, data);
export const getAccountHistory = (id) => api.get(`/account-holders/${id}/history`);
export const getExpenses = (factory, month) => api.get('/expenses', { params: { factory, month } });
export const createExpense = (data) => api.post('/expenses', data);
export const getReports = (month, factory) => api.get('/reports', { params: { month, factory } });

export const deleteGoods = (id) => api.delete(`/goods/${id}`);
export const deleteSale = (id) => api.delete(`/sales/${id}`);
export const deleteAccountHolder = (id) => api.delete(`/account-holders/${id}`);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const resetDatabase = () => api.post('/reset-database');

export const updateGoods = (id, data) => api.put(`/goods/${id}`, data);
export const updateSale = (id, data) => api.put(`/sales/${id}`, data);
export const updateAccountHolder = (id, data) => api.put(`/account-holders/${id}`, data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const exportCloudBackup = () => api.get('/cloud/export-backup');

export const getPendingBalances = () => api.get('/balances');
export const settleSaleBalance = (saleId, data) => api.post(`/sales/${saleId}/settle`, data);
export const getChansandraSummary = (month) => api.get('/chansandra', { params: { month } });
export const createChansandraEntry = (data) => api.post('/chansandra', data);
export const deleteChansandraEntry = (id) => api.delete(`/chansandra/${id}`);

export default api;
