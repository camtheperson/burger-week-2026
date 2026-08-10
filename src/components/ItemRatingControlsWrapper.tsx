import ItemRatingControls from './ItemRatingControls';
import type { Id } from '../../convex/_generated/dataModel';

interface ItemRatingControlsWrapperProps {
  itemId: Id<"locationItems">;
  userRating?: number | null;
  isFavorited?: boolean;
  averageRating?: number;
  ratingCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Wrapper component for ItemRatingControls that receives data as props
 * This component now expects the parent to provide the rating and favorite data
 * instead of making its own queries.
 */
export default function ItemRatingControlsWrapper({ 
  itemId, 
  userRating,
  isFavorited = false,
  averageRating,
  ratingCount = 0,
  size = 'md' 
}: ItemRatingControlsWrapperProps) {
  return (
    <ItemRatingControls
      itemId={itemId}
      size={size}
      userRating={userRating}
      isFavorited={isFavorited}
      averageRating={averageRating}
      ratingCount={ratingCount}
    />
  );
}