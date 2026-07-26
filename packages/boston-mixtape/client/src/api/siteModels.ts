// @ts-ignore
import { FirestoreSerializable, SiteModel, StaticSiteModel } from "../libraries/Web-Legos/api/models.ts";

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

export class Performer extends SiteModel {

  /** A SiteModel for basic testimonais— includes an author, message, and order. */
  constructor() { super("performer", "Performer") }
  
  booleans = {
  }
  images = {
    imageSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {
    name: "",
  }
  longStrings = {
    bio: "",
  }

  fillConstantExampleData() {
    this.longStrings.bio = "Our founder, lead vocalist and band leader, Behzad Dayanim, brings nearly two decades of national and international performance experience along with several album credits. A graduate of Manhattan School of Music, Behzad represents the best in New York talent, conveniently based in Boston. His proficiency in numerous styles of Jewish and American music is extraordinary and his dedication and commitment to providing unparalleled personalized service defines our philosophy and consistently leaves clients and their guests smiling. Learn more about the orchestra and how it came to be by clicking here.";
    this.shortStrings.name = "Behzad Dayanim";
    this.images.imageSource = "http://www.berachorchestra.com/Behzadheadnew.jpg";
    return this;
  }

  static examples = {
    default: (new Performer()).fillConstantExampleData().toFirestore(),
    alternate: (new Performer()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : Performer {
    const p = new Performer();
    p.id = data.id;
    p.shortStrings.name = data.name;
    p.longStrings.bio = data.bio;
    p.numbers.order = data.order;
    p.images.imageSource = data.imageSource;
    return p;
  }
}

export class FeaturedVideo extends StaticSiteModel {
  constructor() {
    super("featured-video", "Featured Video")
  }
  
  editText = "Change Video"

  booleans = {}
  images = {
  }
  numbers = {
  }
  shortStrings = {
    embedCode: "",
  }
  longStrings = {}

  fillConstantExampleData(linkType?: number) {
    if (linkType) {
      if (linkType === 1) {
        this.shortStrings.embedCode = "https://youtu.be/4YuNvIfM-YA"
      }
      if (linkType === 2) {
        this.shortStrings.embedCode = "https://www.youtube.com/watch?v=MXtTXmZp41I&ab_channel=EducationEntertainment-TV"
      }
    } else {
      this.shortStrings.embedCode = "rNOzgQm63BE";
    }
    return this;
  }

  static examples = {
    default: (new FeaturedVideo()).fillConstantExampleData().toFirestore(),
    shortLink: (new FeaturedVideo()).fillConstantExampleData(1).toFirestore(),
    longLink: (new FeaturedVideo()).fillConstantExampleData(2).toFirestore(),
  }

  fromFirestore(data: any) : FeaturedVideo {
    const gv = new FeaturedVideo();
    gv.id = data.id;
    gv.shortStrings.embedCode = data.embedCode;
    return gv;
  }
}