import { FooterAuthButton, CHANGE_REQUESTS_URL } from "../../../components/Auth"
import { render, screen, waitFor } from "@testing-library/react"
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

  test("link style: request link opens Plane in a new tab", async () => {
    render(<FooterAuthButton link color="#8C8C8C" authManager={fakeAuthManager(true)} currentSignIn={admin} setCurrentSignIn={() => {}} />)
    const request = await screen.findByLabelText("request-content-changes-button")
    expect(request).toHaveAttribute("href", CHANGE_REQUESTS_URL)
    expect(request).toHaveAttribute("target", "_blank")
    expect(request).toHaveAttribute("rel", "noopener noreferrer")
  })
})
