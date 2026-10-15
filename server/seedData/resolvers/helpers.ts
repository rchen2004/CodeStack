/**
 * Resolves a single reference key to its corresponding object ID from a map.
 * @param key - The string key to resolve from the map (can be null).
 * @param map - Map containing the key-ObjectId pairs to resolve references from.
 * @param typeName - Name of the type being resolved (used in error messages).
 * @returns {T | null} - Resolved object of type T, or null if the key is null.
 * @throws {Error} - Throws an error if the key cannot be found in the map.
 */
function resolveSingleRef<T>(key: string | null, map: Map<string, T>, typeName: string): T | null {
  if (key === null) return null;

  const id = map.get(key);

  if (!id) throw new Error(`${typeName} ${key} not found in JSON.`);

  return id;
}

/**
 * Resolves an array of reference keys to their corresponding object IDs from a map.
 * @param keys - Array of string keys to resolve from the map.
 * @param map - Map containing the key-ObjectId pairs to resolve references from.
 * @param typeName - Name of the type being resolved (used in error messages).
 * @returns {T[]} - Array of resolved objects of type T.
 * @throws {Error} - Throws an error if any key cannot be found in the map.
 */
function resolveRefs<T>(keys: string[], map: Map<string, T>, typeName: string): T[] {
  return keys.map(key => resolveSingleRef(key, map, typeName)).filter(value => value !== null);
}

export { resolveSingleRef, resolveRefs };
