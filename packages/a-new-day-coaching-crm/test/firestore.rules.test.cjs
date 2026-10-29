// Tests for ../firestore.rules against the Firestore emulator. Run from this package:
//
//   npx firebase-tools emulators:exec --only firestore --project demo-anewday \
//     "node --test test/firestore.rules.test.cjs"
//
// with @firebase/rules-unit-testing and firebase resolvable (CI installs them into a
// temp dir and points NODE_PATH at it -- see .github/workflows/firestore-rules.yml).

const { after, before, beforeEach, describe, test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { assertFails, assertSucceeds, initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } = require("firebase/firestore");

let env;

const profile = (role, extra = {}) => ({ personalData: { displayName: role, email: `${role}@example.com`, role }, linkedAccounts: [], homework: [], ...extra });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-anewday",
    firestore: { rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8") },
  });
});

after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/coach"), profile("Coach"));
    await setDoc(doc(db, "users/student"), profile("Student"));
    await setDoc(doc(db, "users/parent"), profile("Parent"));
    await setDoc(doc(db, "users/blank"), { homework: [] }); // no personalData at all
    await setDoc(doc(db, "userAliases/coach2"), { canonicalUid: "coach" });
    await setDoc(doc(db, "invoices/inv1"), { assignedTo: "student", amount: 100 });
    await setDoc(doc(db, "tools/tool1"), { title: "Planner" });
    await setDoc(doc(db, "forms/form1"), { title: "Intake" });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe("users", () => {
  test("signed-in users can read the roster; anonymous can't", async () => {
    await assertSucceeds(getDocs(collection(as("student"), "users")));
    await assertFails(getDocs(collection(anon(), "users")));
  });

  test("everyone can write their own doc, including creating it on sign-up", async () => {
    await assertSucceeds(updateDoc(doc(as("student"), "users/student"), { intents: ["focus"] }));
    await assertSucceeds(setDoc(doc(as("newkid"), "users/newkid"), profile("Student")));
  });

  test("a doc with no personalData can still repair itself", async () => {
    await assertSucceeds(setDoc(doc(as("blank"), "users/blank"), { personalData: { role: "" } }, { merge: true }));
  });

  test("staff can write other people's docs; students and parents can't", async () => {
    await assertSucceeds(updateDoc(doc(as("coach"), "users/student"), { homework: [{ title: "x" }] }));
    await assertFails(updateDoc(doc(as("parent"), "users/student"), { homework: [] }));
    await assertFails(updateDoc(doc(as("student"), "users/coach"), { "personalData.role": "Student" }));
    await assertFails(setDoc(doc(as("student"), "users/someoneelse"), profile("Student")));
  });

  test("a user without a doc (or without personalData) isn't staff", async () => {
    await assertFails(updateDoc(doc(as("nobody"), "users/student"), { homework: [] }));
    await assertFails(updateDoc(doc(as("blank"), "users/student"), { homework: [] }));
  });

  test("sync-code linking: may add or remove only yourself in someone's linkedAccounts", async () => {
    await assertSucceeds(updateDoc(doc(as("parent"), "users/student"), { linkedAccounts: arrayUnion("parent") }));
    await assertSucceeds(updateDoc(doc(as("parent"), "users/student"), { linkedAccounts: arrayRemove("parent") }));
    await assertFails(updateDoc(doc(as("parent"), "users/student"), { linkedAccounts: arrayUnion("someoneelse") }));
    await assertFails(updateDoc(doc(as("parent"), "users/student"), { linkedAccounts: arrayUnion("parent"), homework: [{ title: "x" }] }));
  });

  test("only staff can delete user docs", async () => {
    await assertFails(deleteDoc(doc(as("student"), "users/student")));
    await assertSucceeds(deleteDoc(doc(as("coach"), "users/student")));
  });
});

describe("aliased logins", () => {
  test("a secondary login writes its canonical doc and keeps the canonical account's role", async () => {
    await assertSucceeds(updateDoc(doc(as("coach2"), "users/coach"), { intents: ["x"] }));
    await assertSucceeds(updateDoc(doc(as("coach2"), "users/student"), { homework: [] }));
  });

  test("each login can read its own alias; only staff read others' or write any", async () => {
    await assertSucceeds(getDoc(doc(as("coach2"), "userAliases/coach2")));
    await assertSucceeds(getDoc(doc(as("student"), "userAliases/student")));
    await assertFails(getDoc(doc(as("student"), "userAliases/coach2")));
    await assertSucceeds(getDoc(doc(as("coach"), "userAliases/coach2")));
    await assertFails(setDoc(doc(as("student"), "userAliases/student"), { canonicalUid: "coach" }));
    await assertSucceeds(setDoc(doc(as("coach"), "userAliases/student2"), { canonicalUid: "student" }));
  });
});

describe("other collections", () => {
  for (const [name, path_] of [["invoices", "invoices/inv1"], ["tools", "tools/tool1"], ["anything else", "forms/form1"]]) {
    test(`${name}: signed-in read, staff-only write`, async () => {
      await assertSucceeds(getDoc(doc(as("student"), path_)));
      await assertFails(getDoc(doc(anon(), path_)));
      await assertFails(updateDoc(doc(as("student"), path_), { touched: true }));
      await assertSucceeds(updateDoc(doc(as("coach"), path_), { touched: true }));
    });
  }
});
