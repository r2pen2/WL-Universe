import { UserCredential } from "firebase/auth";
import { db } from "../firebase";
import { DocumentReference, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { navigationItems } from "../../components/Navigation";
import { hostname } from "./dbManager.ts";
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
  
  async setData(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const data = {
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
      setDoc(this.docRef, data).then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
        console.log(error);
      })
    })
  }

  static async fetchAll(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      fetch(hostname + "/users").then((response) => {
        response.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static async getById(id: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      fetch(hostname + `/users/user?id=${id}`).then((response) => {
        response.json().then((data) => {
          resolve(data);
        }).catch((error) => {
          reject(error);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static async fetchSearch(navPage: string): Promise<any[]> {

    return new Promise<any[]>((resolve, reject) => {
      
      let endpoint = ""
      if (navPage === navigationItems.ADMINFORMS) {
        endpoint = "search-forms";
      } else if (navPage === navigationItems.ADMININVOICES) {
        endpoint = "search-invoices";
      } else if (navPage === navigationItems.ADMINTOOLS) {
        endpoint = "search-tools";
      } else if (navPage === navigationItems.ADMINUSERS) {
        endpoint = "search-users";
      }

      fetch(hostname + `/users/${endpoint}`).then((response) => {
        response.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  async getFirstChild(): Promise<User | null> {
    if (this.personalData.role !== UserRole.PARENT && this.personalData.role !== UserRole.DEVELOPER) { return null; }
    
    return new Promise<User>((resolve) => {
      if (this.linkedAccounts.length === 0) { 
        resolve(this);
        return;
      } else {
        for (let i = 0; i < this.linkedAccounts.length; i++) {
          User.getById(this.linkedAccounts[i]).then((data) => {
            if (data.personalData.role === UserRole.STUDENT) {
              resolve(data);
              return;
            }
          });
        }
        return null;
      }
    })
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
    this.invoices = data.invoices;
    this.admin = data.admin;
    this.formAssignments = data.formAssignments;
    this.id = data.id;
    this.personalData = data.personalData;
    this.tools = data.tools;
    this.numUnpaidInvoices = data.numUnpaidInvoices;
    this.homework = data.homework.map((h: any) => Homework.load(h));
    this.subjects = data.subjects;
    this.documents = data.documents.map((d: any) => Document.load(d));
    this.intents = data.intents;
    this.settings = data.settings;
    this.schoolInfo = data.schoolInfo;
    this.metadata = data.metadata;
    this.syncCode = data.syncCode;
    this.linkedAccounts = data.linkedAccounts;
    this.delegate = data.delegate;
    this.resources = data.resources.map((r: any) => Resource.load(r)) ;
    return this;
  }

  async createDocument(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      getDoc(this.docRef).then((doc) => {
        if (doc.exists()) { resolve(); } else { 
          this.generateSyncCode().then(() => {
            this.setData().then(() => { resolve(); }).catch((error) => { reject(error); });
          })
        }
      }).catch((error) => {
        reject(error);
      })
    })
  }

  /** Need to be able to create a shallow clione so that state can update */
  clone(): User | void { return new User(this.firebaseUser).fillData(this); }

  subscribe(setter: Function, setColorScheme: Function) {
    onSnapshot(this.docRef, (doc) => {
      if (doc.exists()) {
        this.fillData(doc.data());
        this.assignDelegate().then(() => {
          // We need to create a clone of this User object so that the state actually updates
          const cloneUser = this.clone()
          setter(cloneUser); 
          setColorScheme(cloneUser?.settings.darkMode ? "dark" : "light");
        })
      }
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

  async generateSyncCode(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fetch(hostname + "/users/sync").then((response) => {
        response.json().then((data) => {
          this.syncCode = data.code;
        }).then(() => {
          resolve(this.syncCode as string)
        })
      }).catch((error) => {
        reject(error)
      })
    })
  }

  static async getSyncCodeOwner(code: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fetch(hostname + `/users/sync?code=${code}`).then((response) => {
        response.json().then((data) => {
          resolve(data.user);
        })
      }).catch((error) => {
        reject(error);
      })
    })
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
    return users.filter((user) => { return user.personalData.displayName.toLowerCase().includes(query) || user.personalData.email.toLowerCase().includes(query) })
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