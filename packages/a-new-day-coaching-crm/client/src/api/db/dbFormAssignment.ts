import { hostname } from "./dbManager.ts";

export class FormAssignment {
  formId: string;
  formTitle: string;
  formDescription: string;
  assignedDate: Date | null;
  dueDate: Date | null;
  completed: boolean;
  completedDate: Date | null;
  assignedTo: string | null;
  comment: string | null;
  href: string;
  assignedLink: string | null;
  minuteEstimate: number | null;
  started: boolean;

  constructor(formId: string, formTitle: string, formDescription: string, href: string, minuteEstimate: number) {
    this.formId = formId;
    this.formTitle = formTitle;
    this.assignedDate = null;
    this.dueDate = null;
    this.completed = false;
    this.started = false;
    this.completedDate = null;
    this.assignedTo = null;
    this.formDescription = formDescription;
    this.href = href;
    this.assignedLink = null;
    this.minuteEstimate = minuteEstimate;
  }
  
  toJson() {
    return {
      formId: this.formId,
      formTitle: this.formTitle,
      assignedDate: this.assignedDate,
      dueDate: this.dueDate,
      completed: this.completed,
      completedDate: this.completedDate,
      assignedTo: this.assignedTo,
      formDescription: this.formDescription,
      href: this.href,
      assignedLink: this.assignedLink,
      minuteEstimate: this.minuteEstimate,
      started: this.started
    }
  }

  setDueDate(dueDate: Date): void {
    this.dueDate = dueDate;
  }

  setMinuteEstimate(minutes: number): void {
    this.minuteEstimate = minutes;
  }

  /**
   * Assign a form to a user
   * @param assignee - userId of assignee
   */
  assign(assignee: string): Promise<boolean> {
    
    this.assignedDate = new Date();               // Set assignment date
    this.assignedTo = assignee;                   // Set assignee
    this.assignedLink = this.href + assignee;     // Set link to form

    return new Promise<boolean>((resolve, reject) => {
      fetch(hostname + "/forms/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          formData: this.toJson(),
          userId: assignee
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data.success);
        })
      }).catch((error) => { console.error(error); reject(error) })
    })
  }

    /**
   * Unassign a form from a user
   * @param assignee - userId of assignee
   */
    unassign(assignee: string): Promise<boolean> {
  
      return new Promise<boolean>((resolve, reject) => {
        fetch(hostname + "/forms/unassign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            formId: this.formId,
            userId: assignee
          })
        }).then((response) => {
          response.json().then((data) => {
            resolve(data.success);
          })
        }).catch((error) => { console.error(error); reject(error) })
      })
    }

    /**
   * Mark a form as incomplete on a user
   * @param assignee - userId of assignee
   */
    incomplete(assignee: string): Promise<boolean> {
  
      return new Promise<boolean>((resolve, reject) => {
        fetch(hostname + "/forms/incomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            formId: this.formId,
            userId: assignee
          })
        }).then((response) => {
          response.json().then((data) => {
            resolve(data.success);
          })
        }).catch((error) => { console.error(error); reject(error) })
      })
    }

  assignToMultiple(userIds: string[]): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      let success = true;
      for (const userId of userIds) {
        success = success && await this.assign(userId);
      }
      if (success) { resolve(true); } else { reject(false); }
    });
  }

  unassignToMultiple(userIds: string[]): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      let success = true;
      for (const userId of userIds) {
        success = success && await this.unassign(userId);
      }
      if (success) { resolve(true); } else { reject(false); }
    });
  }

  incompleteToMultiple(userIds: string[]): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      let success = true;
      for (const userId of userIds) {
        success = success && await this.incomplete(userId);
      }
      if (success) { resolve(true); } else { reject(false); }
    });
  }

  static fetchAll(): Promise<FormAssignment[]> {
    return new Promise<FormAssignment[]>((resolve, reject) => {
      fetch(hostname + "/forms").then((response) => {
        response.json().then((data) => {
          resolve(data.map((d: any) => new FormAssignment(d.formId, d.formTitle, d.formDescription, d.href, d.minuteEstimate)));
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }
}