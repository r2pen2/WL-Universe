import { UserCredential } from "firebase/auth";
import { db } from "../firebase";
import { DocumentReference, collection, doc, getDoc, getDocs, limit, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { navigationItems } from "../../components/Navigation";
import { FormAssignment } from "./dbFormAssignment.ts";
import { Homework, HomeworkLoaderType, HomeworkPriority, HomeworkPriorityVerbosity, HomeworkStatus, HomeworkSubject } from "./dbHomework.ts";
import { Document } from "./dbDocument.ts";
import { getOrthodoxDate } from "../dates.ts";
import { Resource } from "./dbResource.ts";

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
 * Roster rows (Manage Users / Forms / Tools / Invoices) only need a few personalData
 * fields. A `users` doc that is missing personalData entirely (half-written, created by
 * hand in the console, etc.) used to throw a TypeError here, which rejected the whole
 * query and every admin roster showed "No users found." -- one bad doc blanked the list.
 */
function rosterPersonalData(u: any) {
  const p = u?.personalData || {};
  return {
    displayName: p.displayName || p.email || "(no name)",
    email: p.email || "",
    role: p.role || "",
  };
}

export class User {
  
  firebaseUser: UserCredential;

  metadata: any = {
    lastSignIn: null
  };
  
  invoices: string[] = [];
  admin: boolean = false;
  formAssignments: FormAssignment[] = [];
  id: string;
  docRef: DocumentReference;
  tools: any = {};
  numUnpaidInvoices: number = 0;
  syncCode: string | null = null;

  linkedAccounts: string[] = [];

  homework: Homework[] = [];

  resources: any[] = [];

  delegate: User | null = null;

  subjects: { [key: string]: any } = {
    "todo": { 
      color: "#ffffff",
      title: "todo",
    }
  }

  documents: any[] = [];

  intents: string[] = [];

  personalData: any = {
    displayName: "",
    email: "",
    pfpUrl: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    role: "",
  }

  schoolInfo: any = {
    advisorName: "",
    advisorHref: "",
    advisorEmail: "",
    advisorOffice: "",
    LMSHref: "",
    LMSName: "",
    sessionNotes: "",
  }

  settings: any = {
    darkMode: false,
    priorityVerbosity: HomeworkPriorityVerbosity.COLORS,
    priorityPulseThreshold: HomeworkPriority.HIGH,
    homeworkLoaderType: HomeworkLoaderType.CIRCLE,
    requireHomeworkDeleteConfirmation: true,
    ringDeadlineThresholdHours: 24,
    invoices: {
      studentVisibility: false,
      newInvoiceEmailNotification: true,
      pendingStatusEmailNotification: true,
    },
    meetingLink: "",
  }

  constructor(firebaseUser?: any) {
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
    const users: any = {};
    snapshot.forEach((d) => { users[d.id] = { ...d.data(), id: d.id }; });
    return users;
  }

  static async getById(id: string): Promise<any> {
    const snap = await getDoc(doc(db, `users/${id}`));
    return snap.exists() ? { ...snap.data(), id: snap.id } : {};
  }

  static async fetchSearch(navPage: string): Promise<any> {
    const snapshot = await getDocs(collection(db, "users"));
    const resUsers: any = {};
    snapshot.forEach((d) => {
      const u = d.data();
      if (!u?.personalData) { console.warn(`fetchSearch: users/${d.id} has no personalData`); }
      const base = {
        personalData: rosterPersonalData(u),
        id: d.id,
      };
      if (navPage === navigationItems.ADMINFORMS) {
        resUsers[d.id] = { ...base, formAssignments: u.formAssignments || [] };
      } else if (navPage === navigationItems.ADMININVOICES) {
        if (base.personalData.role === UserRole.STUDENT) { resUsers[d.id] = base; }
      } else if (navPage === navigationItems.ADMINTOOLS) {
        resUsers[d.id] = { ...base, tools: u.tools || {} };
      } else if (navPage === navigationItems.ADMINUSERS) {
        resUsers[d.id] = base;
      }
    });
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
    // Fall back to this instance's defaults for anything an older/partial doc is
    // missing. Previously a doc without e.g. `resources` threw inside subscribe()'s
    // snapshot callback, so that person could authenticate but never got past the
    // login screen.
    this.invoices = data.invoices ?? this.invoices;
    this.admin = data.admin ?? this.admin;
    this.formAssignments = data.formAssignments ?? this.formAssignments;
    this.id = data.id ?? this.id;
    this.personalData = { ...this.personalData, ...(data.personalData || {}) };
    this.tools = data.tools ?? this.tools;
    this.numUnpaidInvoices = data.numUnpaidInvoices ?? this.numUnpaidInvoices;
    this.homework = (data.homework ?? []).map((h: any) => Homework.load(h));
    this.subjects = data.subjects ?? this.subjects;
    this.documents = (data.documents ?? []).map((d: any) => Document.load(d));
    this.intents = data.intents ?? this.intents;
    this.settings = { ...this.settings, ...(data.settings || {}) };
    this.schoolInfo = { ...this.schoolInfo, ...(data.schoolInfo || {}) };
    this.metadata = data.metadata ?? this.metadata;
    this.syncCode = data.syncCode ?? this.syncCode;
    this.linkedAccounts = data.linkedAccounts ?? this.linkedAccounts;
    this.delegate = data.delegate;
    this.resources = (data.resources ?? []).map((r: any) => Resource.load(r)) ;
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

  async linkAccount(id: string, role: UserRole): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.linkedAccounts.includes(id)) { reject("Account already linked"); } else {
        this.linkedAccounts.push(id);
        this.linkedAccounts = this.linkedAccounts.filter(a => a !== undefined);
        this.setData().then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }
    })
  }

  async unlinkAccount(id: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.linkedAccounts = this.linkedAccounts.filter(a => a !== id);
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
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