/**
 * Firestore strictly rejects documents with `undefined` values.
 * This helper removes any `undefined` properties recursively from objects and arrays.
 */
export function removeUndefined<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => removeUndefined(item)) as unknown as T;
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = removeUndefined(value);
      }
    }
    return cleanObj as T;
  }

  return data;
}
