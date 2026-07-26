// @ts-ignore
import { FirestoreSerializable, SiteModel, StaticSiteModel } from "../libraries/Web-Legos/api/models.ts";

export class BeforeAndAfter extends SiteModel implements FirestoreSerializable {
  constructor() {
    super("befores-and-afters", "Before And After")
  }
  booleans = {}
  images = {
    beforeSource: "",
    afterSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {}
  longStrings = {
    description: "",
  }
  
  fillConstantExampleData() {
    this.images.beforeSource = "https://ih1.redbubble.net/image.3309736636.6267/st,small,507x507-pad,600x600,f8f8f8.jpg";
    this.images.afterSource = "https://ih1.redbubble.net/image.3309736636.6267/st,small,507x507-pad,600x600,f8f8f8.jpg";
    this.longStrings.description = "Garfield got so big! Look at him!";
    return this;
  }

  static examples = {
    default: (new BeforeAndAfter()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : BeforeAndAfter {
    const b = new BeforeAndAfter();
    b.id = data.id;
    b.images.beforeSource = data.beforeSource;
    b.images.afterSource = data.afterSource;
    b.longStrings.description = data.description;
    b.numbers.order = data.order;
    return b;
  }
}

export class Testimonial extends SiteModel {
  
  constructor(virtual?: boolean) {
    super("testimonials", "Testimonial")
    this.booleans.virtual = !!virtual;
  }
  
  booleans = {
    virtual: false
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
    this.longStrings.message = "Like having a visit from a loving mom and your favorite elementary school teacher who is also a great gardener. :) Jess is so instructive and kind, and practical. After two years of deliberating on a garden design, I was able to cut a new bed shape and start planting immediately. My new garden will cost me next to nothing, whereas the last proposal I was given was for $10K!! So happy I did this. 💚";
    this.shortStrings.author = "Diana Roy";
    return this;
  }

  static examples = {
    default: (new Testimonial(false)).fillConstantExampleData().toFirestore(),
    virtual: (new Testimonial(true)).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : Testimonial {
    const t = new Testimonial();
    t.id = data.id;
    t.shortStrings.author = data.author;
    t.longStrings.message = data.message;
    t.numbers.order = data.order;
    t.booleans.virtual = data.virtual;
    return t;
  }
}

export class TestimonialSlideshowPicture extends SiteModel {
  constructor() {
    super("testimonial-slideshow-pictures", "Testimonial Slideshow Picture")
  }
  booleans = {}
  images = {
    imageSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {}
  longStrings = {
    caption: "",
  }

  fillConstantExampleData() {
    this.images.imageSource = "https://ih1.redbubble.net/image.3309736636.6267/st,small,507x507-pad,600x600,f8f8f8.jpg";
    this.longStrings.caption = "Garfield got so big! Look at him!";
    return this;
  }

  static examples = {
    default: (new TestimonialSlideshowPicture()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : TestimonialSlideshowPicture {
    const tsp = new TestimonialSlideshowPicture();
    tsp.id = data.id;
    tsp.longStrings.caption = data.caption;
    tsp.numbers.order = data.order;
    tsp.images.imageSource = data.imageSource;
    return tsp;
  }
}

export class TeachingItem extends SiteModel {
  
  constructor() {
    super("teaching-items", "Teaching Item")
  }
  
  booleans = {
  }
  images = {}
  numbers = {
    order: null,
  }
  shortStrings = {
    link: "",
  }
  longStrings = {
    title: "",
    description: "",
  }

  fillConstantExampleData() {
    this.shortStrings.link = "https://www.google.com/";
    this.longStrings.title = "The Arlington Community Education Catalog";
    this.longStrings.description = "I usually teach at least one class on gardening for beginners in the spring and fall, so look out for those if you're local!";
    return this;
  }

  static examples = {
    default: (new TeachingItem()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : TeachingItem {
    const ti = new TeachingItem();
    ti.id = data.id;
    ti.shortStrings.link = data.link;
    ti.longStrings.title = data.title;
    ti.longStrings.description = data.description;
    ti.numbers.order = data.order;
    return ti;
  }
}

export class VirtualServiceItem extends SiteModel {
  
  constructor() {
    super("virtual-service-items", "Virtual Service Item")
  }
  
  booleans = {}
  images = {}
  numbers = {
    order: null,
  }
  shortStrings = {
    text: "",
  }
  longStrings = {}

  fillConstantExampleData() {
    this.shortStrings.text = "Sessions are conveniently conducted over FaceTime or Google Meet.";
    return this;
  }

  static examples = {
    default: (new VirtualServiceItem()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : VirtualServiceItem {
    const vsi = new VirtualServiceItem();
    vsi.id = data.id;
    vsi.shortStrings.text = data.text;
    vsi.numbers.order = data.order;
    return vsi;
  }
}
export class InPersonServiceItem extends SiteModel {
  
  constructor() {
    super("in-person-service-items", "In-Person Service Item")
  }
  
  booleans = {}
  images = {}
  numbers = {
    order: null,
  }
  shortStrings = {
    text: "",
  }
  longStrings = {}

  fillConstantExampleData() {
    this.shortStrings.text = "I will personally guide you on plant care and propose improvements customized to your garden.";
    return this;
  }

  static examples = {
    default: (new InPersonServiceItem()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : InPersonServiceItem {
    const ipsi = new InPersonServiceItem();
    ipsi.id = data.id;
    ipsi.shortStrings.text = data.text;
    ipsi.numbers.order = data.order;
    return ipsi;
  }
}

export class HomeItem extends SiteModel {
  constructor() {
    super("home-pictures", "Home Picture")
  }
  booleans = {}
  images = {
    imageSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {}
  longStrings = {}

  fillConstantExampleData() {
    this.images.imageSource = "https://ih1.redbubble.net/image.3309736636.6267/st,small,507x507-pad,600x600,f8f8f8.jpg";
    return this;
  }

  static examples = {
    default: (new HomeItem()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : HomeItem {
    const hi = new HomeItem();
    hi.id = data.id;
    hi.numbers.order = data.order;
    hi.images.imageSource = data.imageSource;
    return hi;
  }
}

export class NewHampshireItem extends SiteModel {
  constructor() {
    super("nh-pictures", "NH Picture")
  }
  booleans = {}
  images = {
    imageSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {}
  longStrings = {}

  fillConstantExampleData() {
    this.images.imageSource = "https://ih1.redbubble.net/image.3309736636.6267/st,small,507x507-pad,600x600,f8f8f8.jpg";
    return this;
  }

  static examples = {
    default: (new NewHampshireItem()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : NewHampshireItem {
    const nhi = new NewHampshireItem();
    nhi.id = data.id;
    nhi.numbers.order = data.order;
    nhi.images.imageSource = data.imageSource;
    return nhi;
  }
}

export class ClientItem extends SiteModel {
  constructor() {
    super("client-pictures", "Client Picture")
  }
  booleans = {}
  images = {
    imageSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {}
  longStrings = {}

  fillConstantExampleData() {
    this.images.imageSource = "https://ih1.redbubble.net/image.3309736636.6267/st,small,507x507-pad,600x600,f8f8f8.jpg";
    return this;
  }

  static examples = {
    default: (new ClientItem()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : ClientItem {
    const ci = new ClientItem();
    ci.id = data.id;
    ci.numbers.order = data.order;
    ci.images.imageSource = data.imageSource;
    return ci;
  }
}

export class MediaAppearance extends SiteModel {
  constructor() {
    super("media-appearances", "Media Appearance")
  }
  booleans = {}
  images = {
    imageSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {
    title: "",
    link: "",
  }
  longStrings = {
    description: "",
  }

  fillConstantExampleData(alternate?: boolean) {
    this.images.imageSource = alternate ? "https://preview.redd.it/7aiypuw0yweb1.jpg?width=640&crop=smart&auto=webp&s=86cc5a49fa0d1936fe03a901b18726fc267de638" : "https://i.ytimg.com/vi/SvVvmyzgWvY/hq720.jpg?sqp=-oaymwE2COgCEMoBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgBzgWAAoQHigIMCAAQARhlIFIoPzAP&rs=AOn4CLBJA8VdgXgn27gMNH2BQHfPPAr4-A";
    this.shortStrings.title = alternate ? "Avenged Sevenfold Signed CD" : "Reviewbrah's Big Iron Cover";
    this.shortStrings.link = alternate ? "https://www.reddit.com/r/avengedsevenfold/comments/15cthzm/whats_your_guys_opinion_is_this_legit/" : "https://www.youtube.com/watch?v=SvVvmyzgWvY&ab_channel=TheXMiles";
    this.longStrings.description = alternate ? `"I can take it just for 3$, it's my best price. I don't know if someone wants to buy it, do you understand?" 🤣` : "Reviewbrah has gotten into music recently.";
    return this;
  }

  static examples = {
    default: (new MediaAppearance()).fillConstantExampleData().toFirestore(),
    alternate: (new MediaAppearance()).fillConstantExampleData(true).toFirestore(),
  }

  fromFirestore(data: any) : MediaAppearance {
    const ma = new MediaAppearance();
    ma.id = data.id;
    ma.numbers.order = data.order;
    ma.images.imageSource = data.imageSource;
    ma.shortStrings.title = data.title;
    ma.shortStrings.link = data.link;
    ma.longStrings.description = data.description;
    return ma;
  }
}

export class GalleryVideo extends StaticSiteModel {
  constructor() {
    super("gallery-video", "Gallery Video")
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
    default: (new GalleryVideo()).fillConstantExampleData().toFirestore(),
    shortLink: (new GalleryVideo()).fillConstantExampleData(1).toFirestore(),
    longLink: (new GalleryVideo()).fillConstantExampleData(2).toFirestore(),
  }

  fromFirestore(data: any) : GalleryVideo {
    const gv = new GalleryVideo();
    gv.id = data.id;
    gv.shortStrings.embedCode = data.embedCode;
    return gv;
  }
}

export class ExternalResource extends SiteModel {
  constructor() {
    super("external-resources", "Resource")
  }
  booleans = {}
  images = {
    imageSource: "",
  }
  numbers = {
    order: null,
  }
  shortStrings = {
    title: "",
    link: "",
  }
  longStrings = {
    description: "",
  }

  fillConstantExampleData(alternate?: boolean) {
    this.images.imageSource = alternate ? "https://preview.redd.it/7aiypuw0yweb1.jpg?width=640&crop=smart&auto=webp&s=86cc5a49fa0d1936fe03a901b18726fc267de638" : "https://i.ytimg.com/vi/SvVvmyzgWvY/hq720.jpg?sqp=-oaymwE2COgCEMoBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgBzgWAAoQHigIMCAAQARhlIFIoPzAP&rs=AOn4CLBJA8VdgXgn27gMNH2BQHfPPAr4-A";
    this.shortStrings.title = alternate ? "Avenged Sevenfold Signed CD" : "Reviewbrah's Big Iron Cover";
    this.shortStrings.link = alternate ? "https://www.reddit.com/r/avengedsevenfold/comments/15cthzm/whats_your_guys_opinion_is_this_legit/" : "https://www.youtube.com/watch?v=SvVvmyzgWvY&ab_channel=TheXMiles";
    this.longStrings.description = alternate ? `"I can take it just for 3$, it's my best price. I don't know if someone wants to buy it, do you understand?" 🤣` : "Reviewbrah has gotten into music recently.";
    return this;
  }

  static examples = {
    default: (new ExternalResource()).fillConstantExampleData().toFirestore(),
    alternate: (new ExternalResource()).fillConstantExampleData(true).toFirestore(),
  }

  fromFirestore(data: any) : ExternalResource {
    const er = new ExternalResource();
    er.id = data.id;
    er.numbers.order = data.order;
    er.images.imageSource = data.imageSource;
    er.shortStrings.title = data.title;
    er.shortStrings.link = data.link;
    er.longStrings.description = data.description;
    return er;
  }
}

export class FAQItem extends SiteModel {
  
  constructor() {
    super("faq-items", "FAQ Item")
  }
  
  booleans = {
  }
  images = {}
  numbers = {
    order: null,
  }
  shortStrings = {
    question: "",
  }
  longStrings = {
    answer: "",
  }

  fillConstantExampleData() {
    this.shortStrings.question = "How do I water my garden?";
    this.longStrings.answer = "Watering your garden is essential to keeping it happy, healthy, and vibrant. Consider putting your garden outdoors so that you can make use of natural rainwater.";
    return this;
  }

  static examples = {
    default: (new FAQItem()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : FAQItem {
    const fi = new FAQItem();
    fi.id = data.id;
    fi.shortStrings.question = data.question;
    fi.longStrings.answer = data.answer;
    fi.numbers.order = data.order;
    return fi;
  }
}