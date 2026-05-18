import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CONFIG } from '@/constants/config';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';

/**
 * Custom type for Axios instance where responses are already unwrapped by interceptors.
 * This ensures TypeScript knows we are receiving the data directly, not the AxiosResponse object.
 */
export interface UnwrappedAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete' | 'request'> {
  get<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  request<T = any, R = T, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
}

/**
 * Custom Axios instance for Next.js backend communication.
 * Automatically handles baseURL and Auth headers.
 */
const instance = axios.create({
  baseURL: CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

const apiClient = instance as unknown as UnwrappedAxiosInstance;

// Request Interceptor: Attach Supabase JWT Token and Traceability Headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 1. Attach Auth Token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. Attach Traceability Headers (Matching Web App validation, must be a valid UUID)
      const requestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      config.headers['x-request-id'] = requestId;

      if (CONFIG.IS_DEV) {
        logger.info(LogTag.API, `[Axios] Request: ${config.method?.toUpperCase()} ${config.url}`, {
          requestId,
          params: config.params,
          headers: { ...config.headers, Authorization: token ? 'Bearer [HIDDEN]' : 'None' }
        });
      }
    } catch (error) {
      logger.error(LogTag.API, '[Axios] Request Interceptor Error', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling & Data Unwrapping
apiClient.interceptors.response.use(
  (response) => {
    if (CONFIG.IS_DEV) {
      logger.info(LogTag.API, `[Axios] Response ${response.status} from ${response.config.url}`);
    }

    // Automatically unwrap the standardized { success, data } structure
    // This allows services to work directly with the business data
    const responseData = response.data;
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      if (responseData.success) {
        // If data field exists, return it, otherwise return the whole object (excluding success/message if needed, but safe to return all)
        const result = responseData.data !== undefined ? responseData.data : responseData;
        
        if (CONFIG.IS_DEV) {
          logger.info(LogTag.API, `[Axios] ✅ Unwrapped data from ${response.config.url}`, {
            isUnwrapped: responseData.data !== undefined,
            type: Array.isArray(result) ? 'array' : typeof result
          });
        }
        return result;
      } else {
        // Handle cases where status is 200 but success is false
        const error = new Error(responseData.error || responseData.message || 'API operation failed');
        (error as any).status = response.status;
        (error as any).data = responseData;
        return Promise.reject(error);
      }
    }

    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    
    // Extract error message from backend's standardized errorResponse
    const message = responseData?.error || responseData?.message || error.message;

    logger.error(LogTag.API, `[Axios] ${status || 'Network'} Error: ${message}`, {
      url: error.config?.url,
      method: error.config?.method,
      responseData,
    });

    // Auto-logout / Clear stale session on 401 Unauthorized or 403 Forbidden
    if (status === 401 || status === 403) {
      logger.info(LogTag.AUTH, `[Axios] Status ${status} received. Initiating session cleanup.`);
      
      // Fire-and-forget signout from Supabase to clear any SDK-cached tokens/sessions
      import('@/lib/supabase')
        .then(({ supabase }) => {
          supabase.auth.signOut().catch(() => {});
        })
        .catch(() => {});

      // Clear the Zustand auth store session (clears secure store and resets layout)
      useAuthStore.getState().clearSession();
    }

    const enhancedError = new Error(message);
    (enhancedError as any).status = status;
    (enhancedError as any).data = responseData;
    (enhancedError as any).isNetworkError = !status;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
