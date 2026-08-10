import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get favorites for the current authenticated user
export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return []; // Return empty array for unauthenticated users instead of throwing
    }
    
    return await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();
  },
});

// Check if an item is favorited by the current user
export const isFavorited = query({
  args: {
    itemId: v.id("locationItems")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return false;
    }
    
    const favorite = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();
      
    return favorite !== null;
  },
});

// Toggle favorite status for an item
export const toggleFavorite = mutation({
  args: {
    itemId: v.id("locationItems")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    
    const existingFavorite = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();
    
    if (existingFavorite) {
      // Remove favorite
      await ctx.db.delete(existingFavorite._id);
      return { favorited: false };
    } else {
      // Add favorite
      await ctx.db.insert("favorites", {
        userId: identity.subject,
        itemId: args.itemId,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  },
});

// Get all favorited items with their location details for the current user
export const getFavoritedItems = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return [];
    }
    
    const favorites = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();
    
    const favoritedItems = [];
    
    for (const favorite of favorites) {
      const item = await ctx.db.get(favorite.itemId);
      if (item) {
        const location = await ctx.db.get(item.locationId);
        if (location) {
          favoritedItems.push({
            ...item,
            location,
          });
        }
      }
    }
    
    return favoritedItems;
  },
});

// OPTIMIZED: Get user's favorites in batch
export const getBatchFavorites = query({
  args: {
    itemIds: v.array(v.id("locationItems"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {};
    }
    
    const favorites = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();
    
    const favoriteSet = new Set(favorites.map(f => f.itemId));
    
    return Object.fromEntries(
      args.itemIds.map(itemId => [itemId, favoriteSet.has(itemId)])
    );
  },
});
