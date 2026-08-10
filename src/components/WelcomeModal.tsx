import { SignInButton } from '@clerk/clerk-react';
import { X, Heart, Star, MapPin, Search, Filter, Utensils } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <img
              src="/burger-week-2026/burger-week-horizontal.png"
              alt="Burger Week 2026"
              className="h-16 w-auto"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Welcome to Burger Week 2026!
          </h2>
          <p className="text-gray-600 text-center">
            Your ultimate guide to Portland's best burgers
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* CTA Section - Moved to top */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get the Most Out of Burger Week 2026</h3>
            <p className="text-gray-600 text-sm mb-4">
              Sign up to rate burgers, save favorites, and help the Portland burger community discover the best spots!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <SignInButton>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Sign Up / Sign In
                </button>
              </SignInButton>
              
              <a
                href="/burger-week-2026/donate"
                className="flex-1 bg-white hover:bg-gray-50 text-red-600 font-medium py-2 px-4 rounded-lg border border-red-600 transition-colors text-center"
              >
                Support the Project
              </a>
            </div>
          </div>

          {/* About */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Project</h3>
            <p className="text-gray-600 leading-relaxed">
              Burger Week 2026 is a passion project dedicated to cataloging and rating the best burgers
              in Portland, Oregon. We've visited dozens of restaurants, tried hundreds of burgers,
              and mapped them all out so you can find your next favorite spot.
            </p>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Interactive Map</h4>
                  <p className="text-sm text-gray-600">Explore burger spots across Portland with our interactive map</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Search className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Smart Search</h4>
                  <p className="text-sm text-gray-600">Find burgers by location, burger name, description, or restaurant name</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Filter className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Advanced Filters</h4>
                  <p className="text-sm text-gray-600">Filter by neighborhood, dietary needs, and more</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Ratings</h4>
                  <p className="text-sm text-gray-600">Find the best burgers in Portland</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Heart className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Favorites</h4>
                  <p className="text-sm text-gray-600">Save your favorite burgers for easy access</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Utensils className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Detailed Info</h4>
                  <p className="text-sm text-gray-600">Hours, pricing, dietary options, and more</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Made with ❤️ by fellow burger enthusiasts in Portland
          </p>
        </div>
      </div>
    </div>
  );
}