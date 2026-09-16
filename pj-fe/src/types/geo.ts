/**
 * Geographic hierarchy levels for navigation and context
 */
export enum GeoLevel {
  Country = 'country',
  City = 'city',
  District = 'district',
  Ward = 'ward',
}

/**
 * Child node reference in the geographic hierarchy
 * Used to represent available options at the current level
 */
export interface GeoChild {
  /** Unique slug identifier (e.g., "ha-noi", "quan-1") */
  id: string;
  /** Display name for the geographic location (e.g., "Hà Nội") */
  name: string;
  /** Geographic level of this child */
  level: GeoLevel;
  /** Path array to reach this child (e.g., ["ha-noi"], ["ha-noi", "ba-dinh"]) */
  path: string[];
}

/**
 * Current position within the geographic hierarchy tree
 * Represents the complete navigation context including ancestors and available children
 */
export interface GeoContext {
  /** Current level in the geographic hierarchy */
  level: GeoLevel;
  /** Path from root to current node (empty if at root) */
  ancestors: GeoChild[];
  /** Available child locations from the current position */
  children: GeoChild[];
  /** Current node, null if at root country level */
  current: GeoChild | null;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  code: string;
  spaCount: number;
}

export interface District {
  id: string;
  cityId: string;
  name: string;
  slug: string;
  code: string;
  spaCount: number;
}

export interface Place {
  id: string;
  type: 'building' | 'street';
  name: string;
  slug: string;
  parentDistrictId: string;
  parentCityId: string;
  spaCount: number;
}

export interface GeoHierarchy {
  city?: City;
  district?: District;
  place?: Place;
}
