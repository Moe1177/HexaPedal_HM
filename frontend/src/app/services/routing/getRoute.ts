// Routing service to fetch navigation routes from OpenStreetMap Routing Service (OSRS)
import { API_BASE_URL } from "../utils/constants";

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  coordinates: RouteCoordinate[];
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Fetches a bike-friendly route between two points using OSRS API
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @returns Route information including coordinates, distance, and duration
 */

export async function getRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteInfo> {

  if (!isValidCoordinate(startLat, startLng) || !isValidCoordinate(endLat, endLng)) {
    throw new Error("Invalid coordinates provided. Please ensure both start and destination stations have valid coordinates.");
  }

  const straightLineDistance = calculateDistance(startLat, startLng, endLat, endLng);
  if (straightLineDistance > 6000000) {
    throw new Error(`Distance between points is too large (${formatDistance(straightLineDistance)}). Please check that station coordinates are correct.`);
  }

  try {
    // Use backend proxy to bypass CORS
    const url = `${API_BASE_URL}/api/routing/route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`;
    
    console.log("Fetching route from backend proxy...");
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Backend routing returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // OpenRouteService response format
    if (!data.features || data.features.length === 0) {
      throw new Error("No route found");
    }
    
    const feature = data.features[0];
    const geometry = feature.geometry;
    const properties = feature.properties;
    
    // Convert GeoJSON coordinates [lng, lat] to Leaflet format {lat, lng}
    const coordinates: RouteCoordinate[] = geometry.coordinates.map(
      (coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0],
      })
    );
    
    console.log(`Successfully got route with ${coordinates.length} points`);
    
    // OpenRouteService returns summary with distance and duration
    const summary = properties.summary || properties.segments?.[0] || {};
    
    return {
      coordinates,
      distance: summary.distance || 0,
      duration: summary.duration || 0,
    };
  } catch (error) {
    console.error("Failed to fetch route from backend:", error);
    
    // Fallback to straight line route
    console.warn("Using fallback straight-line route");
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    
    const numPoints = 10;
    const coordinates: RouteCoordinate[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      coordinates.push({
        lat: startLat + (endLat - startLat) * ratio,
        lng: startLng + (endLng - startLng) * ratio,
      });
    }
    
    // Estimate duration based on distance (assuming ~15 km/h bike speed)
    const durationSeconds = (distance / 15000) * 3600;
    
    return {
      coordinates,
      distance,
      duration: durationSeconds,
    };
  }
}

// Validate if coordinates are valid
function isValidCoordinate(lat: number, lng: number): boolean {
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return false;
  }
  if (lat === 0 && lng === 0) {
    return false;
  }
  // Out of valid coordinate ranges
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return false; 
  }
  return true;
}

/**
 * Calculate straight-line distance between two points using Haversine formula
 * @returns Distance in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Format distance to display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Format duration to display
export function formatDuration(seconds: number): string {
  if (seconds === 0) return "N/A";
  
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

