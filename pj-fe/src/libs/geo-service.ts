import type { GeoChild, GeoContext } from '@/types/geo';
import { GeoLevel } from '@/types/geo';

/**
 * Node structure for the geographic hierarchy tree
 * Mirrors the GeoNode structure from vietnam.ts but typed for internal use
 */
interface GeoNode {
  slug: string;
  name: string;
  level: GeoLevel;
  children?: GeoNode[];
}

/**
 * Find a node in the geo tree by traversing with a path of slugs
 * @param slugs Array of slugs to traverse (e.g., ["ha-noi", "ba-dinh"])
 * @param tree Root node to search from
 * @returns The found node or undefined if not found
 */
function findNodeByPath(slugs: string[], tree: GeoNode): GeoNode | undefined {
  if (slugs.length === 0) {
    return tree;
  }

  const [firstSlug, ...restSlugs] = slugs;
  const child = tree.children?.find((c) => c.slug === firstSlug);

  if (!child) {
    return undefined;
  }

  if (restSlugs.length === 0) {
    return child;
  }

  return findNodeByPath(restSlugs, child);
}

/**
 * Get the children of a geographic node
 * @param geoSegments Array of geo segments representing the path from root (e.g., ["ha-noi"] or ["ha-noi", "ba-dinh"])
 * @param geoData The root GEO data tree (typically VIETNAM_GEO)
 * @returns Array of child GeoChild objects with id, name, level
 * @throws Error if the path is invalid
 *
 * @example
 * // Get children of Hà Nội (cities within Vietnam)
 * const hanoi = getGeoChildren(['ha-noi'], VIETNAM_GEO);
 *
 * @example
 * // Get wards within Ba Đình district
 * const wards = getGeoChildren(['ha-noi', 'ba-dinh'], VIETNAM_GEO);
 *
 * @example
 * // Get all cities (root level)
 * const cities = getGeoChildren([], VIETNAM_GEO);
 */
export function getGeoChildren(geoSegments: string[], geoData: GeoNode): GeoChild[] {
  const node = findNodeByPath(geoSegments, geoData);

  if (!node) {
    return [];
  }

  return (node.children || []).map((child) => ({
    id: child.slug,
    name: child.name,
    level: child.level,
    path: [...geoSegments, child.slug],
  }));
}

/**
 * Build the complete geographic context from a path
 * Traverses the tree with the given segments and returns ancestors, current node, and children
 * @param geoSegments Array of geo path segments from URL (e.g., ["ha-noi"] or ["ha-noi", "ba-dinh"])
 * @param geoData The root GEO data tree (typically VIETNAM_GEO)
 * @returns GeoContext object with level, ancestors, children, and current
 *
 * @example
 * // Parse path to Hà Nội
 * const context = parseGeoContext(['ha-noi'], VIETNAM_GEO);
 * // Returns: { level: 'city', ancestors: [], children: [...districts], current: { id: 'ha-noi', name: 'Hà Nội', level: 'city' } }
 *
 * @example
 * // Parse path to Ba Đình district in Hà Nội
 * const context = parseGeoContext(['ha-noi', 'ba-dinh'], VIETNAM_GEO);
 * // Returns: { level: 'district', ancestors: [...], children: [...wards], current: {...} }
 *
 * @example
 * // Empty segments = country level
 * const context = parseGeoContext([], VIETNAM_GEO);
 * // Returns: { level: 'country', ancestors: [], children: [...cities], current: null }
 */
export function parseGeoContext(geoSegments: string[], geoData: GeoNode): GeoContext {
  // Handle empty segments - root country level
  if (geoSegments.length === 0) {
    return {
      level: GeoLevel.Country,
      ancestors: [],
      children: getGeoChildren([], geoData),
      current: null,
    };
  }

  // Build ancestors array by traversing the path progressively
  const ancestors: GeoChild[] = [];
  let currentPath: string[] = [];

  for (let i = 0; i < geoSegments.length - 1; i++) {
    currentPath = geoSegments.slice(0, i + 1);
    const node = findNodeByPath(currentPath, geoData);

    if (node) {
      ancestors.push({
        id: node.slug,
        name: node.name,
        level: node.level,
        path: currentPath,
      });
    }
  }

  // Get the current node
  const currentNode = findNodeByPath(geoSegments, geoData);

  if (!currentNode) {
    // Invalid path - return country level as fallback
    return {
      level: GeoLevel.Country,
      ancestors: [],
      children: getGeoChildren([], geoData),
      current: null,
    };
  }

  const current: GeoChild = {
    id: currentNode.slug,
    name: currentNode.name,
    level: currentNode.level,
    path: geoSegments,
  };

  // Get children of current node
  const children = getGeoChildren(geoSegments, geoData);

  return {
    level: currentNode.level,
    ancestors,
    children,
    current,
  };
}

/**
 * Build a complete URL with geographic segments and optional query parameters
 * @param baseUrl Base path without geo segments (e.g., "/en/massage")
 * @param geoSegments Array of geo segments to append (e.g., ["ha-noi"] or ["ha-noi", "ba-dinh"])
 * @param query Optional object of query parameters
 * @returns Full URL with geo path and query string (e.g., "/en/massage/ha-noi?gender=female")
 *
 * @example
 * // Build URL with single geo segment
 * buildGeoUrl('/en/massage', ['ha-noi']);
 * // Returns: "/en/massage/ha-noi"
 *
 * @example
 * // Build URL with multiple geo segments and query params
 * buildGeoUrl('/en/massage', ['ha-noi', 'ba-dinh'], { gender: 'female', priceRange: 'budget' });
 * // Returns: "/en/massage/ha-noi/ba-dinh?gender=female&priceRange=budget"
 *
 * @example
 * // Build URL without geo segments
 * buildGeoUrl('/en/massage', [], { gender: 'female' });
 * // Returns: "/en/massage?gender=female"
 */
export function buildGeoUrl(
  baseUrl: string,
  geoSegments: string[],
  query?: Record<string, string>,
): string {
  // Build the path with geo segments
  const pathParts = [baseUrl, ...geoSegments].filter(Boolean);
  const path = pathParts.join('/');

  // Build query string if query params are provided
  if (!query || Object.keys(query).length === 0) {
    return path;
  }

  const params = new URLSearchParams(query);
  const queryString = params.toString();

  return `${path}?${queryString}`;
}
