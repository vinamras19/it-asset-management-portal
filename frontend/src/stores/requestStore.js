import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios';

const useRequestStore = create(
  persist(
    (set, get) => ({
      requests: [],
      allRequests: [],
      currentRequest: null,
      stats: [],
      isLoading: false,
      cart: [],

      addToCart: (asset) => {
        set((state) => {
          const exists = state.cart.find((item) => item.asset._id === asset._id);
          if (exists) {
            return {
              cart: state.cart.map((item) =>
                item.asset._id === asset._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { asset, quantity: 1 }] };
        });
      },

      removeFromCart: (assetId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.asset._id !== assetId),
        }));
      },

      updateCartQuantity: (assetId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          cart: state.cart.map((item) =>
            item.asset._id === assetId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ cart: [] }),

      fetchMyRequests: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/requests/my');
          set({ requests: response.data, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchAllRequests: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/requests/admin/all');
          set({ allRequests: response.data, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchRequestById: async (id) => {
        const response = await api.get(`/requests/${id}`);
        set({ currentRequest: response.data });
        return response.data;
      },

      createRequest: async (requestData) => {
        const { cart } = get();
        const assets = cart.map((item) => ({
          assetId: item.asset._id,
          quantity: item.quantity,
        }));

        const response = await api.post('/requests', {
          assets,
          justification: requestData.justification,
          priority: requestData.priority,
          deliveryLocation: requestData.deliveryLocation,
        });

        set((state) => ({
          requests: [response.data, ...state.requests],
          cart: [],
        }));
        return response.data;
      },

      cancelRequest: async (id) => {
        await api.patch(`/requests/${id}/cancel`);
        set((state) => ({
          requests: state.requests.map((r) =>
            r._id === id ? { ...r, status: 'Cancelled' } : r
          ),
        }));
      },

      updateRequestStatus: async (id, status, reason = '', adminNotes = '') => {
        const response = await api.patch(`/requests/${id}/status`, {
          status,
          reason,
          adminNotes,
        });
        set((state) => ({
          allRequests: state.allRequests.map((r) =>
            r._id === id ? response.data : r
          ),
        }));
        return response.data;
      },

      fetchRequestStats: async () => {
        const response = await api.get('/requests/admin/stats');
        set({ stats: response.data });
        return response.data;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);

export default useRequestStore;
