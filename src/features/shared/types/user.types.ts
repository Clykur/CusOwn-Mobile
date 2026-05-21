export type UserRole = 'Customer' | 'Owner';
export type DBUserType = 'customer' | 'owner' | 'both' | 'admin';

export interface UserProfile {
  id: string;
  email?: string;
  full_name: string | null;
  phone_number: string | null;
  user_type: DBUserType;
  profile_media_id?: string | null;
  /** Optional media embed from profile fetch */
  media?:
    | { url?: string | null; signed_url?: string | null }
    | Array<{ url?: string | null; signed_url?: string | null }>
    | null;
  created_at?: string;
  updated_at?: string;
  /** Read-only admin fields — mobile never writes these */
  admin_note?: string | null;
  legal_hold?: boolean;
  data_classification?: 'public' | 'internal' | 'confidential' | 'regulated' | null;
}
