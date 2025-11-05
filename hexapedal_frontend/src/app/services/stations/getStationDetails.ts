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
    const response = await fetch(`${API_BASE_URL}/api/stations/${stationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.docks) {
        return data;
      }
    }
  } catch (error) {
    throw new Error("Failed to fetch station details");
  }

  const allStationsResponse = await fetch(`${API_BASE_URL}/api/stations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!allStationsResponse.ok) {
    throw new Error("Failed to fetch station details");
  }
  
  const allStations = await allStationsResponse.json();
  const station = allStations.find((s: any) => s.id === stationId);
  
  if (!station) {
    throw new Error("Station not found");
  }
  
  if (station.docks && Array.isArray(station.docks)) {
    return {
      ...station,
      docks: station.docks.map((dock: any) => ({
        id: dock.id,
        bike: dock.bike ? {
          id: dock.bike.id,
          type: dock.bike.type,
          bikeStatus: dock.bike.bikeStatus,
          reservationExpDate: dock.bike.reservationExpDate,
          reservationExpTime: dock.bike.reservationExpTime,
        } : null,
        empty: !dock.bike,
      })),
    };
  }
  
  return {
    ...station,
    status: station.status || "active",
    docks: [],
  };
}

