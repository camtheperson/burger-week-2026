import { useEffect } from 'react';
import { X } from 'lucide-react';
import RestaurantInfo from './RestaurantInfo';
import RestaurantHours from './RestaurantHours';
import ItemDisplay from './ItemDisplay';
import type { LocationWithItems, LocationItem } from '../types';

interface LocationDetailsModalProps {
  selectedLocation: LocationWithItems | null;
  onClose: () => void;
}

export default function LocationDetailsModal({ selectedLocation, onClose }: LocationDetailsModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedLocation) {
      // Store original body style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original body style when modal closes
        document.body.style.overflow = originalStyle;
      };
    }
  }, [selectedLocation]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!selectedLocation) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedLocation, onClose]);

  if (!selectedLocation) return null;

  return (
    <>
      {/* Mobile: Full screen overlay */}
      <div
        className="md:hidden fixed inset-0 bg-white flex flex-col"
        style={{ top: '4rem', zIndex: 1100 }}
        role="dialog" 
        aria-modal="true"
        tabIndex={-1}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            {selectedLocation.restaurantName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Restaurant Info */}
          <RestaurantInfo location={selectedLocation} />
          
          {/* Show loading state for temporary locations */}
          {selectedLocation._id.startsWith('temp-') && (
            <div className="p-8 text-center text-gray-500">
              <p>Loading detailed information...</p>
            </div>
          )}
          
          {/* Items with large images on mobile */}
          {selectedLocation.items && selectedLocation.items.length > 0 && (
            <div className="space-y-0">
              {selectedLocation.items.map((item: LocationItem) => (
                <ItemDisplay 
                  key={item._id} 
                  item={item} 
                  imageSize="large"
                  showFullDetails={true}
                />
              ))}
            </div>
          )}

          {/* Hours */}
          <RestaurantHours hours={selectedLocation.hours} />
        </div>
      </div>
      
      {/* Desktop: Modal with backdrop */}
      <div 
        className="hidden md:block fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{ zIndex: 1100 }}
        onClick={onClose}
        role="dialog" 
        aria-modal="true"
        onWheel={(e) => e.stopPropagation()}
      >
        <div 
          className="bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col max-w-4xl w-full max-h-[90vh] mx-auto"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
        {/* Desktop Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            {selectedLocation.restaurantName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Desktop Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Restaurant Info */}
          <RestaurantInfo location={selectedLocation} />
          
          {/* Show loading state for temporary locations */}
          {selectedLocation._id.startsWith('temp-') && (
            <div className="p-8 text-center text-gray-500">
              <p>Loading detailed information...</p>
            </div>
          )}
          
          {/* Items with medium-sized images on desktop */}
          {selectedLocation.items && selectedLocation.items.length > 0 && (
            <div className="space-y-0">
              {selectedLocation.items.map((item: LocationItem) => (
                <ItemDisplay 
                  key={item._id} 
                  item={item} 
                  imageSize="medium"
                  showFullDetails={true}
                />
              ))}
            </div>
          )}

          {/* Hours */}
          <RestaurantHours hours={selectedLocation.hours} />
        </div>
        </div>
      </div>
    </>
  );
}