'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentLocation, watchLocation, stopWatchingLocation, Location, GeolocationError } from '@/lib/geolocation';
import { useToast } from './ToastContext';

interface LocationContextType {
  location: Location | null;
  isLoading: boolean;
  error: GeolocationError | null;
  hasPermission: boolean;
  requestLocation: () => Promise<void>;
  startWatching: () => void;
  stopWatching: () => void;
  isWatching: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const toast = useToast();

  // Check if we have a stored location
  useEffect(() => {
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        // Check if location is not too old (1 hour)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          setLocation(parsed);
          setHasPermission(true);
        }
      } catch (e) {
        console.error('Error parsing stored location:', e);
      }
    }
  }, []);

  const requestLocation = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      setHasPermission(true);
      
      // Store location
      localStorage.setItem('userLocation', JSON.stringify(currentLocation));
      
      console.log('Location obtained:', currentLocation);
    } catch (err) {
      const locationError = err as GeolocationError;
      setError(locationError);
      setHasPermission(false);
      
      // Show user-friendly error messages
      switch (locationError.code) {
        case 1: // PERMISSION_DENIED
          toast.error('Location access denied. Please enable location permissions in your browser settings.');
          break;
        case 2: // POSITION_UNAVAILABLE
          toast.error('Location information is unavailable. Please try again.');
          break;
        case 3: // TIMEOUT
          toast.error('Location request timed out. Please try again.');
          break;
        default:
          toast.error('Failed to get your location. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startWatching = () => {
    if (isWatching || !hasPermission) return;

    const id = watchLocation(
      (newLocation) => {
        setLocation(newLocation);
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        console.log('Location updated:', newLocation);
      },
      (err) => {
        setError(err);
        toast.error('Failed to track location changes.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );

    if (id !== null) {
      setWatchId(id);
      setIsWatching(true);
      console.log('Started watching location');
    }
  };

  const stopWatching = () => {
    if (watchId !== null) {
      stopWatchingLocation(watchId);
      setWatchId(null);
      setIsWatching(false);
      console.log('Stopped watching location');
    }
  };

  // Auto-request location on mount - always ask for fresh location
  useEffect(() => {
    if (!location && !isLoading) {
      // Always try to get location when app opens
      requestLocation();
    }
  }, []);

  // Re-request location when app becomes visible (user switches back to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isLoading) {
        // App became visible, refresh location
        requestLocation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        stopWatchingLocation(watchId);
      }
    };
  }, [watchId]);

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    hasPermission,
    requestLocation,
    startWatching,
    stopWatching,
    isWatching
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

// Helper hook for getting location with auto-request
export function useLocationWithRequest() {
  const location = useLocation();
  
  useEffect(() => {
    if (!location.location && !location.isLoading && !location.error) {
      location.requestLocation();
    }
  }, [location]);
  
  return location;
}