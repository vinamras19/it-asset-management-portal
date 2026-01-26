import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const response = await api.get('/auth/profile');
      set({ user: response.data, isAuthenticated: true, isLoading: false, isCheckingAuth: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false, isCheckingAuth: false });
    }
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.requiresTwoFactor) {
      return { requiresTwoFactor: true, userId: response.data.userId };
    }
    set({ user: response.data.user, isAuthenticated: true });
    return { success: true };
  },

  verify2FALogin: async (userId, token) => {
    const response = await api.post('/2fa/verify-login', { userId, token });
    if (response.data.verified) {
      set({ user: response.data.user, isAuthenticated: true });
      return { success: true };
    }
    throw new Error(response.data.message);
  },

  signup: async (name, email, password, department) => {
    const response = await api.post('/auth/signup', { name, email, password, department });
    set({ user: response.data.user, isAuthenticated: true });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    set({ user: response.data });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  refreshUser: async () => {
    const response = await api.get('/auth/profile');
    set({ user: response.data });
  },
}));

export default useAuthStore;
