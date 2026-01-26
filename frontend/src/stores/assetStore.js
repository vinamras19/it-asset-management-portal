import { create } from 'zustand';
import api from '../lib/axios';

const useAssetStore = create((set, get) => ({
  assets: [],
  currentAsset: null,
  isLoading: false,
  stats: [],

  fetchAssets: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/assets');
      set({ assets: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchAssetById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/assets/${id}`);
      set({ currentAsset: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createAsset: async (assetData) => {
    const response = await api.post('/assets', assetData);
    set((state) => ({ assets: [response.data, ...state.assets] }));
    return response.data;
  },

  updateAsset: async (id, assetData) => {
    const response = await api.put(`/assets/${id}`, assetData);
    set((state) => ({
      assets: state.assets.map((a) => (a._id === id ? response.data : a)),
      currentAsset: state.currentAsset?._id === id ? response.data : state.currentAsset,
    }));
    return response.data;
  },

  deleteAsset: async (id) => {
    await api.delete(`/assets/${id}`);
    set((state) => ({
      assets: state.assets.filter((a) => a._id !== id),
    }));
  },

  searchAssets: async (query) => {
    if (!query) return [];
    const response = await api.get(`/assets/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  fetchAssetStats: async () => {
    const response = await api.get('/assets/stats');
    set({ stats: response.data });
    return response.data;
  },

  fetchAssignedAssets: async (userId) => {
    const response = await api.get(`/assets/assigned/${userId}`);
    return response.data;
  },

  bulkUpdateStatus: async (assetIds, status) => {
    const response = await api.post('/assets/bulk/status', { assetIds, status });
    await get().fetchAssets();
    return response.data;
  },

  clearCurrentAsset: () => set({ currentAsset: null }),
}));

export default useAssetStore;
