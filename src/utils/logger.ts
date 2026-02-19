/**
 * Centralized logging utility for production-safe logging
 * Prevents console.log in production, provides structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Only output to console in development
    if (this.isDevelopment) {
      const style = this.getStyle(level);
      console[level === 'debug' ? 'log' : level](
        `%c[${level.toUpperCase()}] ${message}`,
        style,
        data ?? ''
      );
    }

    // In production, only log errors to potential error tracking service
    if (!this.isDevelopment && level === 'error') {
      // Could integrate with Sentry, LogRocket, etc.
      this.reportError(message, data);
    }
  }

  private getStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280',
      info: 'color: #3B82F6',
      warn: 'color: #F59E0B; font-weight: bold',
      error: 'color: #EF4444; font-weight: bold',
    };
    return styles[level];
  }

  private reportError(message: string, data?: unknown) {
    // Placeholder for error reporting service integration
    // e.g., Sentry.captureException(new Error(message), { extra: data });
  }

  public debug(message: string, data?: unknown) {
    this.log('debug', message, data);
  }

  public info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: unknown) {
    this.log('error', message, data);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }

  // Medical-specific logging
  public medicalEvent(event: string, data?: unknown) {
    this.info(`[MEDICAL] ${event}`, data);
  }

  public sessionEvent(event: string, data?: unknown) {
    this.debug(`[SESSION] ${event}`, data);
  }

  public timerEvent(event: string, data?: unknown) {
    this.debug(`[TIMER] ${event}`, data);
  }
}

export const logger = new Logger();
