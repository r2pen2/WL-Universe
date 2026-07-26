import { FirebaseApp, FirebaseOptions, initializeApp } from "firebase/app";
import { Analytics, getAnalytics, logEvent } from "firebase/analytics";
import { createContext } from "react";

export class AnalyticsManager {

  static Context = createContext(null);

  config: FirebaseOptions | null = null;

  constructor(config: FirebaseOptions) {
    this.config = config;
  }

  setConfig(config: FirebaseOptions) {
    this.config = config;
  }

  app: FirebaseApp | null = null;
  analytics: Analytics | null = null;

  initialize() {
    if (!this.config) {
      console.error("AnalyticsManager has no config.");
      return;
    }
    this.app = initializeApp(this.config);
    this.analytics = getAnalytics(this.app);
  }

  logPageView(pageId: string) {
    if (!this.analytics) {
      console.error("AnalyticsManager has not been initialized");
      return;
    }
    logEvent(this.analytics, "page_view", {
      page_location: pageId
    });
  }
}
