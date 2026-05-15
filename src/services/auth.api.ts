import { apiClient } from '../api/client';

export const AuthService = {
  // Add backend specific auth routes if not completely relying on Supabase JS client
  // e.g., sync user profile after signup
  syncProfile: async (userData: any) => {
    const response = await apiClient.post('/auth/sync', userData);
    return response.data;
  },
};
