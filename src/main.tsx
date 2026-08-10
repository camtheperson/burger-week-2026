import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import App from './App.tsx'

import './base.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

// Clerk Publishable Key - must come from env; there is no safe fallback since
// a real key would authenticate against someone else's Clerk project. This
// fallback only needs to satisfy Clerk's key-format check so the app doesn't
// crash before a real Clerk app is created; sign-in simply won't work until then.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_cGxhY2Vob2xkZXItbm90LXlldC1jb25maWd1cmVkLmNsZXJrLmFjY291bnRzLmRldiQ'

createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <App />
    </ConvexProviderWithClerk>
  </ClerkProvider>
)