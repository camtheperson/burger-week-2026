import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton } from '@clerk/clerk-react';

interface FiltersProps {
  selectedNeighborhood: string;
  setSelectedNeighborhood: (value: string) => void;
  glutenFree: boolean;
  setGlutenFree: (value: boolean) => void;
  allowMinors: boolean;
  setAllowMinors: (value: boolean) => void;
  allowTakeout: boolean;
  setAllowTakeout: (value: boolean) => void;
  allowDelivery: boolean;
  setAllowDelivery: (value: boolean) => void;
  isOpenNow: boolean;
  setIsOpenNow: (value: boolean) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
  openAtEnabled: boolean;
  setOpenAtEnabled: (value: boolean) => void;
  openAtDate: string;
  setOpenAtDate: (value: string) => void;
  openAtTime: string;
  setOpenAtTime: (value: string) => void;
  neighborhoods: string[];
}

export default function Filters({
  selectedNeighborhood,
  setSelectedNeighborhood,
  glutenFree,
  setGlutenFree,
  allowMinors,
  setAllowMinors,
  allowTakeout,
  setAllowTakeout,
  allowDelivery,
  setAllowDelivery,
  isOpenNow,
  setIsOpenNow,
  selectedType,
  setSelectedType,
  favoritesOnly,
  setFavoritesOnly,
  openAtEnabled,
  setOpenAtEnabled,
  openAtDate,
  setOpenAtDate,
  openAtTime,
  setOpenAtTime,
  neighborhoods,
}: FiltersProps) {
  const clearFilters = () => {
    setSelectedNeighborhood('');
    setGlutenFree(false);
    setAllowMinors(false);
    setAllowTakeout(false);
    setAllowDelivery(false);
    setIsOpenNow(false);
    setSelectedType('');
    setFavoritesOnly(false);
    setOpenAtEnabled(false);
    setOpenAtDate('');
    setOpenAtTime('');
  };

  return (
    <div className="mt-4 p-4 md:p-4 bg-gray-50 rounded-lg space-y-6 md:space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold md:font-medium text-lg md:text-base text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-base md:text-sm text-burger-red hover:text-burger-red-light transition-colors px-2 py-1"
        >
          Clear All
        </button>
      </div>

      <label className="flex items-center py-1 cursor-pointer">
        <input
          type="checkbox"
          checked={isOpenNow}
          onChange={(e) => setIsOpenNow(e.target.checked)}
          className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-burger-red focus:ring-burger-red"
        />
        <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Open Now</span>
      </label>

      {/* Nick's unnecessarily complicated Open At filter */}
      <div className="space-y-3 md:space-y-2">
        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={openAtEnabled}
            onChange={(e) => setOpenAtEnabled(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-burger-red focus:ring-burger-red"
          />
          <img
            src="/burger-week-2026/nick-face.png"
            alt="Nick"
            className="w-5 h-7 mr-2 rounded object-cover"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Nick's unnecessarily complicated Open At filter</span>
        </label>
        
        {openAtEnabled && (
          <div className="ml-8 md:ml-6 space-y-3 md:space-y-2">
            <div>
              <label htmlFor="openAtDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                id="openAtDate"
                type="date"
                value={openAtDate}
                onChange={(e) => setOpenAtDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-burger-red focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="openAtTime" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                id="openAtTime"
                type="time"
                value={openAtTime}
                onChange={(e) => setOpenAtTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-burger-red focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      <Authenticated>
        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">❤️ My Favorites Only</span>
        </label>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center py-1">
          <input
            type="checkbox"
            disabled
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 bg-gray-100 cursor-not-allowed"
          />
          <span className="text-base md:text-sm text-gray-400 font-medium md:font-normal">
            ❤️ My Favorites Only •{' '}
            <SignInButton>
              <button className="text-burger-red hover:text-burger-red-light underline">
                Sign in
              </button>
            </SignInButton>
          </span>
        </div>
      </Unauthenticated>

      {/* Neighborhood Filter */}
      <div>
        <label className="block text-base md:text-sm font-medium text-gray-700 mb-2 md:mb-1">
          Neighborhood
        </label>
        <select
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
          className="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>
              {neighborhood}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label className="block text-base md:text-sm font-medium text-gray-700 mb-2 md:mb-1">
          Burger Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="meat">Meat</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
        </select>
      </div>

      {/* Dietary & Accessibility Options */}
      <div className="space-y-4 md:space-y-2">
        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={glutenFree}
            onChange={(e) => setGlutenFree(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-burger-red focus:ring-burger-red"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Gluten Free Options</span>
        </label>

        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={allowMinors}
            onChange={(e) => setAllowMinors(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-burger-red focus:ring-burger-red"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Family Friendly</span>
        </label>

        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={allowTakeout}
            onChange={(e) => setAllowTakeout(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-burger-red focus:ring-burger-red"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Takeout Available</span>
        </label>

        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={allowDelivery}
            onChange={(e) => setAllowDelivery(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-burger-red focus:ring-burger-red"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Delivery Available</span>
        </label>
      </div>
    </div>
  );
}