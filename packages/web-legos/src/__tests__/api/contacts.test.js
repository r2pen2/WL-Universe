import { addressHref, addressOneLine, emailHref, phoneHref, validateContact } from "../../../api/contacts.ts"

describe("contact hrefs", () => {
  test("email", () => {
    expect(emailHref(" info@room01890.com ")).toBe("mailto:info@room01890.com")
  })

  test("US phone numbers in any format get +1", () => {
    for (const written of ["781-910-4756", "(781) 910-4756", "781.910.4756", "7819104756", "1 781 910 4756", "+1 (781) 910-4756"]) {
      expect(phoneHref(written)).toBe("tel:+17819104756")
    }
  })

  test("vanity letters dial as keypad digits", () => {
    expect(phoneHref("(202) 798-ADHD")).toBe("tel:+12027982343")
  })

  test("extensions and international numbers", () => {
    expect(phoneHref("(617) 555-0123 ext. 12")).toBe("tel:+16175550123;ext=12")
    expect(phoneHref("617-555-0123 x9")).toBe("tel:+16175550123;ext=9")
    expect(phoneHref("+44 20 7946 0958")).toBe("tel:+442079460958")
  })

  test("street addresses become a Google Maps search, one line", () => {
    expect(addressOneLine("38 Church St, 2nd Floor\nWinchester, MA 01890")).toBe("38 Church St, 2nd Floor, Winchester, MA 01890")
    expect(addressOneLine("38 Church St,<br/>Winchester, MA")).toBe("38 Church St, Winchester, MA")
    expect(addressHref("3 Man-Mar Dr #14\nPlainville, MA 02762")).toBe(
      "https://www.google.com/maps/search/?api=1&query=3%20Man-Mar%20Dr%20%2314%2C%20Plainville%2C%20MA%2002762",
    )
  })

  test("validation", () => {
    expect(validateContact("email", "nope")).toBeTruthy()
    expect(validateContact("email", "a@b.co")).toBe("")
    expect(validateContact("phone", "12")).toBeTruthy()
    expect(validateContact("phone", "(202) 798-ADHD")).toBe("")
    expect(validateContact("address", "  ")).toBeTruthy()
  })
})

describe("linkifyContacts", () => {
  const { linkifyContacts } = require("../../../api/contacts.ts")

  test("links emails and phone numbers in CMS text", () => {
    const out = linkifyContacts("I can be reached at (215) 668-7277.<br/>Or jess@youcandoitgardening.com")
    expect(out).toContain('<a class="wl-contact wl-contact--phone" href="tel:+12156687277">(215) 668-7277</a>.')
    expect(out).toContain('<a class="wl-contact wl-contact--email" href="mailto:jess@youcandoitgardening.com">jess@youcandoitgardening.com</a>')
    expect(linkifyContacts("Call 781-910-4756 today")).toBe('Call <a class="wl-contact wl-contact--phone" href="tel:+17819104756">781-910-4756</a> today')
  })

  test("leaves existing links, attributes, prices and long numbers alone", () => {
    const linked = '<a href="mailto:a@b.com" target="blank">a@b.com</a> and <a href="https://x.com/617-555-0123">site</a>'
    expect(linkifyContacts(linked)).toBe(linked)
    expect(linkifyContacts("$75 for 2024 sessions, order 12345678901234")).toBe("$75 for 2024 sessions, order 12345678901234")
    expect(linkifyContacts("")).toBe("")
  })
})
