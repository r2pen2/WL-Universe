/**
 * Optional Firestore collection prefix for ephemeral QA.
 *
 * When CMS_COLLECTION_PREFIX is set (e.g. "qa-pr-57-"), CMS routes read/write
 * prefixed collections so prod data stays untouched. Prod leaves this unset.
 */
function collectionPrefix() {
  const raw = process.env.CMS_COLLECTION_PREFIX || "";
  return raw;
}

function cmsCollection(name) {
  if (!name) return name;
  const prefix = collectionPrefix();
  if (!prefix) return name;
  if (String(name).startsWith(prefix)) return name;
  return `${prefix}${name}`;
}

module.exports = { collectionPrefix, cmsCollection };
