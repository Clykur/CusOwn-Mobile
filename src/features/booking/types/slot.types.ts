export interface Slot {
  start_time: string;
  end_time: string;
  id: string;
  business_id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  is_available: boolean;
}
