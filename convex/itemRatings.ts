import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user's rating for a specific item
export const getUserRating = query({
  args: {
    itemId: v.id("locationItems")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    
    const rating = await ctx.db
      .query("itemRatings")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();
      
    return rating ? rating.rating : null;
  },
});

// Get average rating and count for an item
export const getItemRatingStats = query({
  args: {
    itemId: v.id("locationItems")
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("itemRatings")
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .collect();
    
    if (ratings.length === 0) {
      return { averageRating: 0, ratingCount: 0 };
    }
    
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      ratingCount: ratings.length
    };
  },
});

// Set or update user's rating for an item
export const setRating = mutation({
  args: {
    itemId: v.id("locationItems"),
    rating: v.number(), // 1-5 (whole numbers only)
    review: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    
    // Validate rating range - only allow whole numbers 1-5
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new Error("Rating must be a whole number between 1 and 5");
    }
    
    const existingRating = await ctx.db
      .query("itemRatings")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();
    
    const now = Date.now();
    
    if (existingRating) {
      // Update existing rating
      await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        review: args.review,
        updatedAt: now,
      });
    } else {
      // Create new rating
      await ctx.db.insert("itemRatings", {
        userId: identity.subject,
        itemId: args.itemId,
        rating: args.rating,
        review: args.review,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    return { success: true };
  },
});

// Delete user's rating for an item
export const deleteRating = mutation({
  args: {
    itemId: v.id("locationItems")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    
    const existingRating = await ctx.db
      .query("itemRatings")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();
    
    if (existingRating) {
      await ctx.db.delete(existingRating._id);
      return { success: true };
    }
    
    return { success: false, message: "No rating found" };
  },
});

// Get all ratings for an item (for reviews display)
export const getItemRatings = query({
  args: {
    itemId: v.id("locationItems"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const ratingsQuery = ctx.db
      .query("itemRatings")
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .order("desc");
    
    const ratings = args.limit 
      ? await ratingsQuery.take(args.limit)
      : await ratingsQuery.collect();
    
    // Note: We're not fetching user details here as we're using Clerk
    // In a real app, you might want to fetch and return user names/avatars
    return ratings.map(rating => ({
      ...rating,
      // You can add user info fetching here if needed
    }));
  },
});

// OPTIMIZED: Get ratings for multiple items at once
export const getBatchItemRatings = query({
  args: {
    itemIds: v.array(v.id("locationItems"))
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db.query("itemRatings").collect();
    
    // Group ratings by itemId
    const ratingsByItem = new Map<string, Array<(typeof ratings)[0]>>();
    ratings.forEach(rating => {
      if (args.itemIds.includes(rating.itemId)) {
        if (!ratingsByItem.has(rating.itemId)) {
          ratingsByItem.set(rating.itemId, []);
        }
        ratingsByItem.get(rating.itemId)!.push(rating);
      }
    });
    
    // Calculate stats for each item
    const result = new Map<string, {
      averageRating: number;
      ratingCount: number;
      userRating?: number;
    }>();
    
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    args.itemIds.forEach(itemId => {
      const itemRatings = ratingsByItem.get(itemId) || [];
      const userRating = userId ? itemRatings.find(r => r.userId === userId) : undefined;
      
      const averageRating = itemRatings.length > 0 
        ? itemRatings.reduce((sum, r) => sum + r.rating, 0) / itemRatings.length 
        : 0;
      
      result.set(itemId, {
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount: itemRatings.length,
        userRating: userRating?.rating
      });
    });
    
    return Object.fromEntries(result);
  },
});
