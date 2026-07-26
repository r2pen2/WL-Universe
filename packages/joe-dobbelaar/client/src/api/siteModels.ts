// @ts-ignore
import { FirestoreSerializable, SiteModel } from "../libraries/Web-Legos/api/models.ts";

export class ExampleModel extends SiteModel implements FirestoreSerializable {
  constructor() {
    super("example-models", "Example Model")
  }
  booleans = {
    booleanExample: true,
  }
  images = {
    imageExample: "",
  }
  numbers = {
    order: 0,
  }
  shortStrings = {
    shortStringExample: ""
  }
  longStrings = {
    longStringExample: "",
  }
  
  fillConstantExampleData() {
    this.booleans.booleanExample = true;
    this.images.imageExample = "https://ih1.redbubble.net/image.3309736636.6267/st,small,507x507-pad,600x600,f8f8f8.jpg";
    this.numbers.order = 1;
    this.shortStrings.shortStringExample = "Hello, World!";
    this.longStrings.longStringExample = "Greetings to the Earth and all who inhabit it.";
    return this;
  }

  static examples = {
    default: (new ExampleModel()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : ExampleModel {
    const e = new ExampleModel();
    e.id = data.id;
    e.booleans.booleanExample = data.booleanExample;
    e.images.imageExample = data.imageExample;
    e.shortStrings.shortStringExample = data.shortStringExample;
    e.longStrings.longStringExample = data.longStringExample;
    e.numbers.order = data.order;
    return e;
  }
}