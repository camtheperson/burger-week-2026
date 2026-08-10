/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as cleanup from "../cleanup.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as itemRatings from "../itemRatings.js";
import type * as locations from "../locations.js";
import type * as migrations from "../migrations.js";
import type * as utils_timeUtils from "../utils/timeUtils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  cleanup: typeof cleanup;
  favorites: typeof favorites;
  http: typeof http;
  itemRatings: typeof itemRatings;
  locations: typeof locations;
  migrations: typeof migrations;
  "utils/timeUtils": typeof utils_timeUtils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
