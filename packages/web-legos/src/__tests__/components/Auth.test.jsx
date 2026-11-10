import { FooterAuthButton, CHANGE_REQUESTS_URL } from "../../../components/Auth"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("firebase/auth", () => ({ signOut: jest.fn(() => Promise.resolve()) }))

function fakeAuthManager(isAdmin) {
  return {
    auth: { onAuthStateChanged: jest.fn(), currentUser: null },
    isSiteAdmin: jest.fn(() => Promise.resolve(isAdmin)),
  }
}

const admin = { uid: "u1", displayName: "Pat" }

describe("FooterAuthButton: request content changes", () => {

  test("signed out: only the login, and admin status isn't looked up", () => {
    const authManager = fakeAuthManager(true)
    render(<FooterAuthButton authManager={authManager} currentSignIn={null} setCurrentSignIn={() => {}} />)
    expect(screen.getByLabelText("admin-login-button")).toHaveTextContent("Admin Login")
    expect(screen.queryByLabelText("request-content-changes-button")).toBeNull()
    expect(authManager.isSiteAdmin).not.toHaveBeenCalled()
  })

  test("signed in without permissions: no request button", async () => {
    const authManager = fakeAuthManager(false)
    render(<FooterAuthButton authManager={authManager} currentSignIn={admin} setCurrentSignIn={() => {}} />)
    await waitFor(() => expect(authManager.isSiteAdmin).toHaveBeenCalledWith(admin))
    expect(screen.queryByLabelText("request-content-changes-button")).toBeNull()
  })

  test("signed in as an admin: request button under the login", async () => {
    render(<FooterAuthButton authManager={fakeAuthManager(true)} currentSignIn={admin} setCurrentSignIn={() => {}} />)
    const request = await screen.findByLabelText("request-content-changes-button")
    const login = screen.getByLabelText("admin-login-button")
    expect(login).toHaveTextContent("Signed in as Pat")
    // Same column, login first.
    expect(login.parentElement).toBe(request.parentElement)
    expect(login.compareDocumentPosition(request) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test("the form files a ticket and shows its number and link", async () => {
    const authManager = fakeAuthManager(true)
    authManager.requestContentChange = jest.fn(() => Promise.resolve({ identifier: "WL-12", url: "https://plane.joed.dev/main/browse/WL-12/" }))
    render(<FooterAuthButton link color="#8C8C8C" authManager={authManager} currentSignIn={admin} setCurrentSignIn={() => {}} />)
    fireEvent.click(await screen.findByLabelText("request-content-changes-button"))

    // No separate subject: just the details, which are required.
    expect(screen.queryByLabelText("request-changes-summary")).toBeNull()
    fireEvent.click(await screen.findByLabelText("request-changes-submit"))
    expect(await screen.findByLabelText("request-changes-error")).toHaveTextContent("describe the change")
    expect(authManager.requestContentChange).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText("request-changes-details"), { target: { value: "  Mon-Fri 9-5  " } })
    fireEvent.click(screen.getByLabelText("request-changes-submit"))

    expect(await screen.findByLabelText("request-changes-confirmation")).toHaveTextContent("WL-12")
    expect(authManager.requestContentChange).toHaveBeenCalledWith({ description: "Mon-Fri 9-5", pageUrl: window.location.href })
    const link = screen.getByLabelText("request-changes-ticket-link")
    expect(link).toHaveAttribute("href", "https://plane.joed.dev/main/browse/WL-12/")
    expect(link).toHaveAttribute("target", "_blank")
  })

  test("the form shows the server's error and keeps the draft", async () => {
    const authManager = fakeAuthManager(true)
    authManager.requestContentChange = jest.fn(() => Promise.reject(new Error("Only site admins can request changes")))
    render(<FooterAuthButton authManager={authManager} currentSignIn={admin} setCurrentSignIn={() => {}} />)
    fireEvent.click(await screen.findByLabelText("request-content-changes-button"))
    fireEvent.change(await screen.findByLabelText("request-changes-details"), { target: { value: "x" } })
    fireEvent.click(screen.getByLabelText("request-changes-submit"))
    expect(await screen.findByLabelText("request-changes-error")).toHaveTextContent("Only site admins")
    expect(screen.getByLabelText("request-changes-details")).toHaveValue("x")
  })
})

test("CHANGE_REQUESTS_URL points at the WL project in Plane", () => {
  expect(CHANGE_REQUESTS_URL).toMatch(/^https:\/\/plane\.joed\.dev\/main\/projects\/[0-9a-f-]{36}\/issues\/$/)
})
