import { hostname } from "./dbManager.ts";

export class Invoice {
  
  static getDaysBefore(n: number) { const today = new Date(); today.setDate(today.getDate() - n); return today; }

  id: string | null;
  invoiceNumber: number;
  paid: boolean;
  amount: number;
  createdAt: Date;
  paidAt: Date | null = null;
  dueAt: Date;
  href: string;
  assignedTo: string;
  limbo: string | null = null;

  /**
   * 
   * @param id - firestoreId of this invoice
   * @param invoiceNumber - invoice numerical identifier 
   * @param paid - boolean indicating if invoice has been paid
   * @param amount - amount of invoice
   * @param createdAt - date invoice was created
   * @param paidAt - date invoice was paid
   * @param dueAt - date invoice is due
   * @param href - link to invoice pdf
   * @param assignedTo - firestoreId of user assigned to this invoice
   */
  constructor(id: string | null, invoiceNumber: number, paid: boolean, amount: number, createdAt: Date, paidAt: Date | null, dueAt: Date, href: string, assignedTo: string) {
    this.id = id;
    this.invoiceNumber = invoiceNumber;
    this.paid = paid;
    this.amount = amount;
    this.createdAt = createdAt;
    this.paidAt = paidAt;
    this.dueAt = dueAt;
    this.href = href;
    this.assignedTo = assignedTo;
  }

  toJson() {
    return {
      id: this.id,
      invoiceNumber: this.invoiceNumber,
      paid: this.paid,
      amount: this.amount,
      createdAt: this.createdAt,
      paidAt: this.paidAt,
      dueAt: this.dueAt,
      href: this.href,
      assignedTo: this.assignedTo,
      limbo: this.limbo,
    }
  }

  async setData(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      
      fetch(hostname + "/invoices/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoice: this.toJson()
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve();
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  async tellRachelIHaveBeenPaid(platform: string): Promise<boolean> {
    platform = platform.substring(0, 1).toUpperCase() + platform.substring(1);
    return new Promise<boolean>((resolve, reject) => {
      this.paidAt = new Date();
      this.limbo = platform;
      this.setData().then(() => {
        resolve(true);
      }).catch((error) => {
        console.log("err");
        reject(error);
      })
    })
  }

  tellRachelIHaveNotBeenPaid(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.paidAt = null;
      this.limbo = null;
      this.setData().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      })
    })
  }

  checkLate(): boolean {
    return new Date(this.dueAt) < new Date();
  }

  getDaysLate(): number {
    return Math.floor((new Date().getTime() - new Date(this.dueAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  checkPending(): boolean {
    const limboCheck = (this.paidAt && !this.paid) !== null
    return this.limbo !== null || limboCheck;
  }

  static async create(href: string, amount: number, user: any, dueDate: Date): Promise<any> {
    
    const invoice = new Invoice(null, -1, false, amount, new Date(), null, dueDate, href, user.id);
    
    return new Promise<any>((resolve, reject) => {
      fetch(hostname + "/invoices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoice: invoice.toJson()
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })    
  }

  static async createAndReturnId(href: string, amount: number, user: any, dueDate: Date): Promise<string> {
    
    const invoice = new Invoice(null, -1, false, amount, new Date(), null, dueDate, href, user.id);
    
    return new Promise<any>((resolve, reject) => {
      fetch(hostname + "/invoices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoice: invoice.toJson()
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data.id);
        })
      }).catch((error) => {
        reject(error);
      })
    })    
  }

  static async createWithEmail(href: string, amount: number, recipientEmail: string, dueDate: Date): Promise<any> {
    
    const invoice = new Invoice(null, -1, false, amount, new Date(), null, dueDate, href, "");
    
    return new Promise<any>((resolve, reject) => {
      fetch(hostname + "/invoices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoice: invoice.toJson(),
          recipientEmail: recipientEmail
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })    
  }

  static async getById(invoiceId: string): Promise<Invoice | null> {
    return new Promise<Invoice | null>((resolve, reject) => {
      fetch(hostname + `/invoices/by-id/${invoiceId}`).then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            resolve(new Invoice(data.id, data.invoiceNumber, data.paid, data.amount, data.createdAt, data.paidAt, data.dueAt, data.href, data.assignedTo));
          })
        } else {
          resolve(null);
        }
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static async linkToUser(invoiceId: string, userId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fetch(hostname + "/invoices/link-to-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          userId: userId
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data.success);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static async getForUser(userId: string): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      fetch(hostname + `/invoices?userId=${userId}`).then((response) => {
        response.json().then((data) => {
          resolve(data.map((d: any) => new Invoice(d.id, d.invoiceNumber, d.paid, d.amount, d.createdAt, d.paidAt, d.dueAt, d.href, d.assignedTo) ));
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  async delete(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fetch(hostname + "/invoices/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoice: this.toJson()
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve();
        })
      }).catch((error) => {
        reject(error);
      })
    })
  
  }

  static sortBy(invoices: PaidInvoice[] | LimboInvoice[] | UnpaidInvoice[], sortType: string, reversed: boolean): PaidInvoice[] | LimboInvoice[] | UnpaidInvoice[] {
    function getArray() {
      if (sortType === "dueAt") { return invoices.sort((a, b) => Number(new Date(a.dueAt)) - Number(new Date(b.dueAt))).reverse() }
      if (sortType === "paidAt") { return invoices.sort((a, b) => Number(new Date(a.paidAt?a.paidAt:"")) - Number(new Date(b.paidAt?b.paidAt:""))).reverse() }
      if (sortType === "createdAt") { return invoices.sort((a, b) => Number(new Date(a.createdAt)) - Number(new Date(b.createdAt))).reverse() }
      if (sortType === "user") { return invoices.sort((a, b) => a.userDisplayName.localeCompare(b.userDisplayName)) }
      if (sortType === "number") { return invoices.sort((a, b) => a.invoiceNumber - b.invoiceNumber).reverse() }
      return [];
    }
    return reversed ? getArray().reverse() : getArray();
  }

  static filterByUserQuery(invoices: PaidInvoice[] | LimboInvoice[] | UnpaidInvoice[], userQuery: string): PaidInvoice[] | LimboInvoice[] | UnpaidInvoice[] {
    return invoices.filter((invoice) => { return invoice.userDisplayName.toLowerCase().includes(userQuery) })
  }
}

export class UnpaidInvoice extends Invoice {
  
  userDisplayName: string;

  static getAll(): Promise<UnpaidInvoice[]> {
    return new Promise<UnpaidInvoice[]>((resolve, reject) => {
      fetch(hostname + "/invoices/unpaid").then((response) => {
        response.json().then((data) => {
          resolve(data.map((d: any) => {
            const invoice = new UnpaidInvoice(d.id, d.invoiceNumber, d.paid, d.amount, d.createdAt, d.paidAt, d.dueAt, d.href, d.assignedTo);
            invoice.userDisplayName = d.userDisplayName;
            return invoice;
          }));
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }
}

export class PaidInvoice extends Invoice {
  
  userDisplayName: string;

  static getAll(): Promise<PaidInvoice[]> {
    return new Promise<PaidInvoice[]>((resolve, reject) => {
      fetch(hostname + "/invoices/paid").then((response) => {
        response.json().then((data) => {
          resolve(data.map((d: any) => {
            const invoice = new PaidInvoice(d.id, d.invoiceNumber, d.paid, d.amount, d.createdAt, d.paidAt, d.dueAt, d.href, d.assignedTo);
            invoice.userDisplayName = d.userDisplayName;
            return invoice;
          }));
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }
}


export class LimboInvoice extends Invoice {
  
  userDisplayName: string;

  static getAll(): Promise<LimboInvoice[]> {
    return new Promise<LimboInvoice[]>((resolve, reject) => {
      fetch(hostname + "/invoices/limbo").then((response) => {
        response.json().then((data) => {

          
          resolve(data.map((d: any) => {
            const invoice = new LimboInvoice(d.id, d.invoiceNumber, d.paid, d.amount, d.createdAt, d.paidAt, d.dueAt, d.href, d.assignedTo);
            invoice.userDisplayName = d.userDisplayName;
            invoice.limbo = d.limbo;
            return invoice;
          }));
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  generateMemo(): string {
    if (this.limbo === "Venmo") { return `${this.userDisplayName}'s ANDC Invoice No.${this.invoiceNumber}`; }
    if (this.limbo === "Mark") { return `${this.userDisplayName} marked this invoice as paid.` }
    return "Error: Memo not generated."
  }

  getPlatformColor(): string {
    if (this.limbo === "Paid")    { return "#00BF6F"; }  // This is a Paid invoice
    if (this.limbo === "Venmo")   { return "#008CFF"; }  // This is a Venmo payment
    if (this.limbo === "Zelle")   { return "#6D1ED4"; }  // This is a Zelle payment
    return "black";
  }

  async accept(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fetch(hostname + "/invoices/limbo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: this.id,
          action: "accept"
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve();
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  async reject(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fetch(hostname + "/invoices/limbo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: this.id,
          action: "reject"
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve();
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }
}