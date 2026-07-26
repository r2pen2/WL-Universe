import { ColorMaster } from "../../../api/colors"

describe("ColorMaster tests", () => {
  test("ColorMaster.sanizize() removes hash from hex string", () => {
    const sanitizedString = "aa0000"
    const unSanitizedString = "#aa0000"
    const result = ColorMaster.sanitize(unSanitizedString)
    expect(result).toEqual(sanitizedString);
  })

  test("ColorMaster.sanizize() does nothing when hex string has no hash", () => {
    const alreadySanitizedString = "aa0000"
    const result = ColorMaster.sanitize(alreadySanitizedString);
    expect(result).toEqual(alreadySanitizedString);
  })

  test("ColorMaster.addHexColor() adds colors accurately", () => {
    const c1 = "00bbcc"
    const c2 = "00aabb"
    const result = ColorMaster.addHexColor(c1, c2);
    expect(result).toEqual("016687")
  })

  test("ColorMaster.substractHexColor() subtracts colors accurately", () => {
    const c1 = "016687"
    const c2 = "00aabb"
    const result = ColorMaster.subtractHexColor(c1, c2);
    expect(result).toEqual("00bbcc")
  })

  test("ColorMaster.addHexColor() sanitizes strings before adding", () => {
    const c1 = "#00bbcc"
    const c2 = "#00aabb"
    const result = ColorMaster.addHexColor(c1, c2);
    expect(result).toEqual("016687")
  })

  test("ColorMaster.substractHexColor() sanitizes strings before subtracting", () => {
    const c1 = "#016687"
    const c2 = "#00aabb"
    const result = ColorMaster.subtractHexColor(c1, c2);
    expect(result).toEqual("00bbcc")
  })

  test("ColorMaster.applyShade() uses instance's shade", () => {
    const colorMaster = new ColorMaster();
    const c1 = "#00bbcc"
    colorMaster.shade = "00aabb";
    const result = colorMaster.applyShade(c1);
    expect(result).toEqual("016687")
  })
})
