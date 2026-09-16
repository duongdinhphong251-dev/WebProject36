/**
 * Generate a unique key for cart items
 */
export function generateUniqueKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}
