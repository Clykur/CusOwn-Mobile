export type UserRole = 'Customer' | 'Owner';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
}

export interface OwnerStats {
  total_bookings: number;
  pending_bookings: number;
  revenue: number;
}
