export interface Trip {
  id: number;
  bikeId: number;
  userId: number;
  startStationId: number;
  startStationName?: string;
  endStationId: number | null;
  endStationName?: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null; // in minutes
  cost: number | null;
  status: "active" | "completed" | "cancelled";
}

