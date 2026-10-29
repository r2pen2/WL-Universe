import { UserCredential } from "firebase/auth";
import { db } from "../firebase";
import { DocumentReference, DocumentSnapshot, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, limit, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { navigationItems } from "../../components/Navigation";
import { FormAssignment } from "./dbFormAssignment.ts";
import { Homework, HomeworkStatus, HomeworkSubject } from "./dbHomework.ts";
import { Document } from "./dbDocument.ts";
import { getOrthodoxDate } from "../dates.ts";
import { Resource } from "./dbResource.ts";
import { USER_DEFAULTS, applyUserDefaults } from "./userDefaults";

export enum UserRole {
  STUDENT = "Student",
  PARENT = "Parent",
  COACH = "Coach",
  ADMIN = "Admin",
  DEVELOPER = "Developer"
}

export enum LMS {
  CANVAS = "Canvas",
  GOOGLE_CLASSROOM = "Google Classroom",
  SCHOOLOGY = "Schoology",
  BLACKBOARD = "Blackboard",
  MOODLE = "Moodle",
  OTHER = "Other"
}

/**
 * Some people sign into the CRM with more than one Google account (e.g. a personal vs.
 * a business email) and end up with two separate Firebase Auth uids. `userAliases/{uid}`
 * lets an admin point a secondary uid at the account that should actually own the data,
 * so every login for that uid resolves to the same `users/{canonicalUid}` document
 * instead of silently creating a second blank profile.
 */
async function resolveCanonicalUserId(uid: string): Promise<string> {
  try {
    const aliasSnap = await getDoc(doc(db, `userAliases/${uid}`));
    const canonicalUid = aliasSnap.exists() ? aliasSnap.data()?.canonicalUid : null;
    return canonicalUid || uid;
  } catch (error) {
    // Missing/denied alias lookup should never block sign-in — just fall back to the
    // uid that actually authenticated.
    console.error("userAliases lookup failed, continuing without alias:", error);
    return uid;
  }
}

/**
 * Read a user doc and check it against USER_DEFAULTS. If any fields are missing,
 * write the defaults back to the doc and read it again, so callers always get a
 * complete record and the doc gets fixed for the next reader. (One doc without
 * personalData used to throw here and blank every admin roster.) The write is
 * best-effort: it needs permission to write that doc, and the in-memory defaults are
 * used either way. routes/users.js does the same check on the server.
 */
async function loadUserRecord(snap: DocumentSnapshot): Promise<any> {
  const { record, patch } = applyUserDefaults(snap.data(), snap.id);
  if (!patch) { return { ...record, id: snap.id }; }
  try {
    await setDoc(snap.ref, patch, { merge: true });
    const retry = await getDoc(snap.ref);
    return { ...applyUserDefaults(retry.data(), snap.id).record, id: snap.id };
  } catch (error) {
    console.error(`users/${snap.id}: couldn't write missing default fields:`, error);
    return { ...record, id: snap.id };
  }
}

export class User {
  
  firebaseUser: UserCredential;

  // Defaults for all of these come from USER_DEFAULTS (see the constructor).
  metadata: any;
  invoices: string[];
  admin: boolean;
  formAssignments: FormAssignment[];
  id: string;
  docRef: DocumentReference;
  tools: any;
  numUnpaidInvoices: number;
  syncCode: string | null;
  linkedAccounts: string[];
  homework: Homework[];
  resources: any[];
  delegate: User | null = null;
  subjects: { [key: string]: any };
  documents: any[];
  intents: string[];
  personalData: any;
  schoolInfo: any;
  settings: any;

  constructor(firebaseUser?: any) {
    Object.assign(this, JSON.parse(JSON.stringify(USER_DEFAULTS)));
    this.firebaseUser = firebaseUser;
    this.id = firebaseUser?.uid;
    this.docRef = doc(db, `users/${this.id}`);
    this.personalData.email = firebaseUser?.email;
    this.personalData.displayName = firebaseUser?.displayName
    this.personalData.pfpUrl = firebaseUser?.photoURL;
  }

  static getInstanceById(id: string): User {
    return new User({uid: id});
  }

  /**
   * Build a User for a freshly-authenticated Firebase user, resolving through
   * userAliases first so a linked secondary account (see resolveCanonicalUserId)
   * lands on the same document as its canonical account. Use this instead of
   * `new User(firebaseUser)` anywhere a user is signing in.
   */
  static async fromFirebaseUser(firebaseUser: any): Promise<User> {
    const canonicalId = await resolveCanonicalUserId(firebaseUser.uid);
    const user = new User(firebaseUser);
    if (canonicalId !== firebaseUser.uid) {
      user.id = canonicalId;
      user.docRef = doc(db, `users/${canonicalId}`);
    }
    return user;
  }

  async registerSignIn(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.metadata.lastSignIn = new Date();
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      })
    })
  }
  
  toJson(): any {
    return {
      invoices: this.invoices,
      admin: this.admin,
      formAssignments: this.formAssignments,
      id: this.id,
      personalData: this.personalData,
      tools: this.tools,
      homework: this.homework.map((h) => h.toJson()),
      subjects: this.subjects,
      numUnpaidInvoices: this.numUnpaidInvoices,
      documents: this.documents.map((d) => d.toJson()),
      intents: this.intents,
      settings: this.settings,
      metadata: this.metadata,
      schoolInfo: this.schoolInfo,
      syncCode: this.syncCode,
      linkedAccounts: this.linkedAccounts,
      resources: this.resources.map((r) => r.toJson()),
    }
  }

  async setData(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setDoc(this.docRef, this.toJson()).then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
        console.log(error);
      })
    })
  }

  /**
   * These used to go through a backend route (`fetch(hostname + "/users/...")`)
   * that served an in-memory cache kept warm by a Firestore realtime listener.
   * That listener can't survive on glados (see the comment in ../firebase.js),
   * and separately, any fetch to this app's own domain is one bad ISP/DNS
   * filter away from hanging forever with no error. Reading straight from
   * Firestore removes both dependencies for these plain reads -- the
   * security rules (see firestore.rules) are what actually gate access now,
   * same as they always did for `subscribe()`/`setData()` below.
   */
  static async fetchAll(): Promise<any> {
    const snapshot = await getDocs(collection(db, "users"));
    const records = await Promise.all(snapshot.docs.map(loadUserRecord));
    const users: any = {};
    for (const u of records) { users[u.id] = u; }
    return users;
  }

  static async getById(id: string): Promise<any> {
    const snap = await getDoc(doc(db, `users/${id}`));
    return snap.exists() ? loadUserRecord(snap) : {};
  }

  static async fetchSearch(navPage: string): Promise<any> {
    const resUsers: any = {};
    for (const u of Object.values(await User.fetchAll()) as any[]) {
      const base = {
        personalData: {
          displayName: u.personalData.displayName || u.personalData.email,
          email: u.personalData.email,
          role: u.personalData.role
        },
        id: u.id,
      };
      if (navPage === navigationItems.ADMINFORMS) {
        resUsers[u.id] = { ...base, formAssignments: u.formAssignments };
      } else if (navPage === navigationItems.ADMININVOICES) {
        if (u.personalData.role === UserRole.STUDENT) { resUsers[u.id] = base; }
      } else if (navPage === navigationItems.ADMINTOOLS) {
        resUsers[u.id] = { ...base, tools: u.tools };
      } else if (navPage === navigationItems.ADMINUSERS) {
        resUsers[u.id] = base;
      }
    }
    return resUsers;
  }

  async getFirstChild(): Promise<User | null> {
    if (this.personalData.role !== UserRole.PARENT && this.personalData.role !== UserRole.DEVELOPER) { return null; }
    if (this.linkedAccounts.length === 0) { return this; }

    for (const linkedId of this.linkedAccounts) {
      try {
        const data = await User.getById(linkedId);
        if (data?.personalData?.role === UserRole.STUDENT) { return data; }
      } catch (error) {
        // A single bad/unreachable linked account should never hang delegate
        // resolution forever -- log it and keep checking the others.
        console.error(`getFirstChild: failed to look up linked account ${linkedId}:`, error);
      }
    }
    return null;
  }

  async assignDelegate(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.getFirstChild().then(c => {
        this.delegate = c;
        resolve();
      })
    })
  }

  fillData(data: any): User | void {
    if (data === null) { return; }
    // Anything an older/partial doc is missing comes from USER_DEFAULTS. Previously a
    // doc without e.g. `resources` threw inside subscribe()'s snapshot callback, so
    // that person could authenticate but never got past the login screen.
    const record = applyUserDefaults(data, this.id).record;
    this.invoices = record.invoices;
    this.admin = record.admin;
    this.formAssignments = record.formAssignments;
    this.id = record.id;
    this.personalData = record.personalData;
    this.tools = record.tools;
    this.numUnpaidInvoices = record.numUnpaidInvoices;
    this.homework = record.homework.map((h: any) => Homework.load(h));
    this.subjects = record.subjects;
    this.documents = record.documents.map((d: any) => Document.load(d));
    this.intents = record.intents;
    this.settings = record.settings;
    this.schoolInfo = record.schoolInfo;
    this.metadata = record.metadata;
    this.syncCode = record.syncCode;
    this.linkedAccounts = record.linkedAccounts;
    this.delegate = data.delegate;
    this.resources = record.resources.map((r: any) => Resource.load(r)) ;
    return this;
  }

  /**
   * Create this user's doc if (and only if) it doesn't exist yet.
   *
   * This runs on every sign-in from getCurrentUser(), and on registration it races
   * Login.jsx writing the new student's name/role. It used to be a plain
   * get-then-setDoc, so whichever write landed second won -- and if it was this one,
   * the student's name and role were overwritten with blanks. It also had to wait on
   * a backend fetch for the sync code first; if that fetch failed the doc was never
   * created at all and the person was stuck on the login screen (then "Email already
   * in use" when they tried registering again). Now it's a create-if-absent
   * transaction with a client-side sync code.
   */
  async createDocument(): Promise<void> {
    const existing = await getDoc(this.docRef);
    if (existing.exists()) { return; }
    if (!this.syncCode) { await this.generateSyncCode(); }
    const data = this.toJson();
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(this.docRef);
      if (!snap.exists()) { transaction.set(this.docRef, data); }
    });
  }

  /** Need to be able to create a shallow clione so that state can update */
  clone(): User | void { return new User(this.firebaseUser).fillData(this); }

  subscribe(setter: Function, setColorScheme: Function) {
    onSnapshot(this.docRef, (doc) => {
      if (!doc.exists()) {
        // Signed in but no profile doc (e.g. createDocument() failed earlier) --
        // create it instead of leaving them stuck on the login screen forever.
        // The resulting snapshot lands back here.
        this.createDocument().catch((error) => console.error("subscribe: createDocument failed:", error));
        return;
      }
      // Same check as loadUserRecord(): write back any missing fields. The snapshot
      // that write triggers lands back here with the complete doc.
      const { patch } = applyUserDefaults(doc.data(), doc.id);
      if (patch) {
        setDoc(this.docRef, patch, { merge: true }).catch((error) => console.error("subscribe: couldn't write missing default fields:", error));
      }
      this.fillData(doc.data());
      // assignDelegate() shouldn't reject anymore (getFirstChild catches its
      // own lookup failures), but don't let sign-in hang forever on this
      // secondary step if it ever does -- fall through and show the app.
      this.assignDelegate().catch((error) => {
        console.error("assignDelegate failed, continuing without a delegate:", error);
      }).finally(() => {
        // We need to create a clone of this User object so that the state actually updates
        const cloneUser = this.clone()
        setter(cloneUser);
        setColorScheme(cloneUser?.settings.darkMode ? "dark" : "light");
      })
    })
  }

  /**
   * Add/remove one id in this user's linkedAccounts. This is also how a parent or
   * student links *someone else's* doc to theirs via sync code, so it touches only
   * that one field: firestore.rules lets a non-staff user write another person's doc
   * only to add or remove their own id there.
   */
  async linkAccount(id: string, role?: UserRole): Promise<void> {
    if (!id) { return; }
    if (this.linkedAccounts.includes(id)) { throw new Error("Account already linked"); }
    await updateDoc(this.docRef, { linkedAccounts: arrayUnion(id) });
    this.linkedAccounts = [...this.linkedAccounts, id];
  }

  async unlinkAccount(id: string): Promise<void> {
    await updateDoc(this.docRef, { linkedAccounts: arrayRemove(id) });
    this.linkedAccounts = this.linkedAccounts.filter(a => a !== id);
  }

  async addSubject(subject: HomeworkSubject): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.subjects[subject.title] = subject.toJson();
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async removeSubject(title: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      delete this.subjects[title];
      this.homework = this.homework.filter((hw) => hw.subject !== title);
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async updateSubject(subject: HomeworkSubject): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.subjects[subject.title] = subject.toJson();
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async addHomework(homework: Homework): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      homework.registerTimestamp();
      this.homework.push(homework);
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async updateHomework(homework: Homework): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const index = this.homework.findIndex((hw) => hw.timestamp === homework.timestamp);
      this.homework[index] = homework;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async removeHomework(homework: Homework): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.homework = this.homework.filter((hw) => {
        return hw.timestamp !== homework.timestamp
      });
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async startHomework(homework: Homework): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const index = this.homework.findIndex((hw) => hw.timestamp === homework.timestamp);
      this.homework[index].status = HomeworkStatus.IN_PROGRESS;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async completeHomework(homework: Homework): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const index = this.homework.findIndex((hw) => hw.timestamp === homework.timestamp);
      this.homework[index].status = HomeworkStatus.COMPLETED;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async pauseHomework(homework: Homework): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const index = this.homework.findIndex((hw) => hw.timestamp === homework.timestamp);
      this.homework[index].status = HomeworkStatus.NOT_STARTED;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async setIntent(intent: string): Promise<void> { 
    return new Promise<void>((resolve, reject) => {
      this.intents.unshift(intent);
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async changeInvoiceSetting(setting: string, newValue: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.settings.invoices[setting] = newValue;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async changeSetting(setting: string, newValue: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.settings[setting] = newValue;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  async changePersonalData(field: string, newValue: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.personalData[field] = newValue;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  /**
   * Patch only the given personalData fields on the stored doc, without
   * rewriting the rest of it from this (possibly stale) instance.
   */
  async updatePersonalData(fields: { [key: string]: any }): Promise<void> {
    const update: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(fields)) { update[`personalData.${key}`] = value; }
    await updateDoc(this.docRef, update);
  }

  async changeSchoolInfo(field: string, newValue: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.schoolInfo[field] = newValue;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  /**
   * Generate a 6-character sync code no other user has. This used to fetch the
   * backend's /users/sync, which made creating a brand-new student's doc depend on
   * that server (and this domain) being reachable -- see createDocument().
   */
  async generateSyncCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, "0");
      if (!(await User.getSyncCodeOwner(code))) {
        this.syncCode = code;
        return code;
      }
    }
    throw new Error("Could not generate an unused sync code");
  }

  static async getSyncCodeOwner(code: string): Promise<any> {
    const snapshot = await getDocs(query(collection(db, "users"), where("syncCode", "==", code), limit(1)));
    if (snapshot.empty) { return undefined; }
    const d = snapshot.docs[0];
    return { ...d.data(), id: d.id };
  }

  /**
   * Filter users by display name and email. Return all users if the query is empty.
   * @param users list of users to filter
   * @param query query string from TextInput
   * @returns a filtered list of users
   */
  static filterByDisplayNameAndEmail(users: User[], query: string): User[] {
    if ( query.length <= 0 ) { return users; }
    query = query.toLowerCase();
    return users.filter((user) => { return (user.personalData?.displayName || "").toLowerCase().includes(query) || (user.personalData?.email || "").toLowerCase().includes(query) })
  }

  /**
   * Sort users by display name.
   * @param users list of users to sort
   */
  static sortByDisplayName(users: User[]) {
    users.sort((a, b) => a.personalData.displayName?.localeCompare(b.personalData.displayName))
  }

  async purgeAssignments(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Remove homeworks older than 6 months
      const cutoff = new Date().getTime() - 15778476000;
      const initialLength = this.homework.length;
      this.homework = this.homework.filter((hw) => {
        if (hw.dueDate) {
          return getOrthodoxDate(hw.dueDate).getTime() > cutoff
        }
        if (hw.timestamp) {
          return new Date(hw.timestamp).getTime() > cutoff
        }
        return true;
      });
      if (initialLength > this.homework.length) {
        this.setData()
      }
    })
  }
}