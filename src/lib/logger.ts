import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  meta?: any;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'app.log');
    this.ensureLogDirectory();
    this.loadLogsFromFile();
  }

  private ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private loadLogsFromFile() {
    try {
      if (fs.existsSync(this.logFile)) {
        const fileContent = fs.readFileSync(this.logFile, 'utf-8');
        const lines = fileContent.trim().split('\n').filter(line => line);
        
        this.logs = lines.slice(-this.maxLogs).map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean);
      }
    } catch (error) {
      console.error('Error loading logs from file:', error);
    }
  }

  private writeToFile(logEntry: LogEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  private addLog(level: LogLevel, message: string, meta?: any) {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      meta,
    };

    // Add to memory
    this.logs.push(logEntry);
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Write to file
    this.writeToFile(logEntry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const levelName = LogLevel[level];
      console.log(`[${levelName}] ${message}`, meta ? meta : '');
    }

    return logEntry;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Public logging methods
  error(message: string, meta?: any, error?: Error): LogEntry {
    const logMeta = { ...meta };
    if (error) {
      logMeta.stack = error.stack;
      logMeta.name = error.name;
    }
    return this.addLog(LogLevel.ERROR, message, logMeta);
  }

  warn(message: string, meta?: any): LogEntry {
    return this.addLog(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any): LogEntry {
    return this.addLog(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any): LogEntry {
    return this.addLog(LogLevel.DEBUG, message, meta);
  }

  // API request logging
  apiRequest(req: any, res: any, responseTime: number): LogEntry {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO,
      message: `${req.method} ${req.url}`,
      endpoint: req.url,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'],
      userId: req.user?.id,
    };

    this.logs.push(logEntry);
    this.writeToFile(logEntry);
    
    return logEntry;
  }

  // Get logs with filtering
  getLogs(options: {
    level?: LogLevel;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    endpoint?: string;
  } = {}): { logs: LogEntry[], total: number } {
    let filteredLogs = [...this.logs];

    // Filter by level
    if (options.level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level <= options.level!);
    }

    // Filter by date range
    if (options.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endDate!);
    }

    // Filter by user
    if (options.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === options.userId);
    }

    // Filter by endpoint
    if (options.endpoint) {
      filteredLogs = filteredLogs.filter(log => 
        log.endpoint?.includes(options.endpoint!)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filteredLogs.length;
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    
    return {
      logs: filteredLogs.slice(offset, offset + limit),
      total
    };
  }

  // Get log statistics
  getStats(): {
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
    last24Hours: number;
    topEndpoints: { endpoint: string; count: number }[];
    topErrors: { message: string; count: number }[];
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(log => log.level === LogLevel.ERROR).length,
      warnCount: this.logs.filter(log => log.level === LogLevel.WARN).length,
      infoCount: this.logs.filter(log => log.level === LogLevel.INFO).length,
      debugCount: this.logs.filter(log => log.level === LogLevel.DEBUG).length,
      last24Hours: this.logs.filter(log => log.timestamp >= last24Hours).length,
      topEndpoints: [] as { endpoint: string; count: number }[],
      topErrors: [] as { message: string; count: number }[],
    };

    // Calculate top endpoints
    const endpointCounts: { [key: string]: number } = {};
    this.logs.forEach(log => {
      if (log.endpoint) {
        endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
      }
    });

    stats.topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate top errors
    const errorCounts: { [key: string]: number } = {};
    this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .forEach(log => {
        errorCounts[log.message] = (errorCounts[log.message] || 0) + 1;
      });

    stats.topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  // Clear old logs
  clearOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const beforeCount = this.logs.length;
    
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    
    const removedCount = beforeCount - this.logs.length;
    this.info(`Cleared ${removedCount} old log entries`, { daysToKeep });
    
    return removedCount;
  }
}

// Create singleton instance
const logger = new Logger();
export default logger;