import mongoose from 'mongoose';
import logger from './logger';

export interface SystemMetrics {
  timestamp: Date;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  database: {
    connected: boolean;
    connections: number;
    queryTime?: number;
  };
  api: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeConnections: number;
  };
  application: {
    uptime: number;
    version: string;
    environment: string;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    memory: boolean;
    api: boolean;
  };
  timestamp: Date;
}

class MonitoringService {
  private metrics: SystemMetrics[] = [];
  private maxMetrics = 1440; // Keep 24 hours of metrics (1 per minute)
  private startTime = Date.now();
  private requestCounts: { [minute: string]: number } = {};
  private responseTimes: number[] = [];

  constructor() {
    // Start collecting metrics every minute
    setInterval(() => {
      this.collectMetrics();
    }, 60000);

    // Initial metrics collection
    this.collectMetrics();
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        memory: this.getMemoryUsage(),
        database: await this.getDatabaseMetrics(),
        api: this.getApiMetrics(),
        application: this.getApplicationMetrics(),
      };

      this.metrics.push(metrics);
      
      // Keep only recent metrics
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(-this.maxMetrics);
      }

      // Log high memory usage
      if (metrics.memory.percentage > 80) {
        logger.warn('High memory usage detected', { 
          memoryUsage: `${metrics.memory.percentage}%` 
        });
      }

      // Log database connection issues
      if (!metrics.database.connected) {
        logger.error('Database connection lost');
      }

    } catch (error) {
      logger.error('Error collecting metrics', { error: error.message }, error);
    }
  }

  private getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const total = memUsage.heapTotal;
    const used = memUsage.heapUsed;
    const free = total - used;

    return {
      used: Math.round(used / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage: Math.round((used / total) * 100),
    };
  }

  private async getDatabaseMetrics() {
    try {
      const connected = mongoose.connection.readyState === 1;
      let connections = 0;
      let queryTime;

      if (connected) {
        // Test query performance
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        queryTime = Date.now() - start;

        // Get connection count (approximation)
        connections = mongoose.connections.length;
      }

      return {
        connected,
        connections,
        queryTime,
      };
    } catch (error) {
      return {
        connected: false,
        connections: 0,
      };
    }
  }

  private getApiMetrics() {
    const now = new Date();
    const currentMinute = `${now.getHours()}:${now.getMinutes()}`;
    
    // Calculate error rate from recent logs
    const recentLogs = logger.getLogs({
      startDate: new Date(now.getTime() - 5 * 60 * 1000), // Last 5 minutes
      limit: 1000
    });

    const totalRequests = recentLogs.logs.filter(log => log.endpoint).length;
    const errorRequests = recentLogs.logs.filter(log => 
      log.endpoint && log.statusCode && log.statusCode >= 400
    ).length;

    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    // Calculate average response time
    const apiLogs = recentLogs.logs.filter(log => log.responseTime);
    const avgResponseTime = apiLogs.length > 0 
      ? apiLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / apiLogs.length
      : 0;

    return {
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      activeConnections: 1, // Simplified for single instance
    };
  }

  private getApplicationMetrics() {
    return {
      uptime: Math.round((Date.now() - this.startTime) / 1000), // seconds
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  // Record API request for metrics
  recordApiRequest(responseTime: number, statusCode: number) {
    this.responseTimes.push(responseTime);
    
    // Keep only recent response times (last 1000 requests)
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    const now = new Date();
    const minute = `${now.getHours()}:${now.getMinutes()}`;
    this.requestCounts[minute] = (this.requestCounts[minute] || 0) + 1;
  }

  // Get current metrics
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  // Get metrics history
  getMetrics(hours = 24): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  // Perform health check
  async performHealthCheck(): Promise<HealthCheck> {
    const current = this.getCurrentMetrics();
    
    const checks = {
      database: current?.database.connected || false,
      memory: current?.memory.percentage < 90,
      api: current?.api.errorRate < 10, // Less than 10% error rate
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    
    if (healthyChecks === 0) {
      status = 'unhealthy';
    } else if (healthyChecks < Object.keys(checks).length) {
      status = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status,
      checks,
      timestamp: new Date(),
    };

    // Log health check results
    if (status !== 'healthy') {
      logger.warn(`System health check: ${status}`, { checks });
    }

    return healthCheck;
  }

  // Get performance statistics
  getPerformanceStats() {
    const current = this.getCurrentMetrics();
    const last24h = this.getMetrics(24);
    
    if (!current || last24h.length === 0) {
      return null;
    }

    // Calculate averages over 24h
    const avgMemory = last24h.reduce((sum, m) => sum + m.memory.percentage, 0) / last24h.length;
    const avgResponseTime = last24h.reduce((sum, m) => sum + m.api.averageResponseTime, 0) / last24h.length;
    const avgErrorRate = last24h.reduce((sum, m) => sum + m.api.errorRate, 0) / last24h.length;

    return {
      current: {
        memory: current.memory.percentage,
        responseTime: current.api.averageResponseTime,
        errorRate: current.api.errorRate,
        uptime: current.application.uptime,
      },
      averages24h: {
        memory: Math.round(avgMemory * 100) / 100,
        responseTime: Math.round(avgResponseTime * 100) / 100,
        errorRate: Math.round(avgErrorRate * 100) / 100,
      },
      trends: {
        memoryTrend: this.calculateTrend(last24h.map(m => m.memory.percentage)),
        responseTimeTrend: this.calculateTrend(last24h.map(m => m.api.averageResponseTime)),
        errorRateTrend: this.calculateTrend(last24h.map(m => m.api.errorRate)),
      }
    };
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-6); // Last 6 data points
    const earlier = values.slice(-12, -6); // Previous 6 data points
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  // Get alerts based on current metrics
  getAlerts(): Array<{ type: 'warning' | 'error'; message: string; timestamp: Date }> {
    const current = this.getCurrentMetrics();
    const alerts: Array<{ type: 'warning' | 'error'; message: string; timestamp: Date }> = [];
    
    if (!current) return alerts;

    // Memory alerts
    if (current.memory.percentage > 90) {
      alerts.push({
        type: 'error',
        message: `Critical memory usage: ${current.memory.percentage}%`,
        timestamp: current.timestamp,
      });
    } else if (current.memory.percentage > 80) {
      alerts.push({
        type: 'warning',
        message: `High memory usage: ${current.memory.percentage}%`,
        timestamp: current.timestamp,
      });
    }

    // Database alerts
    if (!current.database.connected) {
      alerts.push({
        type: 'error',
        message: 'Database connection lost',
        timestamp: current.timestamp,
      });
    }

    // API alerts
    if (current.api.errorRate > 20) {
      alerts.push({
        type: 'error',
        message: `High error rate: ${current.api.errorRate}%`,
        timestamp: current.timestamp,
      });
    } else if (current.api.errorRate > 10) {
      alerts.push({
        type: 'warning',
        message: `Elevated error rate: ${current.api.errorRate}%`,
        timestamp: current.timestamp,
      });
    }

    // Response time alerts
    if (current.api.averageResponseTime > 2000) {
      alerts.push({
        type: 'warning',
        message: `Slow response time: ${current.api.averageResponseTime}ms`,
        timestamp: current.timestamp,
      });
    }

    return alerts;
  }
}

// Create singleton instance
const monitoring = new MonitoringService();
export default monitoring;