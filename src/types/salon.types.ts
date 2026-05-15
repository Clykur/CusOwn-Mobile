export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description?: string;
  duration: number; // duration in minutes
  price: number;
}

export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  rating: number;
  reviews_count: number;
  images: string[];
  featured?: boolean;
  services?: Service[];
}
