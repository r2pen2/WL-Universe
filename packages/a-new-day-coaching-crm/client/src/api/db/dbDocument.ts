import { documentId } from "firebase/firestore";
import { notifSuccess } from "../../components/Notifications.jsx";
import { LinkMaster } from "../links.ts";
import { hostname } from "./dbManager.ts";

/**
 * Enum representing the type of a document
 */
export enum DocumentType {
  DOCUMENT = "Document",
  SPREADSHEET = "Spreadsheet",
  PRESENTATION = "Presentation",
  FORM = "Form",
  PHOTOSANDIMAGES = "Photos & Images",
  PDF = "PDF",
  VIDEO = "Video",
  SHORTCUT = "Shortcut",
  FOLDER = "Folder",
  SITE = "Site",
  AUDIO = "Audio",
  DRAWING = "Drawing",
  ARCHIVE = "Archive (zip)",
  DRIVE = "Drive"
}

export class Document {
  title: string | null = null;
  type: string | null = null;
  href: string | null = null;

  constructor(document?: any) {
    this.title = document?.title;
    this.type = document?.type;
    this.href = document?.href;
  }

  static load(data: any): Document {
    const d = new Document();
    d.title = data.title;
    d.type = data.type;
    d.href = data.href;
    return d;
  }

  toJson(): any {
    return {
      title: this.title,
      type: this.type,
      href: this.href,
    }
  }

  getColor(): string {
    if (this.type === DocumentType.DOCUMENT) return "#4285F4";
    if (this.type === DocumentType.SPREADSHEET) return "#34A853";
    if (this.type === DocumentType.PRESENTATION) return "#FBBC04";
    if (this.type === DocumentType.FORM) return "#673AB7";
    if (this.type === DocumentType.PHOTOSANDIMAGES) return "#EA4335";
    if (this.type === DocumentType.PDF) return "#EA4335";
    if (this.type === DocumentType.VIDEO) return "#EA4335";
    if (this.type === DocumentType.SHORTCUT) return "#5F6368";
    if (this.type === DocumentType.FOLDER) return "#5F6368";
    if (this.type === DocumentType.SITE) return "#4D5DBA";
    if (this.type === DocumentType.AUDIO) return "#EA4335";
    if (this.type === DocumentType.DRAWING) return "#EA4335";
    if (this.type === DocumentType.ARCHIVE) return "#5F6368";
    return "black";
  }

  async extractData(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      
      if (!this.href) {
        console.error('No href provided');
        reject()
        return;
      }


      if (!LinkMaster.checkValid(this.href)) {
        console.error('Invalid URL');
        reject()
        return;
      }

      fetch(this.href).then((response) => {
        response.text().then((data) => {
          const title = data.match(/<title>(.*?)<\/title>/);
          this.title = title ? title[1] : null;
          this.type = Document.mapTitleToDocumentType(this.title || '');
          resolve()
        })
      })
    })
  }

  static mapTitleToDocumentType(title: string): DocumentType {
    if (title.includes("Google Docs")) { return DocumentType.DOCUMENT; }
    if (title.includes("Google Sheets")) { return DocumentType.SPREADSHEET; }
    if (title.includes("Google Slides")) { return DocumentType.PRESENTATION; }
    if (title.includes("Google Forms")) { return DocumentType.FORM; }
    // if (title.includes("Google Photos")) { return DocumentType.PHOTOSANDIMAGES; }
    // if (title.includes("PDF")) { return DocumentType.PDF; }
    // if (title.includes("YouTube")) { return DocumentType.VIDEO; }
    // if (title.includes("Shortcut")) { return DocumentType.SHORTCUT; }
    // if (title.includes("Folder")) { return DocumentType.FOLDER; }
    // if (title.includes("Site")) { return DocumentType.SITE; }
    // if (title.includes("Audio")) { return DocumentType.AUDIO; }
    // if (title.includes("Drawing")) { return DocumentType.DRAWING; }
    // if (title.includes("Archive")) { return DocumentType.ARCHIVE; }
    return DocumentType.DRIVE;
  }

  static getTypeFromURL(url: string): DocumentType | null {
    if (url.includes("docs.google.com")) { return DocumentType.DOCUMENT; }
    if (url.includes("sheets.google.com")) { return DocumentType.SPREADSHEET; }
    if (url.includes("slides.google.com")) { return DocumentType.PRESENTATION; }
    if (url.includes("forms.google.com")) { return DocumentType.FORM; }
    if (url.includes("sites.google.com")) { return DocumentType.SITE; }
    return null;
  }
}