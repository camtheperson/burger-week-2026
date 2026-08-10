import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// DEPRECATED: This function has been replaced with client-side JSON processing + getItemEnrichmentData
// Kept for backwards compatibility - can be removed once all consumers are updated
export const getLocations = query({
  args: {
    neighborhood: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    glutenFree: v.optional(v.boolean()),
    allowMinors: v.optional(v.boolean()),
    allowTakeout: v.optional(v.boolean()),
    allowDelivery: v.optional(v.boolean()),
    isOpenNow: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("meat"), v.literal("vegetarian"), v.literal("vegan"))),
    favoritesOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async () => {
    // Return empty array - this function is deprecated
    // Use getItemEnrichmentData + client-side JSON processing instead
    return [];
  },
});

// Get a single location with full details
export const getLocationById = query({
  args: { id: v.id("locations") },
  handler: async (ctx, { id }) => {
    const location = await ctx.db.get(id);
    if (!location) return null;
    
    const items = await ctx.db
      .query("locationItems")
      .withIndex("by_location_id", (q) => q.eq("locationId", id))
      .collect();
    
    const hours = await ctx.db
      .query("locationHours")
      .withIndex("by_location_id", (q) => q.eq("locationId", id))
      .collect();
    
    // Get ALL ratings in one query and group by item
    const allRatings = await ctx.db.query("itemRatings").collect();
    const ratingsByItem = new Map<string, typeof allRatings>();
    
    allRatings.forEach(rating => {
      const itemIds = items.map(item => item._id);
      if (itemIds.includes(rating.itemId)) {
        if (!ratingsByItem.has(rating.itemId)) {
          ratingsByItem.set(rating.itemId, []);
        }
        ratingsByItem.get(rating.itemId)!.push(rating);
      }
    });
    
    // Process items with pre-fetched ratings
    const itemsWithRatings = items.map((item) => {
      const ratings = ratingsByItem.get(item._id) || [];
      
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      
      return {
          _id: item._id,
          locationId: item.locationId,
          itemName: item.itemName,
          description: item.description,
          altDescription: item.altDescription,
          type: item.type,
          glutenFree: item.glutenFree,
          image: item.image,
          averageRating,
          ratingCount: ratings.length,
          ratings,
        };
    });
    
    return {
      _id: location._id,
      restaurantName: location.restaurantName,
      address: location.address,
      neighborhood: location.neighborhood,
      latitude: location.latitude,
      longitude: location.longitude,
      geocodedAddress: location.geocodedAddress,
      geocodingMethod: location.geocodingMethod,
      allowMinors: location.allowMinors,
      allowTakeout: location.allowTakeout,
      allowDelivery: location.allowDelivery,
      purchaseLimits: location.purchaseLimits,
      phone: location.phone,
      website: location.website,
      items: itemsWithRatings,
      hours,
    };
  },
});

// DEPRECATED: Get neighborhoods from JSON data on client-side instead for better performance
// Kept for backwards compatibility - can be removed once all consumers are updated
export const getNeighborhoods = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    const neighborhoods = [...new Set(locations.map(l => l.neighborhood))].sort();
    return neighborhoods;
  },
});





// Get locations with items for scraping (includes items with URLs)
export const getLocationsForScraping = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    
    const locationsWithItems = await Promise.all(
      locations.map(async (location) => {
        const items = await ctx.db
          .query("locationItems")
          .withIndex("by_location_id", (q) => q.eq("locationId", location._id))
          .collect();
        
        // Return items that have URLs (either need images or need path updates)
        const itemsWithUrls = items.filter(item => item.url);
        
        return {
          ...location,
          items: itemsWithUrls
        };
      })
    );
    
    // Only return locations that have items with URLs
    return locationsWithItems.filter(location => location.items && location.items.length > 0);
  },
});

// Update an item with image information
export const updateItemImage = mutation({
  args: {
    itemId: v.id("locationItems"),
    imageUrl: v.string(),
    imagePath: v.string()
  },
  handler: async (ctx, { itemId, imageUrl, imagePath }) => {
    await ctx.db.patch(itemId, {
      image: imagePath,
      imageUrl: imageUrl,
      updatedAt: Date.now()
    });
    
    return { success: true };
  },
});

// Get count of locations
export const count = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    return locations.length;
  },
});

// Get count of location items
export const countItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("locationItems").collect();
    return items.length;
  },
});

// DEPRECATED: Lightweight query for map pins - replaced with client-side JSON processing
// Kept for backwards compatibility - can be removed once all consumers are updated
export const getLocationPins = query({
  args: {
    neighborhood: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    glutenFree: v.optional(v.boolean()),
    allowMinors: v.optional(v.boolean()),
    allowTakeout: v.optional(v.boolean()),
    allowDelivery: v.optional(v.boolean()),
    isOpenNow: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("meat"), v.literal("vegetarian"), v.literal("vegan"))),
    favoritesOnly: v.optional(v.boolean()),
  },
  handler: async () => {
    // Return empty array - this function is deprecated
    // Use client-side JSON processing instead for better performance
    return [];
  },
});

// NEW: Get item enrichment data (ratings/favorites) by item keys
export const getItemEnrichmentData = query({
  args: {
    itemKeys: v.array(v.string())
  },
  handler: async (ctx, { itemKeys }) => {
    // Get all location items that match the provided keys
    const items = await ctx.db.query("locationItems").collect();
    const matchingItems = items.filter(item => item.itemKey && itemKeys.includes(item.itemKey));
    const itemIds = matchingItems.map(item => item._id);
    
    // Get user's favorites if authenticated
    let userFavorites = new Set<string>();
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const favorites = await ctx.db
        .query("favorites")
        .filter((q) => q.eq(q.field("userId"), identity.subject))
        .collect();
      userFavorites = new Set(favorites.map(f => f.itemId));
    }
    
    // Get all ratings for these items
    const allRatings = await ctx.db.query("itemRatings").collect();
    const relevantRatings = allRatings.filter(rating => itemIds.includes(rating.itemId));
    
    // Build enrichment data map
    const enrichmentData: Record<string, {
      itemId: string;
      averageRating?: number;
      ratingCount: number;
      userRating?: number;
      isFavorited: boolean;
    }> = {};
    
    matchingItems.forEach(item => {
      const ratings = relevantRatings.filter(rating => rating.itemId === item._id);
      const userRating = identity ? ratings.find(r => r.userId === identity.subject) : undefined;
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : undefined;
      
      enrichmentData[item.itemKey!] = {
        itemId: item._id,
        averageRating,
        ratingCount: ratings.length,
        userRating: userRating?.rating,
        isFavorited: userFavorites.has(item._id)
      };
    });
    
    return enrichmentData;
  },
});

// Get all locations with their items for analysis
export const getAllLocationsWithItems = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    
    const locationsWithItems = await Promise.all(
      locations.map(async (location) => {
        const items = await ctx.db
          .query("locationItems")
          .withIndex("by_location_id", (q) => q.eq("locationId", location._id))
          .collect();
        
        return {
          ...location,
          items
        };
      })
    );
    
    return locationsWithItems;
  },
});