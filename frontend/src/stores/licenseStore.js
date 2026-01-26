import { create } from 'zustand';
import api from '../lib/axios';

const useLicenseStore = create((set) => ({
  licenses: [],
  isLoading: false,

  fetchLicenses: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/licenses');
      set({ licenses: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createLicense: async (licenseData) => {
    const response = await api.post('/licenses', licenseData);
    set((state) => ({
      licenses: [response.data, ...state.licenses],
    }));
    return response.data;
  },

  deleteLicense: async (id) => {
    await api.delete(`/licenses/${id}`);
    set((state) => ({
      licenses: state.licenses.filter((l) => l._id !== id),
    }));
  },
}));

export default useLicenseStore;
