import { supabase } from '@/lib/supabase';
import { logger, LogTag } from '@/utils/logger';

export async function checkSupabaseHealth(): Promise<{
  status: 'success' | 'error';
  message: string;
  details?: unknown;
}> {
  try {
    const start = Date.now();
    const { data, error } = await supabase.auth.getSession();
    const duration = Date.now() - start;

    if (error) {
      return {
        status: 'error',
        message: `Supabase auth error: ${error.message}`,
        details: error,
      };
    }

    return {
      status: 'success',
      message: `Supabase reachable (${duration}ms)${data.session ? ', session active' : ', no session'}`,
      details: { hasSession: Boolean(data.session) },
    };
  } catch (err) {
    logger.error(LogTag.API, 'checkSupabaseHealth failed', err);
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Supabase health check failed',
      details: err,
    };
  }
}
