/**
 * Optional Firestore collection prefix for ephemeral QA.
 */
function collectionPrefix() {
  return process.env.CMS_COLLECTION_PREFIX || "";
}

function cmsCollection(name) {
  if (!name) return name;
  const prefix = collectionPrefix();
  if (!prefix) return name;
  if (String(name).startsWith(prefix)) return name;
  return `${prefix}${name}`;
}

module.exports = { collectionPrefix, cmsCollection };
