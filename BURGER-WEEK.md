# Burger Week 2026 — Status & Next Steps

This repo is a copy of `~/Sites/wingman` (last year's Wing Week map), rebranded
and re-scraped for Portland Mercury's Burger Week 2026. This file exists so a
fresh Claude Code session in this directory has full context without
re-deriving it from git log.

## Current state

Two commits exist:
1. Initial copy + wing→burger rename (branding, base paths, identifiers, copy).
2. Data scrape/fix pass + map improvements (see below).

**Nothing has been pushed to Convex.** There is no Convex project, no Clerk
app, and no GitHub repo for this project yet — all still need to be created
by hand (see "Next steps").

## Data

`data/items.json` has 123 items scraped from the live EverOut Burger Week
2026 page (`FOOD_WEEK_URL` in `.env.local`):
- 119/123 geocoded. **4 restaurants have no address and thus no map pin**:
  `2NW5`, `Arch Bridge Taphouse`, one of `Ate-Oh-Ate`'s three locations, and
  `Bar Bar`. EverOut's page never listed a street address for these — would
  need manual address lookup + a one-off geocode if you want them pinned.
- 123/123 have images (`public/images/`, orphaned old wing-week images were
  deleted).
- No duplicate `itemKey`s. One legitimate duplicate `(restaurantName,
  itemName)` pair: `Ate-Oh-Ate` runs the same "Paniolo Burger" at 3 different
  addresses — `processJsonToLocations` groups by name+address (not just
  name) specifically so this doesn't collapse onto one pin.
- Two new fields this year that last year's scraper didn't have:
  `vegSubstitute` (bool) and `vegSurcharge` (string) — threaded through
  `data/items.json` → `JsonItem`/`LocationItem` types → `jsonDataProcessor.ts`
  → `convex/schema.ts` (`locationItems.vegSubstitute`/`vegSurcharge`) →
  `convex/migrations.ts` (`migrateItemData`) → displayed in `ItemDisplay.tsx`.
- Rerunning `npm run scrape` is safe/idempotent; it merges onto existing
  `data/items.json` and preserves already-geocoded lat/lng for matching
  `(restaurantName, itemName)` pairs. `npm run scrape-images` is also
  idempotent — it skips items whose `image` path already starts with
  `/burger-week-2026/images/`.

## Bugs found and fixed (don't reintroduce these)

- **`src/main.tsx` crashed the whole app to a white screen** with the blank
  Convex/Clerk env values this repo intentionally ships with pre-setup.
  `ConvexReactClient` throws synchronously on `undefined`/non-URL addresses;
  Clerk's `ClerkProvider` throws synchronously on a malformed publishable
  key. Fixed with well-formed-but-inert placeholders (`VITE_CONVEX_URL` in
  `.env.local`, and a hardcoded fallback in `main.tsx` for the Clerk key).
  Convex only opens a connection lazily when a query actually runs — combined
  with the login-gating below, anonymous visitors never trigger it even with
  the placeholder URL in place.
- **The Clerk key fallback in `main.tsx` was hardcoded to wingman's real test
  key** (copied over from the original repo) — this repo would have silently
  authenticated against the *old* Wingman Clerk project. Replaced with an
  obviously-fake placeholder in the same format.
- **`processJsonToLocations` grouped locations by `restaurantName` alone**,
  so a chain running the same item at multiple addresses collapsed onto a
  single pin (only matters for `Ate-Oh-Ate` this year, see above). Now groups
  by `restaurantName + address`.
- **Convex was queried on every anonymous page load** (`getItemEnrichmentData`
  did full unindexed table scans regardless of auth state) — contradicts the
  original goal of not hitting Convex until login. `Map.tsx`/`List.tsx` now
  pass `"skip"` to those queries when `useConvexAuth().isAuthenticated` is
  false, and `processJsonToLocations` defaults to `{}` enrichment so the base
  map/list still renders instantly for anonymous visitors.
- **`scripts/migrate-data.js` sent the raw JSON item (including `image`,
  `imageUrl`, `itemKey`) straight to `migrations:migrateItemData`**, whose
  Convex validator only accepts the base fields — every batch failed with
  `ArgumentValidationError` on the very first item. Fixed by mapping to only
  the accepted fields for that call, then added a second pass that calls the
  previously-unused `migrations:populateItemKeys` mutation so `itemKey`
  actually lands on `locationItems` — without it, `getItemEnrichmentData`
  (ratings/favorites lookup) silently matched nothing for every item, and
  `setRating`/`toggleFavorite` would have failed since the frontend falls
  back to a fake `temp-${itemKey}` id when enrichment finds no match.
- **`migrations:migrateItemData` grouped locations by `restaurantName` alone**
  (same bug as `processJsonToLocations`, but that fix never made it into the
  Convex-side migration) — collapsed `Ate-Oh-Ate`'s 3 addresses onto 1
  Convex location (124 unique `restaurantName+address` pairs in the JSON
  produced only 121 Convex `locations` rows). This matters because
  `ItemDetail.tsx` queries `getLocationById` by real Convex location id, so
  2 of those 3 pages would have shown the wrong address/hours. Fixed to group
  by `restaurantName + address`, matching the client. `populateItemKeys` had
  the identical restaurant-name-only lookup bug (would have scrambled which
  of Ate-Oh-Ate's 3 "Paniolo Burger" rows got which `itemKey`) — fixed the
  same way. Required wiping and re-running the migration (added
  `migrations:clearAllLocationData`, a one-off utility for exactly this —
  safe to reuse for future re-migrations since `migrateItemData` always
  inserts rather than upserting).

## Map improvements made

- Marker clustering (`react-leaflet-cluster`) for the ~119 pins.
- Removed a dead "immediate pin" dual-rendering path in `Map.tsx` — it used
  to render faded placeholder pins while "detailed" Convex data loaded, but
  since Map/List now share one JSON-pipeline data source, both pin sets were
  always identical on every render; the coordinate-epsilon matching between
  them was unreachable code, not just fragile.
- `Map.tsx` now reuses `LocationDetailsModal` (already used by `List.tsx`)
  instead of a second, duplicated inline overlay implementation.
- `LocationCard.tsx`'s "Open Now" badge now uses the shared, more correct
  `checkIfOpenNow` from `utils/timeUtils.ts` (handles Pacific time properly
  and overnight hours) instead of its own separate, simpler regex parser.
- `ItemDetail.tsx`'s star rating and favorite heart button rendered but had
  no click handlers — wired up to the existing `ItemRatingControlsWrapper`
  (`setRating`/`toggleFavorite` mutations), matching the pattern already used
  in `ItemDisplay.tsx`.

## Known follow-ups not done (explicitly out of scope so far)

- **Brand art is still wingman's pixels.** `public/burger-week*.png/jpg`
  (logo, icon, horizontal lockup, OG image) were renamed but not redesigned —
  need real Burger Week artwork.
- **`ItemDetail.tsx`'s per-user rating/favorite state isn't populated** —
  `convex/locations.ts`'s `getLocationById` doesn't look up the current
  user's existing rating/favorite for each item (unlike `getItemEnrichmentData`
  used by Map/List), so the stars always render empty even if you've already
  rated. Rating still works (the mutation fires correctly), it just won't
  show your prior rating on reload. Would need `getLocationById` to also
  fetch per-item user rating/favorite by identity, mirroring
  `getItemEnrichmentData`'s pattern.
- **`timeUtils.ts` hardcodes a PDT (UTC-7) offset** for "is it open now" —
  will be wrong for a chunk of the year (PST) and isn't a real timezone
  library. Flagged during planning, not fixed (pre-existing, carried over
  from wingman).
- **`Navigation.tsx` → `Map.tsx` mobile-filter coupling via a raw
  `window.dispatchEvent(new CustomEvent('openMobileFilters'))`** — works but
  is a global-event code smell. Flagged during planning, not fixed.
- 27 npm audit vulnerabilities (1 low, 3 moderate, 19 high, 4 critical) —
  inherited from wingman's dependency tree, not evaluated for this project.
- **`scripts/scrape-images.js` generates image filenames and JSON write-back
  keys from `restaurantName + itemName` only, not `+ address`** — same bug
  family as the location-grouping fixes above, but not fixed here since it
  doesn't affect Convex correctness (`updateItemImage` always targets the
  right row via a real, unique `_id`). It only means `Ate-Oh-Ate`'s 3
  locations (see above) share one cached image file/filename
  (`ate_oh_ate_paniolo_burger.jpg`) instead of 3 distinct ones — harmless
  while they're the same promo photo, but would silently misassign images if
  a future multi-location chain's photos ever differ per address.

## Next steps (in order)

1. ~~**Create the Convex project**~~ — done 2026-08-10. `npx convex dev` ran
   against team `camtheperson`, project `burger-week-2026`, deployment
   `cool-cow-555`. `.env.local` now has real `CONVEX_DEPLOYMENT`/
   `VITE_CONVEX_URL` values (no longer placeholders). Schema pushed, all
   indexes built. `convex dev` printed one expected error —
   `CLERK_JWT_ISSUER_DOMAIN` not set — which step 2 resolves.
2. ~~**Create a Clerk app**~~ — done 2026-08-10. App name/instance is
   `exciting-tahr-93`. `VITE_CLERK_PUBLISHABLE_KEY` and
   `CLERK_JWT_ISSUER_DOMAIN` are set in `.env.local`, and
   `CLERK_JWT_ISSUER_DOMAIN` is also set as a Convex dev-deployment env var
   (`npx convex env set`) since `convex/auth.config.ts` reads it
   server-side, separately from the Vite-side `.env.local` value. `npx
   convex dev --once` now completes with no auth-config error. (Google
   OAuth client `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` still optional, not
   set up — only needed for Google sign-in.)
3. ~~**Re-review `data/items.json`**~~ — done 2026-08-11. All 4 previously
   address-less restaurants (`2NW5`, `Arch Bridge Taphouse`, one `Ate-Oh-Ate`
   location, `Bar Bar`) now have real, geocoded addresses; verified 124/124
   items have both an address and lat/lng.
4. ~~**Migrate**~~ — done 2026-08-10, re-run 2026-08-11 after the address
   fix. `npm run migrate` pushed all 124 items to the `cool-cow-555` dev
   deployment (`locations:count` → 124, `locations:countItems` → 165, all
   124 itemKeys verified matched via `getItemEnrichmentData`). Two real bugs
   were found and fixed in `convex/migrations.ts` along the way — see "Bugs
   found and fixed" below. `npm run scrape-images` also re-run against the
   real Convex deployment — 165/165 items got `updateItemImage` mutations
   confirmed applied (spot-checked via `getLocationsForScraping`, 0 items
   missing an image). See "Bugs found and fixed" for one latent
   filename-collision issue found in that script (not blocking).
5. **Create a GitHub repo**, add `CONVEX_DEPLOY_KEY`/`VITE_CONVEX_URL`/
   `VITE_CLERK_PUBLISHABLE_KEY` as repo secrets, push — `.github/workflows/`
   is already set up for GitHub Pages + Convex deploy on push to `main`
   (reused as-is from wingman).
6. Commission or generate real Burger Week branding to replace the
   `burger-week*.png/jpg` placeholders in `public/`.

## Verifying locally right now (no Convex/Clerk needed)

```bash
npm install
npm run dev
```

Map and List pages render fully from `data/items.json` with zero Convex
calls before sign-in — this was tested with Playwright against the dev
server (clustering renders, search/filters work, the shared detail modal
opens with images/description). Sign-in won't work until step 2 above is
done; that's expected, not a bug.
