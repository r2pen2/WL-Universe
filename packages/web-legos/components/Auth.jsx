import { useEffect, useState } from "react";

import { AuthenticationManager } from "../api/auth.ts";
import { signOut } from "firebase/auth";
import { Button, Input, Link, Loading, Modal, Text, Textarea } from "@nextui-org/react";

/** Where content change requests are tracked: the Web Legos project in Plane (joed.dev SSO). */
export const CHANGE_REQUESTS_URL = "https://plane.joed.dev/main/projects/6ca472a9-89a5-406f-9b6c-ff3039d6ffb2/issues/";

/**
 * Whether the signed-in user is an admin of this site (holds any wl-auth permission).
 * @param {AuthenticationManager} authManager - AuthenticationManager instance for this site
 * @param {FirebaseAuthentication} currentSignIn - currently signed in user state
 * @returns {boolean} false until confirmed, and whenever signed out
 */
export function useIsSiteAdmin(authManager, currentSignIn) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(false);
    if (!authManager || !currentSignIn || !currentSignIn.uid) { return; }
    let cancelled = false;
    authManager.isSiteAdmin(currentSignIn).then((admin) => {
      if (!cancelled) { setIsAdmin(admin); }
    });
    return () => { cancelled = true; };
  }, [authManager, currentSignIn]);

  return isAdmin;
}

/**
 * Form for a site admin to describe a content change. Submitting files a ticket (labelled with this
 * site) and shows its number with a link to track it.
 * @param {AuthenticationManager} authManager - AuthenticationManager instance for this site
 * @param {boolean} open - whether the form is showing
 * @param {Function} onClose - called to close it
 */
export function RequestChangesModal({authManager, open, onClose}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState(null);

  function close() {
    if (sending) { return; }
    onClose();
    // Start fresh next time once a ticket was filed; keep a draft otherwise.
    if (ticket) {
      setTitle("");
      setDescription("");
      setTicket(null);
    }
    setError("");
  }

  async function submit() {
    if (!title.trim()) {
      setError("Please add a short summary.");
      return;
    }
    setSending(true);
    setError("");
    try {
      setTicket(await authManager.requestContentChange({
        title: title.trim(),
        description: description.trim(),
        pageUrl: window.location.href,
      }));
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={close} closeButton blur aria-labelledby="request-changes-title">
      <Modal.Header>
        <Text id="request-changes-title" h4>Request content changes</Text>
      </Modal.Header>
      {ticket ? (
        <Modal.Body>
          <Text aria-label="request-changes-confirmation">
            Thanks! Your request is <b>{ticket.identifier}</b>. You'll see it marked done once the change is live.
          </Text>
          <Link aria-label="request-changes-ticket-link" href={ticket.url} target="_blank" rel="noopener noreferrer" css={{textDecoration: "underline"}}>
            Track {ticket.identifier}
          </Link>
        </Modal.Body>
      ) : (
        <Modal.Body>
          <Input
            aria-label="request-changes-summary"
            label="Summary"
            placeholder="e.g. Update the hours on the contact page"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            fullWidth
            bordered
          />
          <Textarea
            aria-label="request-changes-details"
            label="Details"
            placeholder="What should change, and where? Paste any new text here."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            minRows={5}
            fullWidth
            bordered
          />
          {error && <Text aria-label="request-changes-error" color="error">{error}</Text>}
        </Modal.Body>
      )}
      <Modal.Footer>
        {ticket ? (
          <Button flat auto onClick={close}>Close</Button>
        ) : (
          <>
            <Button flat auto color="" onClick={close} disabled={sending}>Cancel</Button>
            <Button flat auto aria-label="request-changes-submit" color="success" onClick={submit} disabled={sending}>
              {sending ? <Loading type="points" color="currentColor" size="sm" /> : "Send request"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  )
}

/**
 * Opens the RequestChangesModal. FooterAuthButton shows it automatically under the sign-in for admins.
 * @param {AuthenticationManager} authManager - AuthenticationManager instance for this site
 * @param {boolean} link - whether to display as link
 * @param {string} color - link color
 */
export function RequestChangesButton({authManager, link, color}) {
  const [open, setOpen] = useState(false);
  const buttonText = "Request content changes";

  const trigger = link ? (
    <Text aria-label="request-content-changes-button" role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setOpen(true); } }} color={color} css={{cursor: "pointer", textDecoration: "underline"}}>
      {buttonText}
    </Text>
  ) : (
    <Button aria-label="request-content-changes-button" light onClick={() => setOpen(true)}>
      {buttonText}
    </Button>
  );

  return (
    <>
      {trigger}
      <RequestChangesModal authManager={authManager} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/**
 * Admin sign-in/sign-out control for site footers. When an admin of the site is signed in, a
 * RequestChangesButton appears directly under it.
 * @param {AuthenticationManager} authManager - AuthenticationManager instance for this site
 * @param {FirebaseAuthentication} currentSignIn - currently signed in user state
 * @param {Function} setCurrentSignIn - currently signed in user state setter function
 * @param {boolean} link - whether to display as link
 * @param {string} color - link color
 */
export function FooterAuthButton({authManager, currentSignIn, setCurrentSignIn, link, color}) {

  // Update sign-in state on authentication change
  useEffect(() => {
    authManager.auth.onAuthStateChanged(u => {
      setCurrentSignIn(u);
    })
  }, [authManager, setCurrentSignIn])

  const isAdmin = useIsSiteAdmin(authManager, currentSignIn);

  function handleSignInClick() {
    if (authManager.auth.currentUser) {
      setCurrentSignIn(null);
      signOut(authManager.auth).then(() => {
        window.location.reload();
      });
    } else {
      authManager.signInWithGoogle().then(authUser => {
        setCurrentSignIn(authUser);
        if (authUser) {
          const uid = authUser.uid;
          const displayName = authUser.displayName;
          authManager.createNewUser(uid, displayName, authUser.email);
        }
      }).catch((err) => {
        console.warn(err);
        setCurrentSignIn(null);
      });
    }
  }

  const buttonText = currentSignIn ? `Signed in as ${currentSignIn.displayName}` : "Admin Login";

  const authControl = link ? (
    <Text aria-label="admin-login-button" onClick={handleSignInClick} color={color} css={{cursor: "pointer", textDecoration:"underline"}}>
      {buttonText}
    </Text>
  ) : (
    <Button aria-label="admin-login-button" light onClick={handleSignInClick}>
      {buttonText}
    </Button>
  );

  // Visitors get exactly the control they always did; admins get the request button stacked under it.
  if (!isAdmin) {
    return authControl;
  }

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
      {authControl}
      <RequestChangesButton authManager={authManager} link={link} color={color} />
    </div>
  )
}
