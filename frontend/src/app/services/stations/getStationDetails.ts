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
    // Get station info
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

    // Get bikes at that station
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

    // Get available/empty docks of that station
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

    const docks: DockInfo[] = [];
    
    // Add all empty docks of the station
    availableDockIds.forEach((dockId: number) => {
      docks.push({
        id: dockId,
        bike: null,
        empty: true,
      });
    });

    let placeholderDockId = 10000;
    bikes.forEach((bike: any) => {
      docks.push({
        id: placeholderDockId++,
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

