/**
 * Production-grade logging utility for CusOwn-Mobile.
 * Provides consistent formatting and tagging for console logs.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogTag {
  AUTH = 'AUTH',
  DB = 'DATABASE',
  API = 'API',
  STORE = 'STORE',
  QUERY = 'QUERY',
  PUSH = 'PUSH',
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, tag: LogTag, message: string) {
    const timestamp = new Date().toISOString().split('T')[1].split('Z')[0];
    return `[${timestamp}] [${level}] [${tag}] ${message}`;
  }

  debug(tag: LogTag, message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, tag, message), data || '');
    }
  }

  info(tag: LogTag, message: string, data?: unknown) {
    console.log(this.formatMessage(LogLevel.INFO, tag, message), data || '');
  }

  warn(tag: LogTag, message: string, data?: unknown) {
    console.log(this.formatMessage(LogLevel.WARN, tag, message), data || '');
  }

  error(tag: LogTag, message: string, data?: unknown) {
    console.error(this.formatMessage(LogLevel.ERROR, tag, message), data || '');
  }

  /**
   * Specifically for auditing API responses and identifying potential RLS issues.
   */
  auditResponse(
    url: string,
    response: { data?: unknown; status?: number } | null | undefined,
    error?: { response?: { status?: number; data?: unknown }; message?: string } | null | undefined,
  ) {
    if (error) {
      this.error(LogTag.API, `❌ FAILED: ${url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.status === 403 || error.response?.status === 401) {
        this.warn(LogTag.DB, `Potential RLS/Auth issue detected for ${url}`);
      }
    } else {
      const rowCount = Array.isArray(response?.data)
        ? response.data.length
        : response?.data
          ? 1
          : 0;
      this.info(LogTag.API, `✅ SUCCESS: ${url}`, {
        status: response?.status,
        rowCount,
      });

      if (rowCount === 0 && (url.includes('select') || url.includes('list'))) {
        this.warn(
          LogTag.DB,
          `Empty result set returned for ${url}. Check RLS policies if data was expected.`,
        );
      }
    }
  }
}

export const logger = new Logger();
