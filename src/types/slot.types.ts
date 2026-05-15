export interface Slot {
  id: string;
  salon_id: string;
  service_id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  is_available: boolean;
}
