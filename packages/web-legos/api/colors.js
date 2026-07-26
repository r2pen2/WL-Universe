// First, we have a library of nice colors

// ---- Neutral Colors ---- //
export const gray900 = "#1A1A1E"
export const gray800 = "#3a3a3f"
export const gray700 = "#59595d"
export const gray600 = "#6c6c71"
export const gray500 = "#94949a"
export const gray400 = "#b4b4ba"
export const gray300 = "#d8d8de"
export const gray200 = "#e8e8ee"
export const gray100 = "#f1f1f7"
export const gray50 = "#f8f8fe"

// ---- Vibrant Colors ---- //
export const red50 = '#ffeaed'
export const red100 = '#ffcbd0'
export const red200 = '#f69695'
export const red300 = '#ee6c6c'
export const red400 = '#f94745'
export const red500 = '#fd3127'
export const red600 = '#EF2427'
export const red700 = '#dd1522'
export const red800 = '#d0041a'
export const red900 = '#c2000a'

export const orange50 = "#fbe9e6"
export const orange100 = "#ffcbbb"
export const orange200 = "#ffaa8e"
export const orange300 = "#ff8861"
export const orange400 = "#fe6e3e"
export const orange500 = "#FE541B"
export const orange600 = "#f34e17"
export const orange700 = "#e54712"
export const orange800 = "#d7400d"
export const orange900 = "#bf3203"

export const lavender600 = "#7149F6";

// ---- Figma Colors ---- //
export const swanGray = "#8C8C8C"
export const swanDarkGray = "#8C8C8C"
export const swanWhite = "#f4fbfc"
export const swanBlueGray = "#2B3C60"
export const swanPurple = "#5738B3"

export class ColorMaster {



  /**
   * Default shade for a ColorMaster instance
   * @type {number | null}
   */
  shade = null;

  /**
   * Strip the hash from a hex string
   * @param {string} colorString - hex string to sanitize
   * @returns {string} hex string without hash
   */
  static sanitize(colorString) {
    return colorString.replace("#", "");
  }

  /**
   * Adds two hex colors together.
   * @param {string} c1 - First hex color string.
   * @param {string} c2 - Second hex color string.
   * @returns {string} Sum of the two hex color strings.
   */
  static addHexColor(c1, c2) {
    c1 = this.sanitize(c1);
    c2 = this.sanitize(c2);
    var hexStr = (parseInt(c1, 16) + parseInt(c2, 16)).toString(16);
    while (hexStr.length < 6) { hexStr = '0' + hexStr; } // Zero pad.
    return hexStr;
  }

  /**
   * Subtracts the second hex color from the first hex color.
   * @param {string} c1 - Hex color to subtract from.
   * @param {string} c2 - Hex color to subtract.
   * @returns {string} Resultant hex color after subtraction.
   */
  static subtractHexColor(c1, c2) {
    return this.addHexColor(c1, `-${c2}`);
  }

  /**
   * Applies a shade to a given color.
   * @param {string} color - Hex color to which the shade should be applied.
   * @returns {string} Resultant color after applying the shade.
   */
  applyShade(color) {
    return ColorMaster.addHexColor(color, this.shade);
  }
}
