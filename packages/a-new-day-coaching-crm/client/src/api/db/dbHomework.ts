import { notifFail, notifSuccess } from "../../components/Notifications";
import { LinkMaster } from "../links.ts";
import { User } from "./dbUser";

/**
 * Enum representing the status of a homework assignment
 */
export enum HomeworkStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed"
}

/**
 * Enum representing the priority of a homework assignment
 */
export enum HomeworkPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

/**
 * Enum representing the loader style of a homework assignment
 */
export enum HomeworkLoaderType {
  CIRCLE = "oval",
  BARS = "bars",
  DOTS = "dots"
}

/**
 * Enum representing the verbosity of homework priorities
 */
export enum HomeworkPriorityVerbosity {
  COLORS = "Colors",
  MINIMAL = "Minimal",
  DEFAULT = "Default",
  VERBOSE = "Verbose"
}

export class Homework {
  subject: string | null = null;
  dueDate: Date | null = null;
  startDate: Date | null = null;
  status: HomeworkStatus = HomeworkStatus.NOT_STARTED;
  priority: HomeworkPriority = HomeworkPriority.LOW;
  description: string | null = null;
  estTime: string | null = null;
  timestamp: number | null = null;
  href: string | null = null;

  registerTimestamp(): void { this.timestamp = Date.now(); }

  constructor(homework?: any) {
    this.subject = homework?.subject;
    this.dueDate = homework ? homework.dueDate : null;
    this.startDate = homework ? homework.startDate : null;
    this.status = homework? homework.status : HomeworkStatus.NOT_STARTED;
    this.priority = homework?.priority;
    this.description = homework?.description;
    this.estTime = homework ? homework.estTime : null;
    this.timestamp = homework?.timestamp;
    this.href = homework?.href;
  }

  static getPriorityColor(homework: Homework | string): string | undefined {
    if (!homework) { console.error("No homework found"); return ; }
    const p = typeof homework === "string" ? homework : homework.priority;
    switch(p) {
      case HomeworkPriority.LOW: return "green";
      case HomeworkPriority.MEDIUM: return "yellow";
      case HomeworkPriority.HIGH: return "red";
    }
  }

  static getStatusColor(homework: Homework): string | null {
    const s = homework.status;
    switch(s) {
      case HomeworkStatus.NOT_STARTED: return "gray";
      case HomeworkStatus.IN_PROGRESS: return "blue";
      case HomeworkStatus.COMPLETED: return "green";
    }
  }

  static load(data: any): Homework {
    const hw = new Homework();
    hw.description = data.description;
    hw.dueDate = data.dueDate;
    hw.startDate = data.startDate;
    hw.status = data.status;
    hw.priority = data.priority;
    hw.subject = data.subject;
    hw.estTime = data.estTime;
    hw.timestamp = data.timestamp;
    hw.href = data.href;
    return hw;
  }

  toJson(): any {
    return {
      subject: this.subject,
      dueDate: this.dueDate,
      startDate: this.startDate,
      status: this.status,
      priority: this.priority,
      description: this.description,
      estTime: this.estTime,
      timestamp: this.timestamp,
      href: this.href ? this.href : null
    }
  }

  setEstTime(time: string): Homework {
    this.estTime = time;
    return this;
  }

  static getPriorityValue(homework: Homework) {
    switch(homework.priority) {
      case HomeworkPriority.LOW: return 1;
      case HomeworkPriority.MEDIUM: return 2;
      case HomeworkPriority.HIGH: return 3;
    }
  }

  static getPriorityStringBySetting(priority: HomeworkPriority, verbosity: HomeworkPriorityVerbosity): string {
    if (verbosity === HomeworkPriorityVerbosity.MINIMAL) { return "!" + priority.slice(0, 1); }
    if (verbosity === HomeworkPriorityVerbosity.VERBOSE) { return priority + " Priority"; }
    if (verbosity === HomeworkPriorityVerbosity.COLORS) { return ""; }
    return priority;
  }

  static checkPriorityPulseThreshold(priority: HomeworkPriority, threshold: HomeworkPriority): boolean {
    if (threshold === HomeworkPriority.LOW) { return true; }
    if (threshold === HomeworkPriority.MEDIUM && priority !== HomeworkPriority.LOW) { return true; }
    if (threshold === HomeworkPriority.HIGH && priority === HomeworkPriority.HIGH) { return true; }
    return false;
  }

  /** Remove this homework assignment from a user */
  handleRemove(currentUser: User, skipConfirmation: boolean = false, updateUserOptimistic: any = null) {
    if (!currentUser) { console.error("No user found for homework assignment"); return; }    
    if (!currentUser.settings.requireHomeworkDeleteConfirmation) {
      currentUser.removeHomework(this).then(() => {
        notifSuccess("Assignment Removed", `Removed assignment: "${this.description}"`)
        if (updateUserOptimistic) { updateUserOptimistic(currentUser); }
      })
      return;
    }
    if (skipConfirmation || window.confirm(`Are you sure you want to delete "${this.description}"?`)) {
      currentUser.removeHomework(this).then(() => {
        notifSuccess("Assignment Removed", `Removed assignment: "${this.description}"`)
        if (updateUserOptimistic) { updateUserOptimistic(currentUser); }
      })
    }
  }

  /** Start this homework assignment on a user */
  handleStart(currentUser: User, updateUserOptimistic: any = null) {
    if (!currentUser) { console.error("No user found for homework assignment"); return; }
    currentUser.startHomework(this).then(() => {
      notifSuccess("Assignment Started", `Started assignment: "${this.description}"`)
      if (updateUserOptimistic) { updateUserOptimistic(currentUser); }
    });
  }

  /** Complete this homework assignment on a user */
  handleComplete(currentUser: User, updateUserOptimistic: any = null) {
    if (!currentUser) { console.error("No user found for homework assignment"); return; }
    currentUser.completeHomework(this).then(() => {
      notifSuccess("Assignment Completed", `Completed assignment: "${this.description}"`)
      if (updateUserOptimistic) { updateUserOptimistic(currentUser); }
    });
  }

  /** Pause this homework assignment on a user */
  handlePause(currentUser: User, updateUserOptimistic: any = null) {
    if (!currentUser) { console.error("No user found for homework assignment"); return; }
    currentUser.pauseHomework(this).then(() => {
      notifSuccess("Assignment Paused", `Paused assignment: "${this.description}"`)
      if (updateUserOptimistic) { updateUserOptimistic(currentUser); }
    });
  }

  static openLink(homework: any): void {
    if (!homework.href) { 
      notifFail("No Link Found", "No link was found for this assignment");
      return;
    }
    const absoluteUrl = LinkMaster.ensureAbsoluteUrl(homework.href);
    if (!LinkMaster.checkValid(absoluteUrl)) {
      notifFail("Invalid Link", `The URL "${absoluteUrl}" invalid`);
      return;
    }
    window.open(absoluteUrl, "_blank")
  }
}

export class HomeworkSubject {
  title: string;
  color: string;

  constructor(title: string, color: string) {
    this.title = title;
    this.color = color;
  }

  toJson() {
    return {
      title: this.title,
      color: this.color
    }
  }
}