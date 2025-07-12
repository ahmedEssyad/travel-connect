'use client';

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Default options for geolocation
const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 seconds
  maximumAge: 300000 // 5 minutes
};

/**
 * Get current user location
 */
export function getCurrentLocation(options: GeolocationOptions = {}): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let message = 'Unknown error occurred.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        
        reject({
          code: error.code,
          message
        });
      },
      opts
    );
  });
}

/**
 * Watch user location changes
 */
export function watchLocation(
  onLocationUpdate: (location: Location) => void,
  onError: (error: GeolocationError) => void,
  options: GeolocationOptions = {}
): number | null {
  if (!navigator.geolocation) {
    onError({
      code: 0,
      message: 'Geolocation is not supported by this browser.'
    });
    return null;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
    },
    (error) => {
      let message = 'Unknown error occurred.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied by user.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out.';
          break;
      }
      
      onError({
        code: error.code,
        message
      });
    },
    opts
  );
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Check if geolocation is available
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<PermissionState> {
  if (!navigator.permissions) {
    throw new Error('Permissions API not supported');
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    throw new Error('Failed to query geolocation permission');
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get formatted address from coordinates (requires Google Maps API)
 */
export async function getAddressFromCoordinates(
  lat: number, 
  lng: number
): Promise<string> {
  try {
    // Using Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      throw new Error('No address found for coordinates');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Get coordinates from address (requires Google Maps API)
 */
export async function getCoordinatesFromAddress(
  address: string
): Promise<Location> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        timestamp: Date.now()
      };
    } else {
      throw new Error('No coordinates found for address');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to get coordinates from address');
  }
}

/**
 * Find nearby hospitals using Google Places API
 */
export async function findNearbyHospitals(
  lat: number, 
  lng: number, 
  radius: number = 5000
): Promise<any[]> {
  try {
    const response = await fetch(
      `/api/hospitals/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.results.map((hospital: any) => ({
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        coordinates: {
          lat: hospital.coordinates.lat,
          lng: hospital.coordinates.lng
        },
        rating: hospital.rating,
        phone: hospital.phone,
        distance: calculateDistance(
          lat, lng,
          hospital.coordinates.lat,
          hospital.coordinates.lng
        )
      })).sort((a, b) => a.distance - b.distance);
    } else {
      throw new Error('Failed to find nearby hospitals');
    }
  } catch (error) {
    console.error('Hospital API error:', error);
    return [];
  }
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * Check if location is within radius
 */
export function isWithinRadius(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number, 
  radiusKm: number
): boolean {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radiusKm;
}

/**
 * Get location bounds for a given center and radius
 */
export function getLocationBounds(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): { north: number; south: number; east: number; west: number } {
  const latDelta = radiusKm / 111; // Approximately 111 km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));

  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLng + lngDelta,
    west: centerLng - lngDelta
  };
}