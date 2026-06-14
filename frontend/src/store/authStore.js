import { create } from 'zustand';
import { authApi } from '../api/client';

export const useAuthStore = create((set) => ({
  officer: JSON.parse(localStorage.getItem('abcl_officer') || 'null'),
  token: localStorage.getItem('abcl_officer_token') || null,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ username, password });
      const { token, officer } = res.data.data;
      localStorage.setItem('abcl_officer_token', token);
      localStorage.setItem('abcl_officer', JSON.stringify(officer));
      set({ token, officer, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('abcl_officer_token');
    localStorage.removeItem('abcl_officer');
    set({ officer: null, token: null });
  },
}));
