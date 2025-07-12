'use client';

import { useLocation } from '@/contexts/LocationContext';
import { useState } from 'react';

interface LocationStatusProps {
  compact?: boolean;
}

export default function LocationStatus({ compact = false }: LocationStatusProps) {
  const { location, isLoading, error, hasPermission, requestLocation, startWatching, stopWatching, isWatching } = useLocation();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    if (error) return 'var(--danger)';
    if (isLoading) return 'var(--warning)';
    if (location) return 'var(--success)';
    return 'var(--text-secondary)';
  };

  const getStatusText = () => {
    if (error) return 'Location Error';
    if (isLoading) return 'Getting Location...';
    if (location) return location.address || 'Current Location';
    return 'Location Access Needed';
  };

  const getStatusIcon = () => {
    if (error) return '⚠️';
    if (isLoading) return '⏳';
    if (location) return '📍';
    return '❌';
  };

  if (compact) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: `${getStatusColor()}20`,
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          color: getStatusColor(),
          cursor: 'pointer'
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{getStatusIcon()}</span>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Location Status
            </h4>
            <p style={{ fontSize: '0.75rem', color: getStatusColor(), margin: 0 }}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!location && !isLoading && (
            <button
              onClick={requestLocation}
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Get Location
            </button>
          )}
          
          {location && !isWatching && (
            <button
              onClick={startWatching}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Track Location
            </button>
          )}
          
          {location && isWatching && (
            <button
              onClick={stopWatching}
              className="btn"
              style={{ 
                fontSize: '0.75rem', 
                padding: '0.5rem 0.75rem',
                background: 'var(--warning)',
                color: 'white'
              }}
            >
              Stop Tracking
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          background: 'var(--surface)',
          padding: '0.75rem',
          borderRadius: '0.5rem'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Permission:</strong> {hasPermission ? 'Granted' : 'Denied'}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Watching:</strong> {isWatching ? 'Active' : 'Inactive'}
          </p>
          {location && (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
          {error && (
            <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>
              <strong>Error:</strong> {error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}