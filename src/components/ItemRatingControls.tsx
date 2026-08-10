import { useMutation } from 'convex/react';
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton } from '@clerk/clerk-react';
import { Heart } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import StarRating from './StarRating';
import RatingDisplay from './RatingDisplay';

interface ItemRatingControlsProps {
  itemId: Id<"locationItems">;
  size?: 'sm' | 'md' | 'lg';
  userRating?: number | null;
  isFavorited?: boolean;
  averageRating?: number;
  ratingCount?: number;
}

export default function ItemRatingControls({ 
  itemId, 
  size = 'md',
  userRating = null,
  isFavorited = false,
  averageRating = 0,
  ratingCount = 0
}: ItemRatingControlsProps) {
  // Mutations only - data comes from props
  const setRating = useMutation(api.itemRatings.setRating);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  const handleRatingClick = async (rating: number) => {
    try {
      await setRating({ itemId, rating });
    } catch (error) {
      console.error('Failed to set rating:', error);
    }
  };

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite({ itemId });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const sizeClasses = {
    sm: {
      text: 'text-sm',
      heartSize: 'w-4 h-4',
      padding: 'p-1.5',
      gap: 'gap-2'
    },
    md: {
      text: 'text-base',
      heartSize: 'w-5 h-5',
      padding: 'p-2',
      gap: 'gap-3'
    },
    lg: {
      text: 'text-lg',
      heartSize: 'w-6 h-6',
      padding: 'p-3',
      gap: 'gap-4'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div>
      {/* Rating Display */}
      {ratingCount > 0 && (
        <div className="mb-3">
          <RatingDisplay
            averageRating={averageRating}
            ratingCount={ratingCount}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        </div>
      )}

      {/* Rating and Favorite Controls */}
      <Authenticated>
        <div className={`flex items-center justify-between ${classes.gap}`}>
          <div className="flex items-center gap-2">
            <span className={`${classes.text} text-gray-700 font-medium`}>Rate:</span>
            <div className="flex items-center space-x-0.5">
              <StarRating
                rating={userRating || 0}
                onRate={handleRatingClick}
                size={size === 'lg' ? 'md' : 'sm'}
              />
              {userRating && userRating > 0 && (
                <span className={`${classes.text} text-gray-500 ml-2`}>({userRating})</span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleFavoriteClick}
            className={`${classes.padding} rounded-full transition-colors ${
              isFavorited 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`${classes.heartSize} ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-between">
          <div className={`${classes.text} text-gray-500`}>
            <SignInButton>
              <button className={`${classes.text} text-burger-red hover:text-burger-red-light underline`}>
                Sign in to rate and favorite
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}