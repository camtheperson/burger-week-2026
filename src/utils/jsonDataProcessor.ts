import type { JsonItem, LocationWithItems, LocationItem, ItemEnrichmentData, JsonLocationPin } from '../types';
import type { Id } from '../../convex/_generated/dataModel';
import { checkIfOpenNow, checkIfOpenAt } from './timeUtils';

// Group JSON items by location and convert to LocationWithItems format
export function processJsonToLocations(
  jsonItems: JsonItem[], 
  enrichmentData: Record<string, ItemEnrichmentData>
): LocationWithItems[] {
  const locationMap: Record<string, LocationWithItems> = {};
  
  jsonItems.forEach((item) => {
    if (item.latitude && item.longitude && item.restaurantName) {
      // Group by name + address, not just name, so chains with multiple
      // Burger Week locations (e.g. the same item at two different addresses)
      // get a separate pin per location instead of collapsing into one.
      const key = `${item.restaurantName}|${item.address}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          _id: `json-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` as Id<'locations'>, // Temporary ID for JSON data
          restaurantName: item.restaurantName,
          address: item.address,
          neighborhood: item.neighborhood,
          latitude: item.latitude,
          longitude: item.longitude,
          geocodedAddress: item.geocoded_address,
          geocodingMethod: item.geocoding_method,
          allowMinors: item.allowMinors,
          allowTakeout: item.allowTakeout,
          allowDelivery: item.allowDelivery,
          purchaseLimits: item.purchaseLimits,
          items: [],
          hours: item.hours ? item.hours.map(h => ({
            _id: `${key}-${h.dayOfWeek}` as Id<'locationHours'>,
            locationId: `json-${key}` as Id<'locations'>,
            dayOfWeek: h.dayOfWeek,
            date: h.date,
            hours: h.hours,
            fullDate: h.fullDate
          })) : [],
        };
      }
      
      // Parse multiple types from comma-separated string
      const typeString = item.type || 'meat';
      const types = typeString.toLowerCase().split(',').map(t => t.trim()).filter(t => 
        t === 'meat' || t === 'vegetarian' || t === 'vegan'
      ).sort() as ('meat' | 'vegetarian' | 'vegan')[]; // Alphabetize for consistency
      
      // Use the first type (alphabetically) as the primary type for backward compatibility
      const primaryType = types[0] || 'meat';
      
      // Get enrichment data for this item
      const enrichment = enrichmentData[item.itemKey];
      
      const locationItem: LocationItem = {
        _id: (enrichment?.itemId || `temp-${item.itemKey}`) as Id<'locationItems'>,
        locationId: locationMap[key]._id,
        itemName: item.itemName,
        description: item.description,
        altDescription: item.altDescription,
        type: primaryType, // Primary type for compatibility
        types: types.length > 1 ? types : undefined, // All types if multiple
        glutenFree: item.glutenFree,
        vegSubstitute: item.vegSubstitute ?? undefined,
        vegSurcharge: item.vegSurcharge,
        image: item.image,
        itemKey: item.itemKey,
        averageRating: enrichment?.averageRating,
        ratingCount: enrichment?.ratingCount || 0,
        userRating: enrichment?.userRating,
        isFavorited: enrichment?.isFavorited || false,
      };
      
      locationMap[key].items!.push(locationItem);
    }
  });
  
  // Calculate location-level ratings after all items are processed
  const locationsWithRatings = Object.values(locationMap).map(location => {
    const items = location.items || [];
    const itemsWithRatings = items.filter(item => item.averageRating && item.averageRating > 0);
    
    if (itemsWithRatings.length > 0) {
      const totalRating = itemsWithRatings.reduce((sum, item) => sum + (item.averageRating || 0), 0);
      const totalReviews = itemsWithRatings.reduce((sum, item) => sum + (item.ratingCount || 0), 0);
      
      return {
        ...location,
        averageRating: totalRating / itemsWithRatings.length,
        reviewCount: totalReviews
      };
    }
    
    return location;
  });
  
  return locationsWithRatings;
}

// Apply filters to JSON-based locations (similar to Convex query logic)
export function filterJsonLocations(
  locations: LocationWithItems[],
  filters: {
    searchTerm?: string;
    neighborhood?: string;
    glutenFree?: boolean;
    allowMinors?: boolean;
    allowTakeout?: boolean;
    allowDelivery?: boolean;
    isOpenNow?: boolean;
    openAtEnabled?: boolean;
    openAtDate?: string;
    openAtTime?: string;
    type?: 'meat' | 'vegetarian' | 'vegan';
    favoritesOnly?: boolean;
  },
  favoriteItemIds: Set<string> = new Set()
): LocationWithItems[] {
  return locations.filter(location => {
    // Apply location-level filters
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesLocation = 
        location.restaurantName.toLowerCase().includes(term) ||
        location.neighborhood.toLowerCase().includes(term);
      
      // Also search through menu items for name and description matches
      const matchesItems = location.items?.some(item => 
        item.itemName.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.altDescription && item.altDescription.toLowerCase().includes(term))
      );
      
      if (!matchesLocation && !matchesItems) return false;
    }
    
    if (filters.neighborhood && location.neighborhood !== filters.neighborhood) {
      return false;
    }
    
    if (filters.allowMinors !== undefined && location.allowMinors !== filters.allowMinors) {
      return false;
    }
    
    if (filters.allowTakeout !== undefined && location.allowTakeout !== filters.allowTakeout) {
      return false;
    }
    
    if (filters.allowDelivery !== undefined && location.allowDelivery !== filters.allowDelivery) {
      return false;
    }
    
    // Apply isOpenNow filter
    if (filters.isOpenNow && location.hours) {
      const isOpen = checkIfOpenNow(location.hours);
      if (!isOpen) return false;
    }
    
    // Apply openAt filter (Nick's unnecessarily complicated filter)
    if (filters.openAtEnabled && filters.openAtDate && filters.openAtTime && location.hours) {
      const isOpenAt = checkIfOpenAt(location.hours, filters.openAtDate, filters.openAtTime);
      if (!isOpenAt) return false;
    }
    
    // Apply item-level filters
    if (location.items && location.items.length > 0) {
      let filteredItems = location.items;
      
      // Apply favorites filter
      if (filters.favoritesOnly) {
        filteredItems = filteredItems.filter(item => favoriteItemIds.has(item._id));
        if (filteredItems.length === 0) return false;
      }
      
      // Apply type and gluten-free filters
      if (filters.glutenFree || filters.type) {
        const hasMatchingItems = filteredItems.some(item => {
          const matchesGlutenFree = !filters.glutenFree || item.glutenFree;
          
          // Check if item matches the type filter
          let matchesType = true;
          if (filters.type) {
            // Check primary type
            const primaryTypeMatches = item.type === filters.type;
            // Check additional types array if it exists
            const additionalTypeMatches = item.types?.includes(filters.type as 'meat' | 'vegetarian' | 'vegan') || false;
            matchesType = primaryTypeMatches || additionalTypeMatches;
          }
          
          return matchesGlutenFree && matchesType;
        });
        if (!hasMatchingItems) return false;
      }
    }
    
    return true;
  });
}

// Convert locations to pins for map display
export function locationsToJsonPins(locations: LocationWithItems[]): JsonLocationPin[] {
  return locations
    .filter(loc => loc.latitude && loc.longitude)
    .map(loc => ({
      _id: loc._id,
      restaurantName: loc.restaurantName,
      neighborhood: loc.neighborhood,
      latitude: loc.latitude!,
      longitude: loc.longitude!,
      address: loc.address,
      allowMinors: loc.allowMinors,
      allowTakeout: loc.allowTakeout,
      allowDelivery: loc.allowDelivery,
      purchaseLimits: loc.purchaseLimits,
    }));
}