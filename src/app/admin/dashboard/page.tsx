'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/Layout/MobileHeader';

interface LogStats {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  last24Hours: number;
  topEndpoints: { endpoint: string; count: number }[];
  topErrors: { message: string; count: number }[];
}

interface SystemMetrics {
  timestamp: string;
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

interface PerformanceStats {
  current: {
    memory: number;
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  averages24h: {
    memory: number;
    responseTime: number;
    errorRate: number;
  };
  trends: {
    memoryTrend: 'up' | 'down' | 'stable';
    responseTimeTrend: 'up' | 'down' | 'stable';
    errorRateTrend: 'up' | 'down' | 'stable';
  };
}

interface Alert {
  type: 'warning' | 'error';
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'performance' | 'alerts'>('overview');
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple admin check (in production, implement proper role-based access)
  useEffect(() => {
    if (!user || user.phoneNumber !== '+22200000000') { // Admin phone number
      router.push('/');
      return;
    }
    
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [logStatsRes, metricsRes, performanceRes, alertsRes, logsRes] = await Promise.all([
        fetch('/api/admin/logs/stats'),
        fetch('/api/admin/monitoring?type=current'),
        fetch('/api/admin/monitoring?type=performance'),
        fetch('/api/admin/monitoring?type=alerts'),
        fetch('/api/admin/logs?limit=20'),
      ]);

      if (logStatsRes.ok) {
        const data = await logStatsRes.json();
        setLogStats(data.data);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setSystemMetrics(data.data);
      }

      if (performanceRes.ok) {
        const data = await performanceRes.json();
        setPerformanceStats(data.data);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.data);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatLogLevel = (level: number) => {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    return levels[level] || 'UNKNOWN';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  if (!user || user.phoneNumber !== '+22200000000') {
    return null;
  }

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <MobileHeader
        title="Admin Dashboard"
        subtitle="System Monitoring & Logs"
        showBack={true}
        onBack={() => router.push('/')}
      />
      
      <div style={{ paddingTop: '64px', padding: '1rem' }}>
        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}>
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'logs', label: 'Logs', icon: '📝' },
            { key: 'performance', label: 'Performance', icon: '⚡' },
            { key: 'alerts', label: 'Alerts', icon: '🚨' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === tab.key ? 'var(--primary)' : 'white',
                color: activeTab === tab.key ? 'white' : 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Loading dashboard data...</div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && !loading && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* System Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {systemMetrics && (
                <>
                  <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {systemMetrics.database.connected ? '✅' : '❌'}
                    </div>
                    <div style={{ fontWeight: '600' }}>Database</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {systemMetrics.database.connected ? 'Connected' : 'Disconnected'}
                    </div>
                    {systemMetrics.database.queryTime && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {systemMetrics.database.queryTime}ms ping
                      </div>
                    )}
                  </div>

                  <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {systemMetrics.memory.percentage > 80 ? '⚠️' : '💾'}
                    </div>
                    <div style={{ fontWeight: '600' }}>Memory</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {systemMetrics.memory.percentage}% used
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {systemMetrics.memory.used}MB / {systemMetrics.memory.total}MB
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
                    <div style={{ fontWeight: '600' }}>Uptime</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {formatUptime(systemMetrics.application.uptime)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {systemMetrics.application.environment}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {systemMetrics.api.errorRate > 10 ? '🔴' : '🟢'}
                    </div>
                    <div style={{ fontWeight: '600' }}>API Health</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {systemMetrics.api.errorRate.toFixed(1)}% errors
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {systemMetrics.api.averageResponseTime.toFixed(0)}ms avg
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Log Statistics */}
            {logStats && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                  📝 Log Statistics (Last 24h)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                      {logStats.errorCount}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Errors</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                      {logStats.warnCount}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Warnings</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {logStats.infoCount}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Info</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                      {logStats.last24Hours}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total 24h</div>
                  </div>
                </div>

                {logStats.topEndpoints.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Top API Endpoints
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {logStats.topEndpoints.slice(0, 5).map((endpoint, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.5rem',
                            background: 'var(--surface)',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', flex: 1 }}>{endpoint.endpoint}</span>
                          <span style={{ fontWeight: '600' }}>{endpoint.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && !loading && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
              📝 Recent Logs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem',
                    background: log.level === 0 ? 'rgba(220, 38, 38, 0.1)' : 
                                log.level === 1 ? 'rgba(245, 158, 11, 0.1)' : 
                                'var(--surface)',
                    borderRadius: '0.25rem',
                    borderLeft: `3px solid ${
                      log.level === 0 ? 'var(--danger)' : 
                      log.level === 1 ? 'var(--warning)' : 
                      'var(--primary)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: log.level === 0 ? 'var(--danger)' : 
                             log.level === 1 ? 'var(--warning)' : 
                             'var(--primary)'
                    }}>
                      {formatLogLevel(log.level)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                    {log.message}
                  </div>
                  {log.endpoint && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {log.method} {log.endpoint} 
                      {log.statusCode && ` → ${log.statusCode}`}
                      {log.responseTime && ` (${log.responseTime}ms)`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && !loading && performanceStats && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                ⚡ Performance Metrics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Memory Usage {getTrendIcon(performanceStats.trends.memoryTrend)}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {performanceStats.current.memory}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    24h avg: {performanceStats.averages24h.memory}%
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Response Time {getTrendIcon(performanceStats.trends.responseTimeTrend)}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {performanceStats.current.responseTime.toFixed(0)}ms
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    24h avg: {performanceStats.averages24h.responseTime.toFixed(0)}ms
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Error Rate {getTrendIcon(performanceStats.trends.errorRateTrend)}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {performanceStats.current.errorRate.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    24h avg: {performanceStats.averages24h.errorRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && !loading && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
              🚨 Active Alerts
            </h3>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <div>No active alerts - system running smoothly!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      background: alert.type === 'error' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '0.5rem',
                      borderLeft: `4px solid ${alert.type === 'error' ? 'var(--danger)' : 'var(--warning)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: alert.type === 'error' ? 'var(--danger)' : 'var(--warning)',
                          marginBottom: '0.25rem'
                        }}>
                          {alert.type === 'error' ? '🔴 ERROR' : '🟡 WARNING'}
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>{alert.message}</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--primary)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
}