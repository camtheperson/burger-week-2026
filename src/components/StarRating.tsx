import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showHover?: boolean;
}

export default function StarRating({ 
  rating = 0, 
  onRate, 
  readonly = false, 
  size = 'md',
  showHover = true
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRate) {
      onRate(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly && showHover) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRating(null);
  };

  return (
    <div 
      className="flex items-center space-x-0.5"
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starNumber) => {
        const filled = rating >= starNumber;
        
        // Progressive hover effect: highlight up to the hovered star
        const shouldHighlight = hoveredRating !== null && starNumber <= hoveredRating;
        
        return (
          <div
            key={starNumber}
            className={`relative ${readonly ? '' : 'cursor-pointer'}`}
            onMouseEnter={() => handleStarHover(starNumber)}
            onClick={() => handleStarClick(starNumber)}
          >
            <Star className={`${sizes[size]} ${
              shouldHighlight ? 'text-yellow-200' : 'text-gray-300'
            }`} />
            
            {(filled || shouldHighlight) && (
              <Star
                className={`${sizes[size]} fill-current absolute top-0 left-0 ${
                  shouldHighlight ? 'text-yellow-300' : 'text-yellow-400'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}