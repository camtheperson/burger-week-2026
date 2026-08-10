import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  // Include auth tables
  ...authTables,

  // Locations table - restaurants/venues serving burgers
  locations: defineTable({
    restaurantName: v.string(),
    address: v.string(),
    neighborhood: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    geocodedAddress: v.optional(v.string()),
    geocodingMethod: v.optional(v.string()),
    allowMinors: v.boolean(),
    allowTakeout: v.boolean(),
    allowDelivery: v.boolean(),
    purchaseLimits: v.boolean(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_restaurant_name", ["restaurantName"])
    .index("by_neighborhood", ["neighborhood"])
    .searchIndex("search_locations", {
      searchField: "restaurantName",
      filterFields: ["neighborhood", "allowMinors", "allowTakeout", "allowDelivery"],
    }),

  // Location items table - specific burger offerings at each location
  locationItems: defineTable({
    locationId: v.id("locations"),
    itemName: v.string(),
    description: v.optional(v.string()),
    altDescription: v.optional(v.string()),
    type: v.union(v.literal("meat"), v.literal("vegetarian"), v.literal("vegan")),
    glutenFree: v.boolean(),
    price: v.optional(v.number()),
    url: v.optional(v.string()),
    image: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    itemKey: v.optional(v.string()), // Unique key to match with JSON data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_location_id", ["locationId"])
    .index("by_type", ["type"])
    .index("by_item_key", ["itemKey"])
    .searchIndex("search_items", {
      searchField: "itemName",
      filterFields: ["type", "glutenFree", "locationId"],
    }),

  // Location hours table - operating hours for each location during burger week
  locationHours: defineTable({
    locationId: v.id("locations"),
    dayOfWeek: v.string(),
    date: v.string(),
    hours: v.string(),
    fullDate: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_location_id", ["locationId"])
    .index("by_full_date", ["fullDate"]),

  // Item ratings table - user ratings for burger items
  itemRatings: defineTable({
    userId: v.string(), // Auth user ID
    itemId: v.id("locationItems"),
    rating: v.number(), // 1-5 (whole numbers only, averages stored as decimals)
    review: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_item_id", ["itemId"])
    .index("by_user_and_item", ["userId", "itemId"]),

  // Favorites table - user favorites for burger items
  favorites: defineTable({
    userId: v.string(), // Auth user ID
    itemId: v.id("locationItems"),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_item_id", ["itemId"])
    .index("by_user_and_item", ["userId", "itemId"]),
});