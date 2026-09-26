export type Location = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TransportType = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

export type RoutePrice = {
  id: string;
  from_location_id: string;
  to_location_id: string;
  transport_type_id: string;
  price: number;
  currency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined fields (from API responses)
  from_location?: Pick<Location, "id" | "name" | "slug">;
  to_location?: Pick<Location, "id" | "name" | "slug">;
  transport_type?: Pick<TransportType, "id" | "name" | "icon">;
};

export type PriceQuoteOption = {
  route_price_id: string;
  transport_type: string;
  transport_icon: string | null;
  price: number;
  currency: string;
  notes: string | null;
  updated_at: string;
};

export type PopularRoute = {
  from_location_id: string;
  from_name: string;
  to_location_id: string;
  to_name: string;
  search_count: number;
  min_price: number | null;
  currency: string | null;
};

export type RouteReportStatus = "pending" | "reviewed" | "added" | "rejected";

export type RouteReport = {
  id: string;
  from_location: string;
  to_location: string;
  suggested_price: number | null;
  message: string | null;
  status: RouteReportStatus;
  created_at: string;
};

export type AppRole = "super_admin" | "admin" | "editor";
