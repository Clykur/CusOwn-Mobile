export type UserRole = 'Customer' | 'Owner';
export type DBUserType = 'customer' | 'owner';

export interface UserProfile {
  id: string;
  email?: string;
  full_name: string | null;
  phone_number: string | null;
  user_type: DBUserType;
  profile_media_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
