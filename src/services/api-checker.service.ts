import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { apiService } from '@/services/api.service';
import { logger, LogTag } from '@/utils/logger';

export interface HealthCheckResult {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const apiChecker = {
  /**
   * Check if the backend API is reachable and healthy.
   */
  async checkBackendHealth(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now();
      const result = await apiService.checkHealth();
      const duration = Date.now() - startTime;

      return {
        id: 'backend-api',
        name: 'Next.js Backend API',
        status: result.status as any,
        message: `${result.message} (${duration}ms)`,
        details: result.details,
      };
    } catch (err: any) {
      return {
        id: 'backend-api',
        name: 'Next.js Backend API',
        status: 'error',
        message: err.message || 'Connection failed',
        details: err,
      };
    }
  },

  /**
   * Check if the Supabase Auth session is active and valid.
   */
  async checkAuthSession(): Promise<HealthCheckResult> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (!session) {
        return {
          id: 'auth-session',
          name: 'Supabase Auth Session',
          status: 'warning',
          message: 'No active session found. User might be logged out.',
        };
      }

      const expiresAt = new Date(session.expires_at! * 1000);
      const isExpired = expiresAt < new Date();

      return {
        id: 'auth-session',
        name: 'Supabase Auth Session',
        status: isExpired ? 'error' : 'success',
        message: isExpired ? 'Session active' : `Session active (Expires: ${expiresAt.toLocaleString()})`,
        details: { user: session.user.email, id: session.user.id },
      };
    } catch (err: any) {
      return {
        id: 'auth-session',
        name: 'Supabase Auth Session',
        status: 'error',
        message: err.message || 'Failed to retrieve session',
      };
    }
  },

  /**
   * Verify Zustand auth state is in sync with Supabase.
   */
  async verifyZustandSync(): Promise<HealthCheckResult> {
    try {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      const { session: zustandSession, user: zustandUser } = useAuthStore.getState();

      const inSync = (!!supabaseSession === !!zustandSession) && 
                     (supabaseSession?.user.id === zustandUser?.id);

      return {
        id: 'zustand-sync',
        name: 'Zustand Store Sync',
        status: inSync ? 'success' : 'error',
        message: inSync ? 'Zustand is synced with Supabase' : 'Zustand store out of sync!',
        details: {
          supabaseUser: supabaseSession?.user.email,
          zustandUser: zustandUser?.email,
        },
      };
    } catch (err) {
      return {
        id: 'zustand-sync',
        name: 'Zustand Store Sync',
        status: 'error',
        message: 'Failed to verify sync',
      };
    }
  },

  /**
   * Test direct database read (if RLS allows it).
   */
  async testDatabaseRead(): Promise<HealthCheckResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth required for DB read test');

      const { data, error, status } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      if (error) {
        if (status === 406 || error.code === '42501') {
          return {
            id: 'db-read',
            name: 'DB Read (RLS Check)',
            status: 'error',
            message: 'RLS Policy Violation: Permission denied.',
            details: error,
          };
        }
        throw error;
      }

      return {
        id: 'db-read',
        name: 'DB Read (User Profiles)',
        status: data && data.length > 0 ? 'success' : 'warning',
        message: data && data.length > 0 ? 'Successfully read from DB' : 'Read successful but returned 0 rows (Check RLS)',
        details: data,
      };
    } catch (err: any) {
      return {
        id: 'db-read',
        name: 'DB Read Test',
        status: 'error',
        message: err.message || 'Failed to read from database',
      };
    }
  },

  /**
   * Test Supabase database connection (Businesses fetching).
   */
  async testBusinessesSupabase(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.from('businesses').select('id').limit(1);
      const duration = Date.now() - startTime;

      if (error) throw error;

      return {
        id: 'supabase-businesses',
        name: 'Businesses Supabase Fetch',
        status: 'success',
        message: `Direct Supabase fetch successful in ${duration}ms`,
        details: data,
      };
    } catch (err: any) {
      return {
        id: 'supabase-businesses',
        name: 'Businesses Supabase Fetch',
        status: 'error',
        message: err.message || 'Supabase request failed',
      };
    }
  },

  /**
   * Verify persistence after app restart (simulated).
   */
  async verifyPersistence(): Promise<HealthCheckResult> {
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      id: 'persistence',
      name: 'Session Persistence',
      status: session ? 'success' : 'warning',
      message: session ? 'Session persisted in SecureStore' : 'No persisted session found',
    };
  },

  /**
   * Test database write operation (Update own profile).
   */
  async testDatabaseWrite(): Promise<HealthCheckResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth required for DB write test');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const originalName = profile?.full_name || 'User';
      const testName = `${originalName} (Verified)`;

      const { error: updateError, status } = await supabase
        .from('profiles')
        .update({ full_name: testName })
        .eq('id', user.id);

      if (updateError) {
        if (status === 403 || updateError.code === '42501') {
          return {
            id: 'db-write',
            name: 'DB Write (Update Profile)',
            status: 'error',
            message: 'RLS Policy Violation: Cannot update profile.',
            details: updateError,
          };
        }
        throw updateError;
      }

      await supabase
        .from('profiles')
        .update({ full_name: originalName })
        .eq('id', user.id);

      return {
        id: 'db-write',
        name: 'DB Write (Update Profile)',
        status: 'success',
        message: 'Database write (update) verified successfully.',
      };
    } catch (err: any) {
      return {
        id: 'db-write',
        name: 'DB Write Test',
        status: 'error',
        message: err.message || 'Failed to write to database',
      };
    }
  }
};

