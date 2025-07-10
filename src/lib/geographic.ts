/**
 * Geographic utilities for distance calculations and route optimization
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteAnalysis {
  pickupDistance: number;
  dropoffDistance: number;
  detourDistance: number;
  isOnRoute: boolean;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Analyze how well a delivery request fits a travel route
 */
export function analyzeRoute(
  tripFrom: Coordinates,
  tripTo: Coordinates,
  requestFrom: Coordinates,
  requestTo: Coordinates
): RouteAnalysis {
  // Calculate distances
  const pickupDistance = calculateDistance(tripFrom, requestFrom);
  const dropoffDistance = calculateDistance(tripTo, requestTo);
  
  // Calculate the direct trip distance
  const directTripDistance = calculateDistance(tripFrom, tripTo);
  
  // Calculate the detour distance (pickup -> original trip -> dropoff)
  const detourDistance = 
    calculateDistance(tripFrom, requestFrom) +
    calculateDistance(requestFrom, tripTo) +
    calculateDistance(tripTo, requestTo) -
    directTripDistance;
  
  // Consider it "on route" if the detour is less than 20% of original trip
  const isOnRoute = detourDistance < (directTripDistance * 0.2);
  
  return {
    pickupDistance,
    dropoffDistance,
    detourDistance,
    isOnRoute
  };
}

/**
 * Calculate compatibility score based on geographic factors
 */
export function calculateGeographicScore(analysis: RouteAnalysis): number {
  let score = 0;
  
  // Pickup proximity scoring (closer is better)
  if (analysis.pickupDistance <= 5) score += 40;
  else if (analysis.pickupDistance <= 15) score += 30;
  else if (analysis.pickupDistance <= 30) score += 20;
  else if (analysis.pickupDistance <= 50) score += 10;
  
  // Dropoff proximity scoring
  if (analysis.dropoffDistance <= 5) score += 40;
  else if (analysis.dropoffDistance <= 15) score += 30;
  else if (analysis.dropoffDistance <= 30) score += 20;
  else if (analysis.dropoffDistance <= 50) score += 10;
  
  // Route efficiency bonus
  if (analysis.isOnRoute) score += 20;
  else if (analysis.detourDistance < 50) score += 10;
  
  return Math.min(score, 100);
}

/**
 * Geocode a location string to coordinates (mock implementation)
 * In production, this would use Google Maps, OpenStreetMap, or similar API
 */
export async function geocodeLocation(location: string): Promise<Coordinates | null> {
  // Mock geocoding for common cities - in production use real geocoding API
  const mockCoordinates: Record<string, Coordinates> = {
    // Major cities for testing
    'kabul, afghanistan': { lat: 34.5553, lng: 69.2075 },
    'tirana, albania': { lat: 41.3275, lng: 19.8187 },
    'new york, usa': { lat: 40.7128, lng: -74.0060 },
    'london, uk': { lat: 51.5074, lng: -0.1278 },
    'paris, france': { lat: 48.8566, lng: 2.3522 },
    'tokyo, japan': { lat: 35.6762, lng: 139.6503 },
    'dubai, uae': { lat: 25.2048, lng: 55.2708 },
    'sydney, australia': { lat: -33.8688, lng: 151.2093 },
  };
  
  const key = location.toLowerCase().trim();
  return mockCoordinates[key] || null;
}

/**
 * Get proximity description for UI
 */
export function getProximityDescription(distance: number): string {
  if (distance <= 5) return "Very close";
  if (distance <= 15) return "Close";
  if (distance <= 30) return "Nearby";
  if (distance <= 50) return "Moderate distance";
  if (distance <= 100) return "Far";
  return "Very far";
}