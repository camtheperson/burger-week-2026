import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Filter, Search, X, Locate } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import Filters from '../components/Filters';
import RestaurantInfo from '../components/RestaurantInfo';
import RestaurantHours from '../components/RestaurantHours';
import ItemDisplay from '../components/ItemDisplay';
import type { LocationWithItems, LocationItem, JsonLocationPin, JsonItem } from '../types';
import itemsData from '../../data/items.json';
import { processJsonToLocations, filterJsonLocations, locationsToJsonPins } from '../utils/jsonDataProcessor';
import 'leaflet/dist/leaflet.css';



// Custom marker icons
const defaultMarkerIcon = new L.Icon({
  iconUrl: '/burger-week-2026/marker.png',
  iconRetinaUrl: '/burger-week-2026/marker.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  shadowSize: [40, 40]
});

const favoriteMarkerIcon = new L.Icon({
  iconUrl: '/burger-week-2026/marker-favorite.png',
  iconRetinaUrl: '/burger-week-2026/marker-favorite.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  shadowSize: [40, 40]
});

// Immediate (loading) marker - slightly smaller to indicate it's temporary
const immediateMarkerIcon = new L.Icon({
  iconUrl: '/burger-week-2026/marker.png',
  iconRetinaUrl: '/burger-week-2026/marker.png',
  iconSize: [35, 35], // Slightly smaller
  iconAnchor: [17.5, 35],
  popupAnchor: [0, -35],
  shadowSize: [35, 35],
  className: 'immediate-marker' // Add CSS class for potential styling
});

// User location marker - distinctive blue dot
const userLocationIcon = new L.DivIcon({
  html: `<div style="
    width: 16px;
    height: 16px;
    background: #3B82F6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0,0,0,0.2);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  className: 'user-location-marker'
});

// Map controller component for handling map interactions
function MapController({ selectedLocation, userLocation }: { selectedLocation: LocationWithItems | null; userLocation: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      map.setView([selectedLocation.latitude, selectedLocation.longitude], 16, {
        animate: true,
        duration: 1
      });
    }
  }, [selectedLocation, map]);

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 15, {
        animate: true,
        duration: 1
      });
    }
  }, [userLocation, map]);

  return null;
}

export default function Map() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [glutenFree, setGlutenFree] = useState(false);
  const [allowMinors, setAllowMinors] = useState(false);
  const [allowTakeout, setAllowTakeout] = useState(false);
  const [allowDelivery, setAllowDelivery] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [openAtEnabled, setOpenAtEnabled] = useState(false);
  const [openAtDate, setOpenAtDate] = useState('');
  const [openAtTime, setOpenAtTime] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithItems | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const selectedLocationRef = useRef(selectedLocation);
  
  // Keep ref in sync with state
  selectedLocationRef.current = selectedLocation;

  // Handle geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        let message = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };


  // Listen for mobile filter button clicks from Navigation
  useEffect(() => {
    const handleMobileFilterClick = () => {
      setShowMobileFilters(true);
    };
    
    window.addEventListener('openMobileFilters', handleMobileFilterClick);
    return () => window.removeEventListener('openMobileFilters', handleMobileFilterClick);
  }, []);





  // Use lightweight pins query for map markers only
  // Get neighborhoods directly from JSON data
  const neighborhoods = useMemo(() => {
    const allNeighborhoods = (itemsData as JsonItem[]).map(item => item.neighborhood);
    return [...new Set(allNeighborhoods)].sort();
  }, []);

  // Get all unique item keys for enrichment data query
  const itemKeys = useMemo(() => {
    return [...new Set((itemsData as JsonItem[]).map(item => item.itemKey))];
  }, []);

  // Get enrichment data (ratings/favorites) for all items
  const enrichmentData = useQuery(api.locations.getItemEnrichmentData, {
    itemKeys
  });

  // Get favorited items for the current user (still need this for favorites filter)
  const favoriteItems = useQuery(api.favorites.getFavorites, {});

  // Process JSON data into locations with enrichment data
  const locations: LocationWithItems[] = useMemo(() => {
    if (!enrichmentData) return [];
    
    // Convert JSON items to location structure
    const allLocations = processJsonToLocations(itemsData as JsonItem[], enrichmentData);
    
    // Apply filters
    const favoriteItemIds = new Set(favoriteItems?.map(fav => fav.itemId) || []);
    
    return filterJsonLocations(allLocations, {
      searchTerm: searchTerm || undefined,
      neighborhood: selectedNeighborhood || undefined,
      glutenFree: glutenFree || undefined,
      allowMinors: allowMinors || undefined,
      allowTakeout: allowTakeout || undefined,
      allowDelivery: allowDelivery || undefined,
      isOpenNow: isOpenNow || undefined,
      openAtEnabled: openAtEnabled || undefined,
      openAtDate: openAtDate || undefined,
      openAtTime: openAtTime || undefined,
      type: selectedType ? selectedType as 'meat' | 'vegetarian' | 'vegan' : undefined,
      favoritesOnly: favoritesOnly || undefined,
    }, favoriteItemIds);
  }, [enrichmentData, favoriteItems, searchTerm, selectedNeighborhood, glutenFree, allowMinors, allowTakeout, allowDelivery, isOpenNow, openAtEnabled, openAtDate, openAtTime, selectedType, favoritesOnly]);

  // Convert locations to pins for map display
  const finalPins: JsonLocationPin[] = useMemo(() => {
    return locationsToJsonPins(locations);
  }, [locations]);

  // Clear favorites filter when user logs out (favoriteItems becomes null/empty)
  useEffect(() => {
    if (favoritesOnly && (!favoriteItems || favoriteItems.length === 0)) {
      setFavoritesOnly(false);
    }
  }, [favoriteItems, favoritesOnly, setFavoritesOnly]);

  const handleLocationClick = (location: LocationWithItems) => {
    setSelectedLocation(location);
    // Update URL to include the selected location ID
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('location', location._id);
    setSearchParams(newSearchParams);
  };

  // Handle closing the selected location
  const handleLocationClose = () => {
    // Only update the URL - let the useEffect handle clearing the state
    // This prevents the race condition where state is cleared but URL still has location
    setSearchParams(params => {
      const newParams = new URLSearchParams(params);
      newParams.delete('location');
      return newParams;
    });
  };

  // Sync selected location with URL params
  useEffect(() => {
    const locationId = searchParams.get('location');
    const currentSelected = selectedLocationRef.current;
    
    if (locationId && locations) {
      // URL has a location ID - find and set it if different from current
      const location = locations.find(loc => loc && loc._id === locationId);
      if (location && (!currentSelected || currentSelected._id !== locationId)) {
        setSelectedLocation(location);
      }
      // Handle temp location upgrade: if current selection is a temp location,
      // try to find the matching real location by restaurant name and coordinates
      else if (currentSelected && currentSelected._id.startsWith('temp-') && !location) {
        const matchingLocation = locations.find(loc => 
          loc && 
          loc.restaurantName === currentSelected.restaurantName &&
          loc.latitude && loc.longitude &&
          Math.abs(loc.latitude - currentSelected.latitude!) < 0.001 && 
          Math.abs(loc.longitude - currentSelected.longitude!) < 0.001
        );
        
        if (matchingLocation) {
          // Upgrade temp location to real location
          setSelectedLocation(matchingLocation);
          // Update URL with real location ID
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('location', matchingLocation._id);
          setSearchParams(newSearchParams);
        }
      }
    } else if (!locationId) {
      // URL has no location ID - clear selection if we have one
      if (currentSelected) {
        setSelectedLocation(null);
      }
    }
  }, [searchParams, locations, setSearchParams]); // Now we can exclude selectedLocation from deps

  // Update selectedLocation when locations data changes (e.g., after rating/favorite mutations)
  // This ensures the modal shows updated rating/favorite data
  useEffect(() => {
    const currentSelected = selectedLocationRef.current;
    if (currentSelected && locations) {
      const updatedLocation = locations.find(loc => loc._id === currentSelected._id);
      if (updatedLocation && updatedLocation !== currentSelected) {
        setSelectedLocation(updatedLocation);
      }
    }
  }, [locations]);

  // Check if a location has any favorited items
  const locationHasFavorites = (location: LocationWithItems): boolean => {
    if (!favoriteItems || !location.items) return false;
    
    const favoriteItemIds = new Set(favoriteItems.map(fav => fav.itemId));
    return location.items.some(item => favoriteItemIds.has(item._id));
  };

  const filteredLocations = locations.filter((location) =>
    location &&
    location.latitude !== undefined &&
    location.longitude !== undefined &&
    location.restaurantName &&
    location.neighborhood
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:block md:w-1/3 bg-white border-r overflow-y-auto">
        {/* Search and Filters */}
        <div className="p-4 border-b">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search locations, burgers, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </button>

          {showFilters && (
            <Filters
              selectedNeighborhood={selectedNeighborhood}
              setSelectedNeighborhood={setSelectedNeighborhood}
              glutenFree={glutenFree}
              setGlutenFree={setGlutenFree}
              allowMinors={allowMinors}
              setAllowMinors={setAllowMinors}
              allowTakeout={allowTakeout}
              setAllowTakeout={setAllowTakeout}
              allowDelivery={allowDelivery}
              setAllowDelivery={setAllowDelivery}
              isOpenNow={isOpenNow}
              setIsOpenNow={setIsOpenNow}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              favoritesOnly={favoritesOnly}
              setFavoritesOnly={setFavoritesOnly}
              openAtEnabled={openAtEnabled}
              setOpenAtEnabled={setOpenAtEnabled}
              openAtDate={openAtDate}
              setOpenAtDate={setOpenAtDate}
              openAtTime={openAtTime}
              setOpenAtTime={setOpenAtTime}
              neighborhoods={neighborhoods || []}
            />
          )}
        </div>

        {/* Locations List */}
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-4">
            {locations?.length || 0} locations found
          </div>
          
          {locations?.map((location) => location && (
            <LocationCard
              key={location._id}
              location={location}
              onClick={() => handleLocationClick(location)}
              isSelected={selectedLocation?._id === location._id}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative w-full">        
        <MapContainer
          center={[45.5152, -122.6784]} // Portland coordinates
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <MapController selectedLocation={selectedLocation} userLocation={userLocation} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* 
            Render immediate pins from JSON data for instant loading.
            These show up immediately while detailed data loads from Convex.
            They are slightly smaller and faded to indicate they're temporary.
          */}
          {finalPins.map((pin, index) => {
            // Check if this pin has detailed data loaded from Convex
            // Use a more precise coordinate match to avoid duplicate pins
            const detailedLocation = filteredLocations.find(loc => 
              loc && 
              Math.abs(loc.latitude! - pin.latitude) < 0.0001 && 
              Math.abs(loc.longitude! - pin.longitude) < 0.0001 &&
              loc.restaurantName === pin.restaurantName
            );
            
            // Only render immediate pin if detailed version isn't available yet
            if (!detailedLocation) {
              return (
                <Marker
                  key={`immediate-${index}`}
                  position={[pin.latitude, pin.longitude]}
                  icon={immediateMarkerIcon}
                  eventHandlers={{
                    click: () => {
                      // Create a temporary location object for display
                      const tempLocation = {
                        _id: `temp-${index}`,
                        restaurantName: pin.restaurantName,
                        neighborhood: pin.neighborhood,
                        address: pin.address,
                        latitude: pin.latitude,
                        longitude: pin.longitude,
                        items: [],
                        hours: [],
                        _creationTime: Date.now(),
                        allowMinors: false,
                        allowTakeout: false,
                        allowDelivery: false,
                        purchaseLimits: false,
                        phone: null,
                        website: null,
                        updatedAt: Date.now()
                      } as unknown as LocationWithItems;
                      handleLocationClick(tempLocation);
                    },
                  }}
                />
              );
            }
            return null;
          })}
          
          {/* Render detailed pins from Convex data (these will overlay the immediate pins) */}
          {filteredLocations.map((location) => location && (
            <Marker
              key={location._id}
              position={[location.latitude!, location.longitude!]}
              icon={
                selectedLocation?._id === location._id 
                  ? favoriteMarkerIcon 
                  : locationHasFavorites(location)
                    ? favoriteMarkerIcon
                    : defaultMarkerIcon
              }
              eventHandlers={{
                click: () => handleLocationClick(location),
              }}
            />
          ))}
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={userLocationIcon}
              zIndexOffset={1000} // Ensure it appears above other markers
            />
          )}
        </MapContainer>

        {/* Locate Me Button */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className={`absolute bottom-28 right-4 md:bottom-4 z-40 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-200 ${
            isLocating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Locate me"
        >
          <Locate className={`w-5 h-5 text-gray-700 ${
            isLocating ? 'animate-spin' : ''
          }`} />
        </button>

        {/* Location Details Overlay */}
        {selectedLocation && (
          <>
            {/* Mobile: Full screen overlay */}
            <div className="md:hidden fixed inset-0 bg-white z-20 flex flex-col mobile-footer-padding" style={{ top: '4rem' }}>
              {/* Mobile Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {selectedLocation.restaurantName}
                </h3>
                <button
                  onClick={handleLocationClose}
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
            
            {/* Desktop: Larger overlay with mobile-like structure */}
            <div className="hidden md:block absolute inset-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 flex flex-col">
              {/* Desktop Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {selectedLocation.restaurantName}
                </h3>
                <button
                  onClick={handleLocationClose}
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
          </>
        )}
        
        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
            <div className="bg-white w-full max-h-[80vh] rounded-t-xl overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Filters & Search</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search locations, burgers, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <Filters
                  selectedNeighborhood={selectedNeighborhood}
                  setSelectedNeighborhood={setSelectedNeighborhood}
                  glutenFree={glutenFree}
                  setGlutenFree={setGlutenFree}
                  allowMinors={allowMinors}
                  setAllowMinors={setAllowMinors}
                  allowTakeout={allowTakeout}
                  setAllowTakeout={setAllowTakeout}
                  allowDelivery={allowDelivery}
                  setAllowDelivery={setAllowDelivery}
                  isOpenNow={isOpenNow}
                  setIsOpenNow={setIsOpenNow}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  favoritesOnly={favoritesOnly}
                  setFavoritesOnly={setFavoritesOnly}
                  openAtEnabled={openAtEnabled}
                  setOpenAtEnabled={setOpenAtEnabled}
                  openAtDate={openAtDate}
                  setOpenAtDate={setOpenAtDate}
                  openAtTime={openAtTime}
                  setOpenAtTime={setOpenAtTime}
                  neighborhoods={neighborhoods || []}
                />
                
                {/* Results count */}
                <div className="text-base text-gray-500 mt-6 mb-4">
                  {locations?.length || 0} locations found
                </div>
                
                {/* Quick actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 bg-burger-red text-white py-3 px-4 rounded-lg font-medium text-lg hover:bg-burger-red-light transition-colors"
                  >
                    View Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}