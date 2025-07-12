/**
 * Server-side geolocation utilities
 */

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Server-side version of calculateDistance
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