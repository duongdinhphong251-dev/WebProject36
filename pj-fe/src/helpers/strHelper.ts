export function deepClone<T>(obj: T, map = new WeakMap()): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  if (obj instanceof Map) {
    return new Map(Array.from(obj.entries()).map(([k, v]) => [deepClone(k), deepClone(v)])) as unknown as T;
  }
  if (obj instanceof Set) {
    return new Set(Array.from(obj.values()).map(v => deepClone(v))) as unknown as T;
  }
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (map.has(obj as object)) {
    return map.get(obj as object) as T;
  }

  const result: any = Array.isArray(obj) ? [] : {};
  map.set(obj as object, result);

  for (const key of Object.keys(obj)) {
    result[key] = deepClone((obj as any)[key], map);
  }

  return result;
}

export const checkIsFullDomain = (url: string): boolean => {
  const regex = /^https?:\/\//;
  return regex.test(url);
};

export const formatArrayToTemplateString = (arr: any, strJoin = ',') => {
  if (!arr || !arr.length) {
    return '';
  }
  return arr.filter(Boolean).join(strJoin);
};
