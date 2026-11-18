import React from "react";
import Alert from "@mui/material/Alert";

import { mailingListLink } from "../api/links.js";
import "../assets/style/mailingListButton.css";

/** The homepage hero's "join my mailing list" button: a green alert that wobbles in a slow figure eight. */
export default function MailingListButton({ href = mailingListLink, children = "Click here to join my mailing list!" }) {
  return (
    <div className="mailing-list-wobble">
      <Alert className="mailing-list-alert" severity="success">
        <a target="_blank" rel="noreferrer" href={href}>{children}</a>
      </Alert>
    </div>
  );
}
