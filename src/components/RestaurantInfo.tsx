import { MapPin } from 'lucide-react';
import type { LocationWithItems } from '../types';

interface RestaurantInfoProps {
  location: LocationWithItems;
  compact?: boolean;
}

export default function RestaurantInfo({ location, compact = false }: RestaurantInfoProps) {
  if (compact) {
    return (
      <div>
        <div className="flex items-center text-sm text-gray-600 mt-2">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="break-words">{location.neighborhood}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 break-words">{location.address}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4">
      <div className="flex items-center text-gray-600 mb-2">
        <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
        <span className="break-words">{location.neighborhood}</span>
      </div>
      <p className="text-sm text-gray-500 break-words mb-4">{location.address}</p>
      
      {/* Restaurant Features */}
      <div className="flex flex-wrap gap-2">
        {location.allowMinors && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            👨‍👩‍👧‍👦 Family Friendly
          </span>
        )}
        {location.allowTakeout && (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            🥡 Takeout
          </span>
        )}
        {location.allowDelivery && (
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            🚗 Delivery
          </span>
        )}
        {location.purchaseLimits && (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            ⚠️ Purchase Limits
          </span>
        )}
      </div>
    </div>
  );
}