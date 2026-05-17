export interface Slot {
  id: string;
  business_id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  is_available: boolean;
}
