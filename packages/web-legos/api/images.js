// Library Imports
import imageCompression from "browser-image-compression";

/**
 * A class used to interface with the {@link imageCompression} from "browser-image-compression".
 */
export class ImageCompressor {

  /** @static Default max image size after compression */
  static defaultMaxSizeMb = 1;

  /** @static Default max image size after compression */
  static defaultMaxWidthOrHeight = 600;

  /**
   * @static
   * Default options for {@link imageCompression} library, used when calling static methods.
   */
  static defaultCompressionOptions = {
    maxSizeMb: ImageCompressor.defaultMaxSizeMb,
    maxWidthOrHeight: ImageCompressor.defaultMaxWidthOrHeight,
    useWebWorker: true,
    maxIteration: 5,
  }

  compressionOptions = {}

  /**
   * Create an {@link ImageCompressor} with the specified options
   * @param {number} _maxSizeMb - the maximum size of the image after compression
   * @param {number} _maxWidthOrHeight - the maximum width or height of the image after compression
   */
  constructor(_maxSizeMb, _maxWidthOrHeight) {
    this.compressionOptions["maxSizeMb"] = _maxSizeMb;
    this.compressionOptions["maxWidthOrHeight"] = _maxWidthOrHeight;
  }

  /**
   * Compresses an HTMLImageElement with {@link defaultCompressionOptions} and returns the resulting (hopefully) smaller file
   * @param {File} imageFile - the HTMLImageElement to compress
   * @returns A promise resolved with a File after compression has been applied.
   */
  static async compressImage(imageFile) {
    if (!imageFile) { return null; }
    return new Promise(async (resolve, reject) => {
      try {
        let compressedFile = await imageCompression(imageFile, ImageCompressor.defaultCompressionOptions);
        resolve(compressedFile);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  /**
   * Compresses an HTMLImageElement with the current {@link ImageCompressor} instance's options and returns the resulting (hopefully) smaller file
   * @param {File} imageFile - the HTMLImageElement to compress
   * @returns A promise resolved with a File after compression has been applied.
   */
  async compressImage(imageFile) {
    return new Promise(async (resolve, reject) => {
      try {
        const compressedFile = await imageCompression(imageFile, ImageCompressor.defaultCompressionOptions);
        resolve(compressedFile);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}
