'use client';

import { useLocation } from '@/contexts/LocationContext';
import { useEffect, useState } from 'react';

interface LocationPermissionProps {
  onLocationGranted?: () => void;
  showAlways?: boolean;
}

export default function LocationPermission({ onLocationGranted, showAlways = false }: LocationPermissionProps) {
  const { location, isLoading, error, hasPermission, requestLocation } = useLocation();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  useEffect(() => {
    // Check if we need to show permission dialog
    if (!hasPermission && !isLoading && !location) {
      setShowPermissionDialog(true);
    } else if (hasPermission && location && onLocationGranted) {
      onLocationGranted();
      setShowPermissionDialog(false);
    }
  }, [hasPermission, isLoading, location, onLocationGranted]);

  const handleRequestLocation = async () => {
    await requestLocation();
  };

  // Show permission dialog or location status
  if (showPermissionDialog || showAlways) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          {!hasPermission && !location ? (
            // Permission needed
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Location Access Required
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                mounkidh needs your location to find nearby blood requests and donors. 
                Your location is only used for emergency matching and is never stored permanently.
              </p>
              <div style={{ 
                background: 'rgba(220, 38, 38, 0.1)',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                  Why we need location:
                </h4>
                <ul style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  textAlign: 'left',
                  listStyle: 'none',
                  padding: 0
                }}>
                  <li style={{ marginBottom: '0.25rem' }}>• Find blood requests near you</li>
                  <li style={{ marginBottom: '0.25rem' }}>• Connect with nearby donors</li>
                  <li style={{ marginBottom: '0.25rem' }}>• Calculate hospital distances</li>
                  <li>• Enable emergency notifications</li>
                </ul>
              </div>
              <button
                onClick={handleRequestLocation}
                disabled={isLoading}
                className="btn"
                style={{
                  width: '100%',
                  background: 'var(--danger)',
                  color: 'white',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  opacity: isLoading ? '0.5' : '1',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Getting Location...
                  </div>
                ) : (
                  'Allow Location Access'
                )}
              </button>
            </>
          ) : error ? (
            // Error state
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--danger)' }}>
                Location Access Denied
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {error.code === 1 ? 
                  'Location access was denied. Please enable location permissions in your browser settings.' :
                  'Unable to get your location. Please try again or check your connection.'
                }
              </p>
              <button
                onClick={handleRequestLocation}
                className="btn btn-outline"
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                Try Again
              </button>
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="btn"
                style={{ 
                  width: '100%',
                  background: 'var(--text-secondary)',
                  color: 'white'
                }}
              >
                Continue Without Location
              </button>
            </>
          ) : (
            // Success state
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--success)' }}>
                Location Access Granted
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Your location: {location?.address || 'Current Location'}
              </p>
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="btn"
                style={{ 
                  width: '100%',
                  background: 'var(--success)',
                  color: 'white'
                }}
              >
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}