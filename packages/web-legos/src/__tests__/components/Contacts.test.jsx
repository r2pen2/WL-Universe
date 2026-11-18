import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { WLContactList, WLEmailAddress, WLPhoneNumber, WLStreetAddress } from "../../../components/Contacts"
import { ContactInfoModal as SiteSettingsModal } from "../../../components/SiteSettings"
import { MailManager } from "../../../api/mail.ts"
import { CmsManager } from "../../../api/cms.ts"
import { openSiteSettings, resetContactsStore, setContactsEditable } from "../../../api/contacts.ts"

let docs
let posts

function mockCms(initial) {
  docs = initial
  posts = []
  CmsManager.configure({ site: "test-site", apiKey: "k", apiUrl: "https://cms.test" })
  global.fetch = jest.fn(async (url, init = {}) => {
    if (init.method === "POST") {
      const body = JSON.parse(init.body)
      posts.push(body)
      if (body.action === "delete") docs = docs.filter((d) => d.id !== body.documentId)
      else docs = [...docs.filter((d) => d.id !== body.documentId), { id: body.documentId, ...body.documentData }]
      return { ok: true, status: 200 }
    }
    return { ok: true, status: 200, json: async () => docs }
  })
}

beforeEach(() => {
  resetContactsStore()
})

describe("WL contact links", () => {
  test("show the fallback as a link until the CMS answers, then the CMS value", async () => {
    mockCms([{ id: "email-main", type: "email", value: "hello@site.com", order: 0 }])
    render(<WLEmailAddress fallback="old@site.com" ariaLabel="email" />)
    expect(screen.getByLabelText("email")).toHaveAttribute("href", "mailto:old@site.com")
    await waitFor(() => expect(screen.getByLabelText("email")).toHaveTextContent("hello@site.com"))
    expect(screen.getByLabelText("email")).toHaveAttribute("href", "mailto:hello@site.com")
    expect(global.fetch.mock.calls[0][0]).toContain("/site-models?collection=siteContacts")
  })

  test("pick by id or index; phone and address hrefs are built", async () => {
    mockCms([
      { id: "p1", type: "phone", value: "(202) 798-ADHD", order: 0 },
      { id: "p2", type: "phone", value: "781-910-4756", order: 1 },
      { id: "a1", type: "address", value: "38 Church St, 2nd Floor\nWinchester, MA", order: 0 },
    ])
    render(<>
      <WLPhoneNumber ariaLabel="first" />
      <WLPhoneNumber ariaLabel="second" index={1} />
      <WLPhoneNumber ariaLabel="by-id" id="p2" />
      <WLStreetAddress ariaLabel="address" />
      <WLStreetAddress ariaLabel="address-line" singleLine />
    </>)
    await waitFor(() => expect(screen.getByLabelText("first")).toHaveAttribute("href", "tel:+12027982343"))
    expect(screen.getByLabelText("first")).toHaveTextContent("(202) 798-ADHD")
    expect(screen.getByLabelText("second")).toHaveAttribute("href", "tel:+17819104756")
    expect(screen.getByLabelText("by-id")).toHaveAttribute("href", "tel:+17819104756")
    const address = screen.getByLabelText("address")
    expect(address.querySelector("br")).not.toBeNull()
    expect(address).toHaveAttribute("target", "_blank")
    expect(address.getAttribute("href")).toContain("google.com/maps/search")
    expect(screen.getByLabelText("address-line")).toHaveTextContent("38 Church St, 2nd Floor, Winchester, MA")
  })

  test("only style and className customize it; nothing rendered with no value", async () => {
    mockCms([])
    const { container } = render(<>
      <WLEmailAddress fallback="x@y.com" ariaLabel="styled" className="site-email" style={{ color: "rgb(1, 2, 3)" }} />
      <WLPhoneNumber ariaLabel="none" />
    </>)
    const link = screen.getByLabelText("styled")
    expect(link).toHaveAttribute("href", "mailto:x@y.com")
    expect(link).toHaveTextContent("x@y.com")
    expect(link).toHaveClass("wl-contact", "site-email")
    expect(link).toHaveStyle({ color: "rgb(1, 2, 3)" })
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.queryByLabelText("none")).toBeNull()
    expect(container.querySelectorAll("a")).toHaveLength(1)
  })

  test("WLContactList renders every contact of a type", async () => {
    mockCms([
      { id: "e1", type: "email", value: "one@site.com", order: 0 },
      { id: "e2", type: "email", value: "two@site.com", order: 1 },
    ])
    const { container } = render(<WLContactList type="email" fallback={["only@site.com"]} />)
    await waitFor(() => expect(container.querySelectorAll("a")).toHaveLength(2))
    expect(container.querySelectorAll("a")[1]).toHaveAttribute("href", "mailto:two@site.com")
  })
})

describe("editing through the Contact info menu", () => {
  test("admins click a contact to open the Contact info menu at it, edit, and save", async () => {
    mockCms([{ id: "email-main", type: "email", value: "hello@site.com", order: 0 }])
    render(<>
      <WLEmailAddress ariaLabel="email" />
      <WLPhoneNumber fallback="781-910-4756" ariaLabel="phone" />
      <SiteSettingsModal />
    </>)
    await waitFor(() => expect(screen.getByLabelText("email")).toHaveTextContent("hello@site.com"))
    act(() => setContactsEditable(true))

    // Clicking doesn't follow the link; it opens the Contact info menu with the contact focused.
    const click = new MouseEvent("click", { bubbles: true, cancelable: true })
    act(() => { screen.getByLabelText("email").dispatchEvent(click) })
    expect(click.defaultPrevented).toBe(true)
    const email = await screen.findByLabelText("Email addresses 1")
    expect(email).toHaveValue("hello@site.com")
    await waitFor(() => expect(email).toHaveFocus())

    // The phone the page shows (not in the CMS yet) is offered as a draft.
    expect(screen.getByLabelText("Phone numbers 1")).toHaveValue("781-910-4756")

    fireEvent.change(email, { target: { value: "not an email" } })
    fireEvent.click(screen.getByLabelText("site-settings-save"))
    expect(await screen.findByText("Not an email address")).toBeInTheDocument()
    expect(posts).toHaveLength(0)

    fireEvent.change(email, { target: { value: "new@site.com" } })
    fireEvent.click(screen.getByText("+ Add email"))
    fireEvent.change(screen.getByLabelText("Email addresses 2"), { target: { value: "second@site.com" } })
    fireEvent.click(screen.getByLabelText("site-settings-save"))

    await waitFor(() => expect(screen.getByLabelText("email")).toHaveTextContent("new@site.com"))
    expect(docs).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "email-main", type: "email", value: "new@site.com", order: 0 }),
      expect.objectContaining({ type: "email", value: "second@site.com", order: 1 }),
      expect.objectContaining({ type: "phone", value: "781-910-4756", order: 0 }),
    ]))
  })

  test("removing a contact deletes it", async () => {
    mockCms([
      { id: "e1", type: "email", value: "one@site.com", order: 0 },
      { id: "e2", type: "email", value: "two@site.com", order: 1 },
    ])
    render(<><WLEmailAddress ariaLabel="email" editable /><SiteSettingsModal /></>)
    await waitFor(() => expect(screen.getByLabelText("email")).toHaveTextContent("one@site.com"))
    fireEvent.click(screen.getByLabelText("email"))
    await waitFor(() => expect(screen.getByLabelText("Email addresses 1")).toHaveValue("one@site.com"))
    fireEvent.click(screen.getByLabelText("Remove Email addresses 1"))
    fireEvent.click(screen.getByLabelText("site-settings-save"))
    await waitFor(() => expect(screen.getByLabelText("email")).toHaveTextContent("two@site.com"))
    expect(posts).toContainEqual(expect.objectContaining({ documentId: "e1", action: "delete" }))
    expect(docs).toEqual([expect.objectContaining({ id: "e2", order: 0 })])
  })
})

describe("contact form recipients", () => {
  test("the menu lists them only on sites with a contact form, without the hidden copy", async () => {
    mockCms([{ id: "e1", type: "email", value: "hello@site.com", order: 0 }])
    render(<SiteSettingsModal />)
    act(() => openSiteSettings())
    await screen.findByLabelText("Email addresses 1")
    expect(screen.queryByText("Contact form messages go to")).toBeNull()
  })

  test("a MailManager adds the group, with its fallbacks as drafts and the hidden recipient left out", async () => {
    mockCms([{ id: "e1", type: "email", value: "hello@site.com", order: 0 }])
    const mail = new MailManager({ site: "test-site", apiKey: "m" })
    mail.addHiddenRecipient("dev@wl.test")
    mail.addRecipientEmail("owner@site.com")
    render(<SiteSettingsModal />)
    act(() => openSiteSettings())
    expect(await screen.findByText("Contact form messages go to")).toBeInTheDocument()
    expect(await screen.findByLabelText("Contact form messages go to 1")).toHaveValue("owner@site.com")
    expect(screen.queryByLabelText("Contact form messages go to 2")).toBeNull()
    expect(screen.queryByDisplayValue("dev@wl.test")).toBeNull()
    // No descriptions or hints, just the fields.
    expect(screen.queryByText(/not saved yet|Link:|Shown everywhere/)).toBeNull()

    fireEvent.click(screen.getByLabelText("site-settings-save"))
    await waitFor(() => expect(docs).toContainEqual(expect.objectContaining({ type: "formRecipient", value: "owner@site.com", order: 0 })))
    // Page contact components never show recipients.
    render(<WLEmailAddress ariaLabel="email" index={1} fallback="none@site.com" />)
    expect(screen.getByLabelText("email")).toHaveTextContent("none@site.com")
  })

  test("MailManager sends to the saved recipients plus the hidden ones, else its fallbacks", async () => {
    mockCms([
      { id: "r1", type: "formRecipient", value: "Saved@Site.com", order: 0 },
      { id: "r2", type: "formRecipient", value: "dev@wl.test", order: 1 },
    ])
    const mail = new MailManager({ site: "test-site", apiKey: "m" })
    mail.addRecipientEmail("fallback@site.com")
    mail.addHiddenRecipient("dev@wl.test")
    expect(await mail.resolveRecipients()).toEqual(["Saved@Site.com", "dev@wl.test"])

    resetContactsStore()
    mockCms([])
    expect(await mail.resolveRecipients()).toEqual(["fallback@site.com", "dev@wl.test"])

    const off = new MailManager({ site: "test-site", apiKey: "m", formRecipientsFromCms: false })
    off.addRecipientEmail("only@site.com")
    expect(await off.resolveRecipients()).toEqual(["only@site.com"])
  })
})
