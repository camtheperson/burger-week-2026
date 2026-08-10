import { mutation } from "./_generated/server";

export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all items, hours, and locations
    const items = await ctx.db.query("locationItems").collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    
    const hours = await ctx.db.query("locationHours").collect();
    for (const hour of hours) {
      await ctx.db.delete(hour._id);
    }
    
    const locations = await ctx.db.query("locations").collect();
    for (const location of locations) {
      await ctx.db.delete(location._id);
    }
    
    return { 
      success: true, 
      deleted: {
        items: items.length,
        hours: hours.length,
        locations: locations.length
      }
    };
  },
});