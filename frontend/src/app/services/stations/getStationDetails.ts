import { API_BASE_URL } from "../utils/constants";

export interface BikeInfo {
  id: number;
  type: string;
  bikeStatus: string;
  reservationExpDate?: string;
  reservationExpTime?: string;
}

export interface DockInfo {
  id: number;
  bike: BikeInfo | null;
  empty: boolean;
}

export interface StationDetails {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  bikeCapacity: number;
  numberOfBikesDocked: number;
  status: string;
  docks: DockInfo[];
}

export async function getStationDetails(stationId: number): Promise<StationDetails> {
  try {
    // Step 1: Get station basic info
    const stationsResponse = await fetch(`${API_BASE_URL}/api/stations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!stationsResponse.ok) {
      throw new Error("Failed to fetch stations");
    }
    
    const allStations = await stationsResponse.json();
    const station = allStations.find((s: any) => s.id === stationId);
    
    if (!station) {
      throw new Error("Station not found");
    }

    // Step 2: Get bikes at the station
    const bikesResponse = await fetch(`${API_BASE_URL}/api/stations/${stationId}/bikes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    let bikes: any[] = [];
    if (bikesResponse.ok) {
      bikes = await bikesResponse.json();
    }

    // Step 3: Get available (empty) docks
    const availableDocksResponse = await fetch(`${API_BASE_URL}/api/stations/${stationId}/docks/available`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    let availableDockIds: number[] = [];
    if (availableDocksResponse.ok) {
      const availableDocks = await availableDocksResponse.json();
      availableDockIds = availableDocks.map((dock: any) => dock.id);
    }

    // Step 4: Construct docks array
    // We know the capacity, bikes, and empty dock IDs
    // Note: We don't know which dock has which bike, but we can show all bikes and empty docks
    const docks: DockInfo[] = [];
    
    // First, add all empty docks with their actual IDs
    availableDockIds.forEach((dockId: number) => {
      docks.push({
        id: dockId,
        bike: null,
        empty: true,
      });
    });

    // Then, add docks with bikes
    // Since we don't know the exact dock ID for each bike, we'll use a placeholder
    // We'll use a high number (starting from 10000) to indicate it's a placeholder
    // This allows the UI to display bikes even though we don't know their exact dock
    let placeholderDockId = 10000;
    bikes.forEach((bike: any) => {
      docks.push({
        id: placeholderDockId++, // Placeholder - actual dock ID unknown, but bike is at the station
        bike: {
          id: bike.id,
          type: bike.type,
          bikeStatus: typeof bike.bikeStatus === 'string' ? bike.bikeStatus : (bike.bikeStatus?.toString() || "available"),
          reservationExpDate: bike.reservationExpDate,
          reservationExpTime: bike.reservationExpTime,
        },
        empty: false,
      });
    });

    // Ensure we have at least the capacity number of docks represented
    // If we have fewer total docks than capacity, it means some docks might not be in the system yet
    // or there's a mismatch - we'll use what we have

    return {
      id: station.id,
      name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
      address: station.address,
      bikeCapacity: station.bikeCapacity,
      numberOfBikesDocked: station.numberOfBikesDocked || bikes.length,
      status: station.status || "active",
      docks: docks,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch station details");
  }
}

