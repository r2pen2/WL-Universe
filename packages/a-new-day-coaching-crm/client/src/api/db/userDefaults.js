/**
 * The shape every `users/{id}` doc is expected to have, and the defaults for any field
 * a doc is missing. Shared by the client (dbUser.ts) and the server (routes/users.js),
 * which both read `users` directly -- keep it CommonJS with no imports so the server
 * can require() it straight out of client/src.
 *
 * Docs written by older versions of the app, or half-written by a failed sign-up, can
 * be missing whole sections; one such doc used to blank every admin roster.
 */
const USER_DEFAULTS = {
  invoices: [],
  admin: false,
  formAssignments: [],
  tools: {},
  numUnpaidInvoices: 0,
  syncCode: null,
  linkedAccounts: [],
  homework: [],
  subjects: {
    todo: {
      color: "#ffffff",
      title: "todo",
    },
  },
  documents: [],
  intents: [],
  resources: [],
  metadata: {
    lastSignIn: null,
  },
  personalData: {
    displayName: "",
    email: "",
    pfpUrl: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    role: "",
  },
  schoolInfo: {
    advisorName: "",
    advisorHref: "",
    advisorEmail: "",
    advisorOffice: "",
    LMSHref: "",
    LMSName: "",
    sessionNotes: "",
  },
  settings: {
    darkMode: false,
    priorityVerbosity: "Colors",     // HomeworkPriorityVerbosity.COLORS
    priorityPulseThreshold: "High",  // HomeworkPriority.HIGH
    homeworkLoaderType: "oval",      // HomeworkLoaderType.CIRCLE
    requireHomeworkDeleteConfirmation: true,
    ringDeadlineThresholdHours: 24,
    invoices: {
      studentVisibility: false,
      newInvoiceEmailNotification: true,
      pendingStatusEmailNotification: true,
    },
    meetingLink: "",
  },
};

// Sections whose individual fields get defaulted. Everything else (subjects, tools,
// ...) is keyed by user data, so it's only defaulted when missing as a whole --
// otherwise a deleted "todo" subject would keep coming back.
const STRUCT_PATHS = new Set(["personalData", "schoolInfo", "settings", "settings.invoices", "metadata"]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fillMissing(defaults, data, path, patch) {
  const record = { ...data };
  for (const [key, def] of Object.entries(defaults)) {
    const keyPath = path ? `${path}.${key}` : key;
    const value = data[key];
    const missing = value === undefined || (value === null && def !== null);
    if (missing) {
      record[key] = clone(def);
      patch[key] = clone(def);
    } else if (STRUCT_PATHS.has(keyPath) && isPlainObject(def) && isPlainObject(value)) {
      const subPatch = {};
      record[key] = fillMissing(def, value, keyPath, subPatch);
      if (Object.keys(subPatch).length > 0) { patch[key] = subPatch; }
    }
  }
  return record;
}

/**
 * Check a user doc against USER_DEFAULTS.
 * @param {object|null|undefined} data - the doc's data
 * @param {string} id - the doc's id
 * @returns {{record: object, patch: object|null}} `record` is the doc with every
 *   missing field defaulted; `patch` holds just the missing fields (nested), suitable
 *   for a merge write back to the doc, or null if nothing was missing.
 */
function applyUserDefaults(data, id) {
  const patch = {};
  const record = fillMissing(USER_DEFAULTS, isPlainObject(data) ? data : {}, "", patch);
  if (!record.id) {
    record.id = id;
    patch.id = id;
  }
  return { record, patch: Object.keys(patch).length > 0 ? patch : null };
}

module.exports = { USER_DEFAULTS, applyUserDefaults };
