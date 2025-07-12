'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { findNearbyHospitals, getAddressFromCoordinates, formatDistance } from '@/lib/geolocation';

interface LocationPickerProps {
  onLocationSelect: (location: { 
    name: string; 
    address: string; 
    coordinates: { lat: number; lng: number } 
  }) => void;
  type?: 'hospital' | 'custom';
  disabled?: boolean;
  placeholder?: string;
  currentLocation?: { lat: number; lng: number };
}

export default function LocationPicker({ 
  onLocationSelect, 
  type = 'hospital',
  disabled = false,
  placeholder = 'Select location',
  currentLocation
}: LocationPickerProps) {
  const { location, requestLocation, isLoading: locationLoading } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Auto-load nearby hospitals when location is available
  useEffect(() => {
    if (type === 'hospital' && (location || currentLocation)) {
      loadNearbyHospitals();
    }
  }, [location, currentLocation, type]);

  const loadNearbyHospitals = async () => {
    const coords = currentLocation || location;
    if (!coords) return;

    setIsLoading(true);
    try {
      const hospitals = await findNearbyHospitals(coords.lat, coords.lng, 10000); // 10km radius
      setSuggestions(hospitals);
    } catch (error) {
      console.error('Failed to load nearby hospitals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationRequest = async () => {
    if (!location) {
      await requestLocation();
    }
  };

  const handleLocationSelect = (selectedLoc: any) => {
    setSelectedLocation(selectedLoc);
    setSearchTerm(selectedLoc.name);
    setShowSuggestions(false);
    onLocationSelect({
      name: selectedLoc.name,
      address: selectedLoc.address,
      coordinates: selectedLoc.coordinates
    });
  };

  const handleCurrentLocationSelect = async () => {
    const coords = currentLocation || location;
    if (!coords) return;

    setIsLoading(true);
    try {
      const address = await getAddressFromCoordinates(coords.lat, coords.lng);
      const locationData = {
        name: 'Current Location',
        address,
        coordinates: coords
      };
      
      setSelectedLocation(locationData);
      setSearchTerm('Current Location');
      setShowSuggestions(false);
      onLocationSelect(locationData);
    } catch (error) {
      console.error('Failed to get current location address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="input"
          style={{ flex: 1 }}
        />
        
        {!location && (
          <button
            type="button"
            onClick={handleLocationRequest}
            disabled={locationLoading || disabled}
            className="btn btn-outline"
            style={{
              padding: '0.5rem',
              minWidth: 'auto',
              opacity: locationLoading ? '0.5' : '1'
            }}
          >
            {locationLoading ? '...' : '📍'}
          </button>
        )}
      </div>

      {showSuggestions && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          marginTop: '0.25rem'
        }}>
          {isLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid transparent',
                borderTop: '2px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Loading nearby {type === 'hospital' ? 'hospitals' : 'locations'}...
              </p>
            </div>
          ) : (
            <>
              {/* Current Location Option */}
              {(location || currentLocation) && (
                <button
                  type="button"
                  onClick={handleCurrentLocationSelect}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>📍</span>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--primary)' }}>
                      Use Current Location
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
                    </div>
                  </div>
                </button>
              )}

              {/* Suggestions */}
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleLocationSelect(suggestion)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: index < filteredSuggestions.length - 1 ? '1px solid var(--border-light)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {suggestion.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {suggestion.address}
                        </div>
                        {suggestion.rating && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            ⭐ {suggestion.rating}
                          </div>
                        )}
                      </div>
                      {suggestion.distance && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {formatDistance(suggestion.distance)}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : searchTerm && !isLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No {type === 'hospital' ? 'hospitals' : 'locations'} found matching "{searchTerm}"
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showSuggestions && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}