// A single malformed `users` doc used to throw inside fetchSearch() and blank every
// admin roster ("No users found."), and a partial doc threw inside fillData(), which
// left that person stuck on the login screen. Reads now check each doc against
// USER_DEFAULTS and write any missing fields back before returning it.

jest.mock('../api/firebase', () => ({ db: {} }));
jest.mock('../components/Navigation', () => ({
  navigationItems: { ADMINUSERS: 'users-admin', ADMININVOICES: 'invoices-admin', ADMINFORMS: 'forms-admin', ADMINTOOLS: 'tools-admin' },
}));

// In-memory stand-in for the `users` collection. Plain functions rather than
// jest.fn(): CRA sets resetMocks, which would wipe the implementations.
const mockStore = {};
const mockWrites = [];
function mockSnap(id) {
  const data = mockStore[id];
  return { id, ref: { id }, exists: () => data !== undefined, data: () => data };
}
function mockDeepMerge(target, patch) {
  const out = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    const isObj = value && typeof value === 'object' && !Array.isArray(value);
    out[key] = isObj && out[key] && typeof out[key] === 'object' ? mockDeepMerge(out[key], value) : value;
  }
  return out;
}
jest.mock('firebase/firestore', () => ({
  arrayRemove: () => {},
  arrayUnion: () => {},
  collection: () => {},
  doc: (db, path) => ({ id: path.split('/')[1] }),
  getDoc: async (ref) => mockSnap(ref.id),
  getDocs: async () => ({ docs: Object.keys(mockStore).map(mockSnap) }),
  limit: () => {},
  onSnapshot: () => {},
  query: () => {},
  runTransaction: async () => {},
  setDoc: async (ref, data, options) => {
    mockWrites.push({ id: ref.id, data, options });
    mockStore[ref.id] = options?.merge ? mockDeepMerge(mockStore[ref.id] || {}, data) : data;
  },
  updateDoc: async () => {},
  where: () => {},
}));

const { User } = require('../api/db/dbUser.ts');
const { USER_DEFAULTS, applyUserDefaults } = require('../api/db/userDefaults');

beforeEach(() => {
  for (const id of Object.keys(mockStore)) { delete mockStore[id]; }
  mockWrites.length = 0;
});

const shane = () => ({ ...JSON.parse(JSON.stringify(USER_DEFAULTS)), id: 'good', personalData: { ...USER_DEFAULTS.personalData, displayName: 'Shane Brady', email: 'shane@example.com', role: 'Student' } });

describe('applyUserDefaults', () => {
  test('a complete doc needs no patch', () => {
    expect(applyUserDefaults(shane(), 'good').patch).toBeNull();
  });

  test('fills missing top-level and nested fields, and reports only those', () => {
    const { record, patch } = applyUserDefaults({ id: 'x', personalData: { displayName: 'Shane' }, settings: { darkMode: true } }, 'x');
    expect(record.homework).toEqual([]);
    expect(record.personalData).toEqual({ ...USER_DEFAULTS.personalData, displayName: 'Shane' });
    expect(record.settings.darkMode).toBe(true);
    expect(record.settings.invoices).toEqual(USER_DEFAULTS.settings.invoices);
    expect(patch.personalData.displayName).toBeUndefined();
    expect(patch.personalData.email).toBe('');
    expect(patch.settings.darkMode).toBeUndefined();
    expect(patch.homework).toEqual([]);
    expect(patch.id).toBeUndefined();
  });

  test('replaces a null section and sets a missing id', () => {
    const { record, patch } = applyUserDefaults({ personalData: null }, 'abc');
    expect(record.personalData).toEqual(USER_DEFAULTS.personalData);
    expect(patch.id).toBe('abc');
  });

  test("doesn't bring back a deleted todo subject", () => {
    const data = { ...shane(), subjects: { math: { title: 'math', color: '#000' } } };
    expect(applyUserDefaults(data, 'good').patch).toBeNull();
  });

  test('never shares default objects between records', () => {
    const a = applyUserDefaults({}, 'a').record;
    a.homework.push('x');
    expect(USER_DEFAULTS.homework).toEqual([]);
    expect(applyUserDefaults({}, 'b').record.homework).toEqual([]);
  });
});

test('fetchSearch keeps the roster and repairs a doc with no personalData', async () => {
  mockStore.good = shane();
  mockStore.broken = { homework: [] };
  const users = await User.fetchSearch('users-admin');
  expect(Object.keys(users).sort()).toEqual(['broken', 'good']);
  expect(users.good.personalData.displayName).toBe('Shane Brady');
  // Only the broken doc is written back, as a merge of just its missing fields.
  expect(mockWrites.map((w) => w.id)).toEqual(['broken']);
  expect(mockWrites[0].options).toEqual({ merge: true });
  expect(mockWrites[0].data.homework).toBeUndefined();
  expect(mockStore.broken.personalData).toEqual(USER_DEFAULTS.personalData);
  expect(mockStore.broken.id).toBe('broken');
});

test('getById returns the defaulted record even if the repair write is refused', async () => {
  mockStore.child = { personalData: { displayName: 'Kid', role: 'Student' } };
  const firestore = require('firebase/firestore');
  const setDoc = firestore.setDoc;
  firestore.setDoc = async () => { throw new Error('permission-denied'); };
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const data = await User.getById('child');
    expect(data.personalData.displayName).toBe('Kid');
    expect(data.resources).toEqual([]);
    expect(mockStore.child.resources).toBeUndefined(); // the write really was refused
  } finally {
    firestore.setDoc = setDoc;
    spy.mockRestore();
  }
});

test('fetchSearch invoices roster only includes students', async () => {
  mockStore.s = { personalData: { displayName: 'S', role: 'Student' } };
  mockStore.p = { personalData: { displayName: 'P', role: 'Parent' } };
  mockStore.x = {};
  expect(Object.keys(await User.fetchSearch('invoices-admin'))).toEqual(['s']);
});

test('filterByDisplayNameAndEmail tolerates a null displayName', () => {
  const users = [{ personalData: { displayName: null, email: 'a@b.com' } }];
  expect(User.filterByDisplayNameAndEmail(users, 'a@b')).toHaveLength(1);
});

test('fillData fills in defaults for a partial doc', () => {
  const user = User.getInstanceById('abc');
  user.fillData({ id: 'abc', personalData: { displayName: 'Shane', role: 'Student' } });
  expect(user.homework).toEqual([]);
  expect(user.resources).toEqual([]);
  expect(user.documents).toEqual([]);
  expect(user.linkedAccounts).toEqual([]);
  expect(user.settings.invoices).toEqual(USER_DEFAULTS.settings.invoices);
  expect(user.personalData.displayName).toBe('Shane');
});
