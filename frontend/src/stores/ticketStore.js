import { create } from 'zustand';
import api from '../lib/axios';

const useTicketStore = create((set, get) => ({
  tickets: [],
  currentTicket: null,
  stats: [],
  isLoading: false,

  fetchTickets: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/tickets');
      set({ tickets: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTicketById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/tickets/${id}`);
      set({ currentTicket: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    set((state) => ({
      tickets: [response.data, ...state.tickets],
    }));
    return response.data;
  },

  addComment: async (ticketId, text) => {
    const response = await api.post(`/tickets/${ticketId}/comments`, { text });
    const { currentTicket } = get();
    if (currentTicket && currentTicket._id === ticketId) {
      set({
        currentTicket: {
          ...currentTicket,
          comments: [...currentTicket.comments, response.data],
        },
      });
    }
    return response.data;
  },

  updateTicketStatus: async (id, status, resolution = '') => {
    const response = await api.patch(`/tickets/${id}`, { status, resolution });
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t._id === id ? { ...t, status: response.data.status, resolution: response.data.resolution } : t
      ),
      currentTicket:
        state.currentTicket?._id === id
          ? { ...state.currentTicket, ...response.data }
          : state.currentTicket,
    }));
    return response.data;
  },

  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`);
    set((state) => ({
      tickets: state.tickets.filter((t) => t._id !== id),
    }));
  },

  fetchTicketStats: async () => {
    const response = await api.get('/tickets/admin/stats');
    set({ stats: response.data });
    return response.data;
  },

  clearCurrentTicket: () => set({ currentTicket: null }),
}));

export default useTicketStore;
