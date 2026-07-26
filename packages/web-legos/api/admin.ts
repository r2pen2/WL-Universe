// @ts-ignore
import { FirestoreSerializable, SiteModel } from "./models.ts";
import { getSlashDateString, getTimeOfDay } from "./strings.js";
import { getHostname } from "./development.ts";

const developmentHostname = getHostname();

export enum SiteKey {
  TestSiteNoForms = "TESTSITENOFORMS",
  BeyondTheBellEducation = "BTB",
  YouCanDoItGardening = "YCD",
  NicoleLevin = "NL",
}

export enum SiteModule {
  forms = "FORMS",
  analytics = "ANALYTICS",
  users = "USERS",
  log = "LOG",
}

export const siteModules: { [key: string]: SiteModule[] } = {}
// Load in TEST Modules
siteModules[SiteKey.TestSiteNoForms] = [SiteModule.analytics, SiteModule.users, SiteModule.log]
// Load in BTB Modules
siteModules[SiteKey.BeyondTheBellEducation] = [SiteModule.forms, SiteModule.analytics, SiteModule.users, SiteModule.log]
// Load in YCD Modules
siteModules[SiteKey.YouCanDoItGardening] = [SiteModule.analytics, SiteModule.users, SiteModule.log]

export class SupportTicket extends SiteModel implements FirestoreSerializable {
  constructor(subject?: String, siteKey?: string, message?: string) {
    super("support-tickets", "SupportTicket")
    this.createdAt = new Date();
  }
  booleans = {
  }
  images = {
  }
  numbers = {
  }
  shortStrings = {
    subject: "",
    siteKey: ""
  }
  longStrings = {
    message: ""
  }
  createdAt: Date = new Date();

  fromFirestore(data: any) : SupportTicket {
    const instance = new SupportTicket();
    instance.shortStrings.subject = data.subject;
    instance.shortStrings.siteKey = data.siteKey;
    instance.longStrings.message = data.message;
    return instance;
  }

  static examples = {
    default: (new SupportTicket()).fillConstantExampleData().toFirestore(),
    alternate: (new SupportTicket()).fillConstantExampleData(true).toFirestore(),
  }

  fillConstantExampleData(alt?: boolean) {
    this.shortStrings.subject = alt ? "Subject 2" : "Subject 1";
    this.shortStrings.siteKey = alt ? SiteKey.YouCanDoItGardening : SiteKey.BeyondTheBellEducation;
    this.longStrings.message = alt ? "This is the alternate message." : "This is the default message.";
    return this;
  }
}

export class AvailableSite extends SiteModel implements FirestoreSerializable {
  constructor() {
    super("available-sites", "AvailableSite")
  }
  booleans = {
  }
  images = {
    logoSource: "",
  }
  numbers = {
  }
  shortStrings = {
    siteKey: "",
    title: "",
    url: ""
  }
  longStrings = {
  }
  tickets: SupportTicket[] = []
  users: String[] = []

  fillConstantExampleData(alt?: boolean) {

    const altTickets = [
      new SupportTicket("Example Alt Ticket 1", SiteKey.YouCanDoItGardening, "This is an example alternate ticket message"),
      new SupportTicket("Example Alt Ticket 2", SiteKey.YouCanDoItGardening, "This is a second example alternate ticket message"),
    ];
    const defaultTickets = [
      new SupportTicket("Example Default Ticket 1", SiteKey.BeyondTheBellEducation, "This is an example default ticket message"),
      new SupportTicket("Example Default Ticket 2", SiteKey.BeyondTheBellEducation, "This is a second example default ticket message"),
    ];

    this.images.logoSource = alt ? "https://www.youcandoitgardening.com/static/media/logoNoText.ea403d4785551ef75409.png" : "https://beyondthebelleducation.com/static/media/logoTransparentBlack.79c1457b6c1da17b2b6a.png";
    this.shortStrings.title = alt ? "You Can Do It Gardening" : "Beyond The Bell Education";
    this.shortStrings.url = alt ? "https://www.youcandoitgardening.com/" : "https://www.beyondthebelleducation.com/";
    this.tickets = alt ? altTickets : defaultTickets;
    this.shortStrings.siteKey = alt ? SiteKey.YouCanDoItGardening : SiteKey.BeyondTheBellEducation;
    this.users = alt ? ["joe@joed.dev", "joedobbelaar@gmail.com"] : ["joedobbelaar@gmail.com", "joe@joed.dev"];
    return this;
  }

  static examples = {
    default: (new AvailableSite()).fillConstantExampleData().toFirestore(),
    alternate: (new AvailableSite()).fillConstantExampleData(true).toFirestore(),
  }

  /**
   * Turn this {@link AvailableSite} into a Firestore compatible JSON object
   * @returns Firestore compatible AvailableSite
   */
  override toFirestore(): any {

    const tickets = this.tickets;

    function jsonSerializeTickets() {
      let jsonTickets: any[] = [];
      for (const t of tickets) {
        jsonTickets.push(t.toFirestore());
      }
      return jsonTickets;
    }

    return { ...this.booleans, ...this.images, ...this.shortStrings, ...this.longStrings, ...this.numbers, tickets: jsonSerializeTickets(), users: this.users}
  }

  fromFirestore(data: any) : AvailableSite {
    const instance = new AvailableSite();
    instance.images.logoSource = data.logoSource;
    instance.shortStrings.title = data.title;
    instance.tickets = data.tickets;
    instance.users = data.users;
    return instance;
  }
}

/**
 * User permissions for the WL Admin Portal
 */
export class WLAdminPermissions {
  /** Whether user can view form responses */
  forms: Boolean = false;
  /** Whether user can view user permissions */
  users: Boolean = false;
  /** Whether user can view site analytics */
  analytics: Boolean = false;
  /** Whether user can view changelog */
  changelog: Boolean = false;
}

export enum WLEditType {
  undefined = "UNDEFINED",
  textChange = "TEXTCHANGE",
  imageChange = "IMAGECHANGE",
  modelChange = "MODELCHANGE",
  modelDelete = "MODELDELETE",
}

export class WLEditHistory {
  type: WLEditType = WLEditType.undefined;
  editedId: String = "";
  message: String | null = null;
  timestamp: Date = new Date();

  constructor(type: WLEditType, editedId: String, message?: string) {
    this.type = type;
    this.editedId = editedId;
    if (message) {
      this.message = message;
    }
    this.timestamp = new Date();
  }

  private getEditMessage() {
    switch (this.type) {
      case WLEditType.textChange:
        this.message = `Edited text: ${this.editedId}`;
        break;
      case WLEditType.imageChange:
        this.message = `Changed image: ${this.editedId}`;
        break;
      case WLEditType.modelChange:
        this.message = `Updated model: ${this.editedId}`;
        break;
      case WLEditType.modelDelete:
        this.message = `Deleted model: ${this.editedId}`;
        break;
    }
  }

  /**
   * JSON serialize this WLEditHistory
   */
  toJson() {
    return {
      type: this.type,
      editedId: this.editedId,
      message: this.message ? this.message : this.getEditMessage(), // If message is still null, generate one based on the type and editedId
      timestamp: this.timestamp,
    }
  }
}

export class AdminGateway {
  siteKey: SiteKey | null = null;
}


/**
 * This class should be extended by each app to ensure that the content fields are correct
 */
export class FormResponse extends SiteModel implements FirestoreSerializable {

  static largeFields = ["Message"]
  static mediumFields = [""]

  static getFieldWidth(fieldKey: string) {
    if (FormResponse.largeFields.includes(fieldKey)) {
      return 800;
    }
    if (FormResponse.mediumFields.includes(fieldKey)) {
      return 400;
    }
    return null;
  }

  constructor(subject?: String, siteKey?: string, message?: string) {
    super("form-responses", "FormResponse")
    this.createdAt = `${getSlashDateString(new Date())} ${getTimeOfDay(new Date())}`
  }
  booleans = {
  }
  images = {
  }
  numbers = {
    createdAtSeconds: -1
  }
  shortStrings = {
    formId: "",
    formTitle: ""
  }
  longStrings = {
  }
  createdAt: String = `${getSlashDateString(new Date())} ${getTimeOfDay(new Date())}`
  content = {}

  fromFirestore(data: any) : FormResponse {
    const instance = new FormResponse();
    instance.shortStrings.formId = data.formId;
    instance.shortStrings.formTitle = data.formTitle;
    instance.content = data.content;
    instance.createdAt = data.createdAt;
    instance.numbers.createdAtSeconds = data.createdAtSeconds;
    return instance;
  }

  static examples = {
    default: (new FormResponse()).fillConstantExampleData().toFirestore(),
    alternate: (new FormResponse()).fillConstantExampleData(true).toFirestore(),
  }

  fillConstantExampleData(alt?: boolean) {

    const defaultContent = {
      "Name": "Joe Dobbelaar",
      "Phone Number": "7818799058",
      "Email": "joedobbelaar@gmail.com",
      "Preferred Contact Method": "phone",
      "City, State": "Worcester, MA",
      "Message": "You can't!",
    }

    const altContent = {
      "Name": "Joseph Dobbelaar",
      "Phone Number": "7818799058",
      "Email": "joe@joed.dev",
      "Preferred Contact Method": "email",
      "City, State": "Winchester, MA",
      "Message": "Help me.",
    }

    this.shortStrings.formId = alt ? "form-alternate" : "form-default";
    this.shortStrings.formTitle = alt ? "Example Alternate Form" : "Example Default Form";
    this.content = alt ? altContent : defaultContent;
    this.createdAt = `${getSlashDateString(new Date())} ${getTimeOfDay(new Date())}`
    this.numbers.createdAtSeconds = (new Date()).getTime()/1000
    return this;
  }


  /**
   * Turn this {@link FormResponse} into a Firestore compatible JSON object
   * @returns Firestore compatible FormResponse
   */
  override toFirestore(): any {
    return { ...this.booleans, ...this.images, ...this.shortStrings, ...this.longStrings, ...this.numbers, createdAt: this.createdAt, content: this.content}
  }

  /**
   * Send this form response to the server
   */
  sendFormData() {
    return new Promise((resolve, reject) => {
      fetch(`${developmentHostname}/site-forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentData: this.toFirestore(),
        }),
      }).then(res => {
        resolve(res.status);
      });
    })
  }
}
