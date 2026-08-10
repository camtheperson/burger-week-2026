import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

// DEPRECATED: This hook is deprecated as part of the refactor to client-side JSON processing
// Components should now receive enrichment data as props from the page level
export function useItemData(itemIds: Id<"locationItems">[]) {
  const ratings = useQuery(api.itemRatings.getBatchItemRatings, 
    itemIds.length > 0 ? { itemIds } : "skip"
  );
  
  const favorites = useQuery(api.favorites.getBatchFavorites,
    itemIds.length > 0 ? { itemIds } : "skip"
  );
  
  return {
    ratings: ratings || {},
    favorites: favorites || {},
    isLoading: ratings === undefined || favorites === undefined
  };
}

// Hook for a single item (backwards compatibility)
export function useSingleItemData(itemId: Id<"locationItems">) {
  const batchData = useItemData([itemId]);
  
  return {
    userRating: batchData.ratings[itemId]?.userRating || null,
    isFavorited: batchData.favorites[itemId] || false,
    averageRating: batchData.ratings[itemId]?.averageRating || 0,
    ratingCount: batchData.ratings[itemId]?.ratingCount || 0,
    isLoading: batchData.isLoading
  };
}