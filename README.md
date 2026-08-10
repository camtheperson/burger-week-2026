# 🍔 Burger Week 2026 - Portland Burger Week Map

An interactive map and comprehensive guide for Portland Mercury's Burger Week 2026, built with React, TypeScript, Convex, and Leaflet. Discover the best burger offerings across Portland, rate your favorites, and connect with the burger community.

![Burger Week 2026 Logo](public/burger-week.png)

## 🌟 Features

### Interactive Map
- **Browse Locations**: Interactive map showing all participating restaurants
- **Search & Filter**: Find specific restaurants, burgers, or neighborhoods
- **Real-time Updates**: Live data from Convex backend
- **Location Details**: Detailed popups with burger information

### List View
- **Comprehensive Directory**: Browse all locations in a clean list format
- **Advanced Sorting**: Sort by name, rating, or neighborhood
- **Rich Information**: Full restaurant details, hours, and contact info

### User Features
- **Authentication**: Sign up/sign in with email or password
- **Favorites**: Save your favorite burger locations and items
- **Ratings & Reviews**: Rate burgers from 0-5 stars in half-star increments
- **Personalized Experience**: Track your favorites across map and list views

### Filtering Options
- **Neighborhood**: Filter by Portland neighborhoods
- **Open Now**: Show only currently open restaurants
- **Dietary Options**: Filter for gluten-free options
- **Service Type**: Takeout, delivery, family-friendly options
- **Real-time Status**: Dynamic filtering based on current hours

### Community Support
- **Donation Portal**: Support the app with Apple Pay, Google Pay, or card
- **Anonymous Donations**: Option for anonymous contributions
- **Impact Transparency**: Clear breakdown of how donations are used

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Leaflet** for interactive maps
- **Lucide React** for icons

### Backend & Database
- **Convex** for real-time backend and database
- **Convex Auth** for authentication
- **Real-time Subscriptions** for live data updates

### Maps & Geolocation
- **Leaflet.js** with OpenStreetMap tiles
- **React Leaflet** for React integration
- **Custom Markers** and popups (clustered for dense neighborhoods)
- **Geolocation API** for user location

### Authentication
- **Convex Auth** with email/password
- **Secure Session Management**
- **User Profile Management**

## 📊 Database Schema

### Core Tables
- **locations**: Restaurant information and metadata
- **locationItems**: Specific burger offerings at each location
- **locationHours**: Operating hours during Burger Week
- **users**: User accounts and profiles

### Engagement Tables
- **favorites**: User-favorited burger items
- **itemRatings**: User ratings and reviews (0-5 stars)
- **donations**: Community support tracking

## Features

- **React 19** with TypeScript for type-safe UI development
- **Vite** for fast development and optimized builds
- **Convex** for real-time backend functionality
- **GitHub Pages** deployment with automated CI/CD
- **ESLint** for code quality

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/burger-week-2026.git
cd burger-week-2026
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```

4. Start the development server:
```bash
npm run dev
```

## Data Pipeline

This project scrapes its listing data from the EverOut Burger Week event page rather than hand-entering it. Before pushing anything to Convex, run and review each step locally:

```bash
npm run scrape         # scrape data/items.json + data/summary.json from FOOD_WEEK_URL
npm run geocode        # fill in latitude/longitude via Google Geocoding
npm run scrape-images  # download item photos into public/images/
```

Only after reviewing the resulting `data/items.json` (counts, geocoding failures, duplicate `itemKey`s, sample entries) should you run `npm run migrate` to push to Convex — this avoids paying for repeated pushes while iterating on scraper fixes.

## Deployment to GitHub Pages

### Automatic Deployment
The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the main branch.

#### Setup:
1. Go to your repository settings
2. Navigate to Pages → Source → GitHub Actions
3. Add your Convex URL as a repository secret:
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_CONVEX_URL` with your Convex deployment URL

### Manual Deployment
You can also deploy manually:
```bash
npm run deploy
```

## Project Structure

```
burger-week-2026/
├── src/                 # React application source
├── convex/              # Convex backend functions
├── public/              # Static assets
├── dist/                # Build output (generated)
├── .github/workflows/   # GitHub Actions
└── ...
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
