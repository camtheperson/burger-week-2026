import { MapPin } from 'lucide-react';
import RatingDisplay from './RatingDisplay';
import { getTypeTagStyles, type ItemType } from '../utils/itemTypeUtils';

interface LocationCardProps {
  location: {
    _id: string;
    restaurantName: string;
    neighborhood: string;
    address: string;
    averageRating?: number;
    reviewCount?: number;
    items?: Array<{
      _id: string;
      itemName: string;
      description?: string;
      type: string;
      types?: ItemType[];
      glutenFree: boolean;
      image?: string;
    }>;
    hours?: Array<{
      dayOfWeek: string;
      date: string;
      hours: string;
      fullDate: string;
    }>;
  };
  onClick: () => void;
  isSelected: boolean;
}

// Helper function to check if location is currently open
function isLocationOpenNow(hours?: Array<{ dayOfWeek: string; date: string; hours: string; fullDate: string }>): boolean {
  if (!hours || hours.length === 0) return false;
  
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Find today's hours
  const todayHours = hours.find(h => h.fullDate === currentDate);
  if (!todayHours) return false;
  
  // Parse hours string (e.g., "12–10 pm", "11 am–11 pm", "Closed")
  const hoursStr = todayHours.hours;
  if (hoursStr.toLowerCase().includes('closed')) return false;
  
  try {
    // Extract start and end times
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
    const match = hoursStr.match(timeRegex);
    if (!match) return false;
    
    const [, startHour, startMin = '0', startAmPm, endHour, endMin = '0', endAmPm] = match;
    
    // Convert to 24-hour format
    let start24 = parseInt(startHour);
    let end24 = parseInt(endHour);
    
    if (startAmPm.toLowerCase() === 'pm' && start24 !== 12) start24 += 12;
    if (startAmPm.toLowerCase() === 'am' && start24 === 12) start24 = 0;
    if (endAmPm.toLowerCase() === 'pm' && end24 !== 12) end24 += 12;
    if (endAmPm.toLowerCase() === 'am' && end24 === 12) end24 = 0;
    
    const startTime = start24 * 60 + parseInt(startMin);
    const endTime = end24 * 60 + parseInt(endMin);
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Handle overnight hours (e.g., 11 PM - 2 AM)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  } catch {
    return false;
  }
}

export default function LocationCard({ location, onClick, isSelected }: LocationCardProps) {
  const isOpenNow = isLocationOpenNow(location.hours);
  // const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);

  // const handleRatingClick = (rating: number, e: React.MouseEvent) => {
  //   e.stopPropagation(); // Prevent card click
  //   // Rating functionality temporarily disabled
  //   console.log('Rating clicked:', rating);
  // };

  return (
    <div
      onClick={onClick}
      className={`p-4 md:p-4 rounded-lg border cursor-pointer transition-all mb-4 md:mb-4 ${
        isSelected
          ? 'border-burger-red bg-burger-red bg-opacity-5'
          : 'border-gray-200 hover:border-burger-red hover:border-opacity-30 hover:shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start mb-3 md:mb-2">
        <h3 className="font-semibold text-lg md:text-base text-gray-900 flex-1 pr-2 leading-tight">{location.restaurantName}</h3>
        {isOpenNow && (
          <span className="text-sm md:text-xs bg-green-100 text-green-800 px-3 py-1 md:px-2 md:py-1 rounded-full font-medium flex-shrink-0">
            Open Now
          </span>
        )}
      </div>
      
      <div className="flex items-center text-base md:text-sm text-gray-600 mb-3 md:mb-2">
        <MapPin className="w-5 h-5 md:w-4 md:h-4 mr-2 md:mr-1 flex-shrink-0" />
        <span className="break-words">{location.neighborhood}</span>
      </div>
      
      {/* Google Maps Style Rating */}
      {location.averageRating !== undefined && (
        <div className="mb-3 md:mb-2">
          <RatingDisplay
            averageRating={location.averageRating}
            ratingCount={location.reviewCount || 0}
            size="sm"
          />
        </div>
      )}
      
      {location.items && location.items.length > 0 && (
        <div className="space-y-4 md:space-y-3">
          {location.items.slice(0, 2).map((item) => (
            <div key={item._id} className="text-sm">
              <div className="flex gap-3">
                {item.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.itemName}
                      className="w-28 h-28 md:w-24 md:h-24 object-cover rounded-lg"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-burger-brown text-base md:text-sm leading-tight">{item.itemName}</p>
                  {item.description && (
                    <p className="text-gray-600 text-sm md:text-xs mt-2 md:mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 md:gap-1 mt-2 md:mt-1 flex-wrap">
                    {item.glutenFree && (
                      <span className="text-sm md:text-xs bg-green-100 text-green-800 px-2 py-1 md:px-2 md:py-0.5 rounded font-medium">
                        GF
                      </span>
                    )}
                    {/* Show all type tags */}
                    {item.types && item.types.length > 1 ? (
                      // Multiple types - show all as separate tags
                      item.types.map((type) => (
                        <span key={type} className={`text-sm md:text-xs px-2 py-1 md:px-2 md:py-0.5 rounded capitalize font-medium ${getTypeTagStyles(type)}`}>
                          {type}
                        </span>
                      ))
                    ) : (
                      // Single type - show primary type
                      <span className={`text-sm md:text-xs px-2 py-1 md:px-2 md:py-0.5 rounded capitalize font-medium ${getTypeTagStyles(item.type as ItemType)}`}>
                        {item.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {location.items.length > 2 && (
            <p className="text-sm md:text-xs text-gray-500 font-medium">
              +{location.items.length - 2} more item{location.items.length - 2 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}