import { useMutation } from 'convex/react';
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton } from '@clerk/clerk-react';
import { Heart } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import StarRating from './StarRating';
import RatingDisplay from './RatingDisplay';

interface LocationItem {
  _id: Id<"locationItems">;
  itemName: string;
  description?: string;
  altDescription?: string;
  type: 'meat' | 'vegetarian' | 'vegan';
  glutenFree: boolean;
  image?: string;
}

interface ItemCardProps {
  item: LocationItem;
  compact?: boolean;
  userRating?: number | null;
  isFavorited?: boolean;
  averageRating?: number;
  ratingCount?: number;
}

export default function ItemCard({ 
  item, 
  compact = false,
  userRating = null,
  isFavorited = false,
  averageRating = 0,
  ratingCount = 0
}: ItemCardProps) {

  // Mutations only - data comes from props
  const setRating = useMutation(api.itemRatings.setRating);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  const handleRatingClick = async (rating: number) => {
    try {
      await setRating({ itemId: item._id, rating });
    } catch (error) {
      console.error('Failed to set rating:', error);
    }
  };

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite({ itemId: item._id });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
      <div className="flex gap-3">
        {item.image && (
          <div className="flex-shrink-0">
            <img
              src={item.image}
              alt={item.itemName}
              className={compact ? "w-20 h-20 object-cover rounded-lg" : "w-24 h-24 object-cover rounded-lg"}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-burger-brown mb-2 leading-tight">{item.itemName}</h4>
          
          {item.description && (
            <div className="mb-3">
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">What's on them...</h5>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          )}
          
          {item.altDescription && (
            <div className="mb-3">
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">What they're saying...</h5>
              <p className="text-sm text-gray-600 leading-relaxed">{item.altDescription}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            {item.glutenFree && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                GF
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize font-medium">
              {item.type}
            </span>
          </div>

          {/* Rating Display */}
          {ratingCount > 0 && (
            <div className="mb-3">
              <RatingDisplay 
                averageRating={averageRating} 
                ratingCount={ratingCount} 
                size="sm" 
              />
            </div>
          )}

          {/* Rating and Favorite Controls */}
          <Authenticated>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">Rate:</span>
                <div className="flex items-center space-x-0.5">
                  <StarRating
                    rating={userRating || 0}
                    onRate={handleRatingClick}
                    size="sm"
                  />
                  {userRating && userRating > 0 && (
                    <span className="text-sm text-gray-500 ml-2">({userRating})</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleFavoriteClick}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>
          </Authenticated>

          <Unauthenticated>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <SignInButton>
                  <button className="text-burger-red hover:text-burger-red-light underline">
                    Sign in to rate and favorite
                  </button>
                </SignInButton>
              </div>
            </div>
          </Unauthenticated>
        </div>
      </div>
    </div>
  );
}