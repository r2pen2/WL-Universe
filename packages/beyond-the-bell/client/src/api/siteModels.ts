// @ts-ignore
import { SiteModel } from "../libraries/Web-Legos/api/models.ts";

export class GalleryPicture extends SiteModel {
  constructor() {
    super("gallery-pictures", "Gallery Picture")
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
    default: (new GalleryPicture()).fillConstantExampleData().toFirestore(),
  }

  fromFirestore(data: any) : GalleryPicture {
    const instance = new GalleryPicture();
    instance.id = data.id;
    instance.longStrings.caption = data.caption;
    instance.numbers.order = data.order;
    instance.images.imageSource = data.imageSource;
    return instance;
  }

}