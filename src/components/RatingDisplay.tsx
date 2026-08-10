import StarRating from './StarRating';

interface RatingDisplayProps {
  averageRating: number;
  ratingCount: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function RatingDisplay({ 
  averageRating, 
  ratingCount, 
  size = 'md',
  showText = true 
}: RatingDisplayProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (ratingCount === 0) {
    return (
      <div className="flex items-center space-x-2">
        <StarRating rating={0} readonly size={size} showHover={false} />
        {showText && (
          <span className={`${textSizes[size]} text-gray-500`}>
            No reviews yet
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`${textSizes[size]} font-medium text-gray-900`}>
        {averageRating.toFixed(1)}
      </span>
      <StarRating rating={averageRating} readonly size={size} showHover={false} />
      {showText && (
        <span className={`${textSizes[size]} text-gray-600`}>
          ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}