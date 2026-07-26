import { LinkMaster } from "../links.ts";

export class Resource {
  title: string | null = null;
  href: string | null = null;

  constructor(resource?: any) {
    this.title = resource?.title;
    this.href = resource?.href;
  }

  static load(data: any): Resource {
    const r = new Resource();
    r.title = data.title;
    r.href = data.href;
    return r;
  }

  toJson(): any {
    return {
      title: this.title,
      href: this.href,
    }
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
        // console.log(response)

        response.text().then((data) => {
          const title = data.match(/<title>(.*?)<\/title>/);
          this.title = title ? title[1] : null;
          resolve()
        })
      })
    })
  }

  static getSource(h:string) {
    return LinkMaster.ensureAbsoluteUrl(h?.split("/")[2]+"/favicon.ico")
  }
}