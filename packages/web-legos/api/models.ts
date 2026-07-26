import { getHostname } from "./development.ts";

const developmentHostname = getHostname();
export abstract class SiteModel implements FirestoreSerializable {

  constructor(collection: string | null, modelName: string | null) {
    this.collection = collection;
    this.modelName = modelName;
  }
  fromFirestore(data: Object): SiteModel {
    throw new Error(`fromFirestore() not implemented for model: ${this.modelName}`);
  }
  fillConstantExampleData(): SiteModel {
    throw new Error(`fillConstantExampleData() not implemented for model: ${this.modelName}`);
  }
  examples: { [key: string]: Object; };

  id: string | null;
  collection: string | null;
  modelName: string | null = "Site Model";
  booleans: {[key: string]: boolean | null} = {};
  images: {[key: string]: string | null} = {};
  shortStrings: {[key: string]: string | null} = {};
  longStrings: {[key: string]: string | null} = {};
  numbers: {[key: string]: number | null} = {};

  /**
   * Get model data from server and return
   * @returns a promise resolved with model data from server
   * @param setFetched - setter function for model fetched state
   */
  static async get(setFetched: Function) {
    // @ts-ignore
    if (!(new this()).modelName === "Site Model") {
      return new Error("getSandSet() cannot be called on SiteModel parent class.")
    }
    return new Promise((resolve, reject) => {
      // @ts-ignore
      fetchModelData((new this()).collection).then((data) => {
        if (setFetched) {
          setFetched(true);
        }
        resolve(data);
      })
    })
  }

  /**
   * @async
   * Get model data from the server and call setter function for the state
   * @param setter - setter function for model state
   * @param setFetched - setter function for model fetched state
   */
  static async getAndSet(setter: Function, setFetched: Function) {
    // @ts-ignore
    if (!(new this()).modelName === "Site Model") {
      return new Error("getSandSet() cannot be called on SiteModel parent class.")
    }
    // @ts-ignore
    fetchModelData((new this()).collection).then((data: any[]) => {
      if (setFetched) {
        setFetched(true);
      }
      setter(sortByOrder(data));
    })
  }

  /**
   * Turn this {@link SiteModel} into a Firestore compatible JSON object
   * @returns Firestore compatible object
   */
  toFirestore() {
    return { ...this.booleans, ...this.images, ...this.shortStrings, ...this.longStrings, ...this.numbers, }
  }
}

export abstract class StaticSiteModel extends SiteModel {
  /** State that this SiteModel is static; It cannot be deleted and no more can be created, but it is editable. */
  static: boolean = true;
  /** Text to display in the edit button for this StaticSiteModel */
  editText: string = "";
}

export interface FirestoreSerializable {

  /**
   * fill in example data for this {@link SiteModel} so that we can test offline
   */
  fillConstantExampleData() : SiteModel;

  /** Example data for this {@link SiteModel} to use offline */
  examples: {[key: string]: Object};

  /** Convert this into a Firestore compatible object */
  toFirestore() : Object;

  /** Convert from a Firestore compatible object to a SiteModel */
  fromFirestore(data: any) : SiteModel;
}

export async function sendModelData(collection: string, id: string, data: string) {
  return new Promise((resolve, reject) => {
    console.log("Sending model data to server...");
    console.log(`${developmentHostname}/site-models`);
    fetch(`${developmentHostname}/site-models`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        collection: collection,
        documentId: id,
        documentData: data,
      }),
    }).then(res => {
      resolve(res.status);
    });
  })
}

export async function fetchModelData(collection: string) {
  return new Promise((resolve, reject) => {
    fetch(`${developmentHostname}/site-models?collection=${collection}`).then(res => {
      res.json().then(data => {
        resolve(data);
      })
    })
  })
}

export function sortByOrder(array: any[]) {
  return array.sort((a, b) => a.order - b.order);
}

export async function deleteModel(collection: string, id: string) {
  return new Promise((resolve, reject) => {
    fetch(`${developmentHostname}/site-models`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        collection: collection,
        documentId: id,
        action: "delete",
      }),
    }).then(res => {
      resolve(res.status);
    });
  })
}

export async function createModel(collection: string, data: string) {
  return new Promise((resolve, reject) => {
    fetch(`${developmentHostname}/site-models`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        collection: collection,
        documentData: data,
        action: "create"
      }),
    }).then(res => {
      resolve(res.status);
    });
  })
}

// ------------------------- Standard Models ---------------------------- /
export class WLTestimonial extends SiteModel {

  /** A SiteModel for basic testimonais— includes an author, message, and order. */
  constructor() { super("testimonials", "Testimonial") }

  booleans = {
  }
  images = {}
  numbers = {
    order: null,
  }
  shortStrings = {
    author: "",
  }
  longStrings = {
    message: "",
  }

  fillConstantExampleData() {
    this.longStrings.message = "Like having a visit from a loving mom and your favorite elementary school teacher who is also a great gardener. :) Jess is so instructive and kind, and practical. After two years of deliberating on a garden design, I was able to cut a new bed shape and start planting immediately. My new garden will cost me next to nothing, whereas the last proposal I was given was for $10K!! So happy I did this.";
    this.shortStrings.author = "Diana Roy";
    return this;
  }

  static examples = {
    default: (new WLTestimonial()).fillConstantExampleData().toFirestore(),
    alternate: (new WLTestimonial()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : WLTestimonial {
    const t = new WLTestimonial();
    t.id = data.id;
    t.shortStrings.author = data.author;
    t.longStrings.message = data.message;
    t.numbers.order = data.order;
    return t;
  }
}
