import { FirebaseApp, FirebaseOptions, initializeApp } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// @ts-ignore
import { WLAdminPermissions, WLEditHistory } from "./admin.ts";
import { createContext } from "react";
import { getHostname } from "./development.ts";

const developmentHostname = getHostname();
export class AuthenticationManager {

  static Context = createContext(null);

  permissions: WLPermissionsConfig | null = null;
  config: FirebaseOptions | null = null;

  constructor(config: FirebaseOptions, permissions: WLPermissionsConfig) {
    this.permissions = permissions;
    this.config = config;
  }

  setConfig(config: FirebaseOptions) {
    this.config = config;
  }

  app: FirebaseApp | null = null;
  auth: Auth | null = null;

  initialize() {
    if (!this.config) {
      console.error("AuthenticationManager has no config.");
      return;
    }
    this.app = initializeApp(this.config);
    this.auth = getAuth();
  }

    /**
   * Sign in user with google and return user
   */

  async signInWithGoogle() {
    if (!this.config) { return; }
    const provider = new GoogleAuthProvider();
    return new Promise((resolve, reject) => {
      if (!this.auth) {
        reject(new Error("AuthenticationManager instance has not been given a config."))
        return;
      }
      signInWithPopup(this.auth, provider).then((result) => {
        resolve(result.user);
      }).catch((error) => {
        reject(error)
      });
    })
  }

  async createNewUser(userId: string, displayName: string, email: string, adminPermissions?: WLAdminPermissions) {
    return new Promise((resolve, reject) => {

      const user = new User();
      user.displayName = displayName;
      user.email = email;
      user.userId = userId;
      if (this.permissions) {
        user.permissions = this.permissions;
      }
      if (adminPermissions) {
        user.adminPermissions = adminPermissions;
      }
//      const jsonUser = user.toJson()
      console.log(user);

      fetch(`${developmentHostname}/site-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(user),
      }).then(res => {
        resolve(res.status);
      });
    })
  }

  async getPermission(currentSignIn: {uid: string}, perm: string) {
    if (!currentSignIn) { return; }
    if (!currentSignIn.uid) { return; }
    return new Promise((resolve, reject) => {
      fetch(`${developmentHostname}/site-auth?id=${currentSignIn.uid}`).then((res) => {
        res.json().then((json) => {
          resolve(json[perm]);
        })
      })
    })
  }
}

export class WLPermissionsConfig {
  /** Whether user can edit everything */
  op: string = "op";
  /** Whether user can edit WLSiteText */
  text: string = "siteText";
  /** Whether user can edit WLSiteImages */
  images: string = "siteImages";

  constructor(fields?: {[key: string]: string}) {
    if (!fields) { return; }
    for (const fieldKey of Object.keys(fields)) {
      this[fieldKey] = fields[fieldKey];
    }
  }

  toUserPermissions() {
    return {
      op: false,
      test: false,
      images: false
    }
  }
}

export class User {
  userId: String = "12345676890";
  displayName: String = "Display Name";
  email: String = "test@example.com";
  permissions: {} = new WLPermissionsConfig().toUserPermissions();
  adminPermissions: WLAdminPermissions | null = new WLAdminPermissions();
  history: WLEditHistory[] = [];
  isOwner: Boolean = false;

  setIsOwner(newIsOwner: boolean): User {
    this.isOwner = newIsOwner;
    return this
  }

  static examples = {
    default: new User(),
    owner: new User().setIsOwner(true),
  }
}
