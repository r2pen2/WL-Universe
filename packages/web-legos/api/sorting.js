/**
 * @param {Object} object - Object to sort fields
 */
export function sortFieldsAlphabetically(object) {
  const sortedKeys = Object.keys(object).sort();
  const newObject = {};
  for (const key of sortedKeys) {
    newObject[key] = object[key];
  }
  return newObject;
}
