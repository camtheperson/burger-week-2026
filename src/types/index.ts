import type { Id } from '../../convex/_generated/dataModel';

export type LocationItem = {
  _id: Id<'locationItems'>;
  locationId: Id<'locations'>;
  itemName: string;
  description?: string;
  altDescription?: string;
  type: 'meat' | 'vegetarian' | 'vegan';
  types?: ('meat' | 'vegetarian' | 'vegan')[]; // Multiple types for JSON-based items
  glutenFree: boolean;
  image?: string;
  itemKey?: string;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
  isFavorited?: boolean;
  ratings?: Array<{ _id: Id<'itemRatings'>; [key: string]: unknown }>;
};

export type LocationHour = {
  _id: Id<'locationHours'>;
  locationId: Id<'locations'>;
  dayOfWeek: string;
  date: string;
  hours: string;
  fullDate: string;
};

export type LocationWithItems = {
  _id: Id<'locations'>;
  restaurantName: string;
  address: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  geocodedAddress?: string;
  geocodingMethod?: string;
  allowMinors: boolean;
  allowTakeout: boolean;
  allowDelivery: boolean;
  purchaseLimits: boolean;
  phone?: string;
  website?: string;
  items?: LocationItem[];
  hours?: LocationHour[];
  averageRating?: number;
  reviewCount?: number;
  isOpenNow?: boolean;
};

// JSON data type for immediate pins
export type JsonLocationPin = {
  _id?: Id<'locations'>;
  restaurantName: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  address: string;
  glutenFree?: boolean;
  allowMinors?: boolean;
  allowTakeout?: boolean;
  allowDelivery?: boolean;
  purchaseLimits?: boolean;
};

// JSON item data structure
export type JsonItem = {
  restaurantName: string;
  neighborhood: string;
  itemName: string;
  url?: string;
  description?: string;
  altDescription?: string;
  type: string; // Can be comma-separated like "meat, vegetarian"
  glutenFree: boolean;
  allowMinors: boolean;
  allowTakeout: boolean;
  purchaseLimits: boolean;
  allowDelivery: boolean;
  address: string;
  hours?: Array<{
    dayOfWeek: string;
    date: string;
    hours: string;
    fullDate: string;
  }>;
  latitude?: number;
  longitude?: number;
  geocoded_address?: string;
  geocoding_method?: string;
  image?: string;
  imageUrl?: string;
  itemKey: string;
};

// Item enrichment data from database
export type ItemEnrichmentData = {
  itemId: string;
  averageRating?: number;
  ratingCount: number;
  userRating?: number;
  isFavorited: boolean;
};