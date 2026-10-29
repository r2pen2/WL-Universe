// A single malformed `users` doc used to throw inside fetchSearch() and blank every
// admin roster ("No users found."), and a partial doc threw inside fillData(), which
// left that person stuck on the login screen.

jest.mock('../api/firebase', () => ({ db: {} }));
jest.mock('../components/Navigation', () => ({
  navigationItems: { ADMINUSERS: 'users-admin', ADMININVOICES: 'invoices-admin', ADMINFORMS: 'forms-admin', ADMINTOOLS: 'tools-admin' },
}));

const mockDocs = [];
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  // Plain function, not jest.fn(): CRA sets resetMocks, which would wipe the implementation.
  getDocs: async () => ({ forEach: (fn) => mockDocs.forEach(fn) }),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

const { User } = require('../api/db/dbUser.ts');

function fakeDoc(id, data) { return { id, data: () => data }; }

beforeEach(() => { mockDocs.length = 0; });

test('fetchSearch keeps the roster when one doc has no personalData', async () => {
  mockDocs.push(
    fakeDoc('good', { personalData: { displayName: 'Shane Brady', email: 'shane@example.com', role: 'Student' } }),
    fakeDoc('broken', { homework: [] }),
  );
  const users = await User.fetchSearch('users-admin');
  expect(Object.keys(users).sort()).toEqual(['broken', 'good']);
  expect(users.good.personalData.displayName).toBe('Shane Brady');
  expect(users.broken.personalData.displayName).toBe('(no name)');
});

test('fetchSearch invoices roster only includes students', async () => {
  mockDocs.push(
    fakeDoc('s', { personalData: { displayName: 'S', role: 'Student' } }),
    fakeDoc('p', { personalData: { displayName: 'P', role: 'Parent' } }),
    fakeDoc('x', {}),
  );
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
  expect(user.settings.invoices).toBeDefined();
  expect(user.personalData.displayName).toBe('Shane');
});
