import { FirebaseApp, FirebaseOptions, initializeApp } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// @ts-ignore
import { WLAdminPermissions, WLEditHistory } from "./admin.ts";
import { createContext } from "react";
import { getAuthClient } from "./services.ts";

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
      console.log(user);

      getAuthClient().fetch(`/site-auth`, {
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
      getAuthClient().fetch(`/site-auth?id=${currentSignIn.uid}`).then((res) => {
        res.json().then((json) => {
          // Operators (including joed.dev SSO admins) can do everything, even permissions
          // their users doc doesn't list yet.
          resolve(json.op === true ? true : json[perm]);
        })
      })
    })
  }

  /**
   * All of a user's permissions on this site (every one is true for an operator).
   * Resolves to {} when signed out, unknown to wl-auth, or wl-auth can't be reached.
   */
  async getPermissions(currentSignIn: {uid: string}): Promise<{[key: string]: boolean}> {
    if (!currentSignIn || !currentSignIn.uid) { return {}; }
    try {
      const res = await getAuthClient().fetch(`/site-auth?id=${encodeURIComponent(currentSignIn.uid)}`);
      if (!res.ok) { return {}; }
      const json = await res.json();
      return json && typeof json === "object" ? json : {};
    } catch (err) {
      console.warn("AuthenticationManager: couldn't load permissions", err);
      return {};
    }
  }

  /**
   * File a content change request as the signed-in admin. wl-auth turns it into a Plane ticket labelled
   * with this site. Resolves to { identifier: "WL-12", url }; rejects with a readable message.
   */
  async requestContentChange(fields: {description: string, pageUrl?: string}): Promise<{identifier: string, url: string}> {
    const user = this.auth && this.auth.currentUser;
    if (!user) { throw new Error("Sign in first."); }
    const idToken = await user.getIdToken();
    let res: Response;
    try {
      res = await getAuthClient().fetch(`/change-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firebase-Auth": `Bearer ${idToken}`,
        },
        body: JSON.stringify(fields),
      });
    } catch (err) {
      throw new Error("Couldn't reach the server. Please try again.");
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ticket) {
      throw new Error(json.error || `Request failed (${res.status}).`);
    }
    return json.ticket;
  }

  /** Whether the user holds any permission on this site, i.e. is one of its admins. */
  async isSiteAdmin(currentSignIn: {uid: string}): Promise<boolean> {
    const permissions = await this.getPermissions(currentSignIn);
    return Object.values(permissions).some((value) => value === true);
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
