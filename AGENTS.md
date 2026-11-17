# AGENTS.md

House rules for agents working in WL-Universe. They apply to every WL site (`packages/<site>/client`) and to any new site or site port. When one of these rules conflicts with how an older site does things, follow the rule.

## 1. Contact info is always a WL contact component

Every email address, phone number and street address on a site is rendered with a web-legos contact component. Never write it as plain text, a hard-coded `mailto:`/`tel:`/`callto:` link, or a WL text id.

| Shows | Component | Link it builds |
| --- | --- | --- |
| Email address | `WLEmailAddress` | `mailto:` |
| Phone number | `WLPhoneNumber` | `tel:+1…` (handles any format, vanity letters, extensions) |
| Street address | `WLStreetAddress` | Google Maps search (`singleLine` joins the lines with commas) |
| All of one type | `WLContactList type="email"` | one link each (`showLabels`, `block`) |

```jsx
import { WLEmailAddress, WLPhoneNumber, WLStreetAddress } from "../libraries/Web-Legos/components/Contacts.jsx";

<WLEmailAddress fallback="info@example.com" />
<WLPhoneNumber fallback="(617) 555-0123" className="site-contact__value" />
<WLStreetAddress fallback={"38 Church St, 2nd Floor\nWinchester, MA 01890"} />
// Keep a site's NextUI styling with a render function:
<WLEmailAddress fallback="info@example.com">{({ display }) => <Text css={{ textDecoration: "underline" }}>{display}</Text>}</WLEmailAddress>
```

- **Where the values live.** They are stored in the CMS (wl-cms model collection `siteContacts`, one per siteKey). A site can have any number of each type. Pick one with `id` or `index`; with neither, you get the first of its type.
- **Fallbacks.** `fallback` is the value shown until the CMS has one. Put a site's fallbacks in one place (e.g. `CONTACTS` in `content.js`).
- **Seeding.** Add the site's starting contacts to [deploy/cms/site-contacts.json](deploy/cms/site-contacts.json). The deploy workflow seeds a site from that file only while its CMS has none.
- **Editing.** Admins edit contacts in **Site settings**. `FooterAuthButton` adds the Site settings button and makes the components clickable for admins, so the site needs no extra wiring beyond rendering `FooterAuthButton`.
- **Icon buttons and other hrefs.** For a link that isn't the address itself (an envelope icon, a "Call us" button), use `useContactHref("phone", { fallback })` from `api/contacts.ts` instead of a literal href.
- **Contact info inside CMS paragraphs.** Emails and phone numbers that appear in running text are linked automatically when WL text renders. Don't hand-write links into seeded copy.
- **Exceptions.** Only `window.alert` strings, form placeholders and `MailManager` recipient lists may contain a bare address.

## 2. Forms go through wl-forms, with a site-mail notification

Every form a visitor submits (contact, inquiry, sign-up) saves a `FormResponse` through wl-forms and sends an email through site-mail. Never use `mailto:` forms, third-party form services, Wix/Google Forms embeds, or Firestore writes from the client.

- **Saving the response.** `new FormResponse(formId)` from `api/admin.ts`, with readable `content` keys (e.g. "First Name"). `formId` is `<site>-<form>`, e.g. `room01890-inquiry`. Responses land in the shared `siteForms` collection.
- **Notification.** Create a `MailManager` in `App.jsx` for the site's profile, `addRecipientEmail()` the client's address and `joedobbelaar@gmail.com`, and send a short summary of the submission.
- **Success and errors.** Show success if either the form save or the email went through. Show a friendly error only if both failed, and include `WLEmailAddress` in it.
- **Spam.** Add a hidden honeypot field. Only add reCAPTCHA if the site already has a key for its domain.
- **Registration.** Register the site in [packages/wl-forms/lib/sites.js](packages/wl-forms/lib/sites.js) and set up the mail profile (`SITE_<SLUG>_*` in site-mail).

## 3. Porting a site into WL-Universe

When asked to rebuild an existing site, the first pass should include all of this:

- **New package.** Hand-written CRA site in `packages/<slug>/`, copied from the newest v2 site (currently `room01890`, or `boston-mixtape`), with a new siteKey in the shared `wladminportal` project. Work on a branch or worktree off `main`.
- **Text.** Every piece of copy is a WL header or text element (`WLLayoutHeader` / `WLLayoutText`, or `WLHeaderV2` / `WLTextV2`) with a readable kebab-case id per section (`hero-header`, `footer-mission-text`). Keep the source copy exactly, typos included, in `content.js`; it doubles as the fallback. Seed it with a `scripts/seed-cms.mjs`.
- **Images.** Every photo is a `WLImageV2`, loaded from the source site's own image files and seeded into the CMS. Logos and SVG icons/glyphs are downloaded into `source-assets/` and bundled.
- **Contact info and forms.** Contact info follows rule 1 and forms follow rule 2.
- **Reuse web-legos.** Use `WLNav` with `WLNav.Toggle` for the header and mobile menu, `WLFooterSocials` and `FooterAuthButton` in the footer. Add anything generic to web-legos (additively; every SPA site rebuilds when it changes) rather than to the site.
- **Layout.** Match the source at desktop, tablet and phone widths: compare screenshots side by side, and check the text against the source.
- **Registration.** Register the site everywhere a new site goes: `wl-cms`, `wl-auth` and `wl-forms` `lib/sites.js`; `scripts/dev/catalog.mjs`; `scripts/qa/apps.mjs` (with `provision`); `deploy/compose/<slug>.yml` and its env examples; liveness; site audit; fleet inventory; Umami.
- **Deploy.** Deploy at `<slug>.joed.dev` through the normal pipeline. After merging, note the manual steps (Firebase authorized domain, Umami provisioning).

## 4. General

- **Where things go.** Only WL services and sites belong in this repo. Other infrastructure lives in its own repo. Admin access goes through joed.dev SSO.
- **Privacy.** Don't put clients' private details in this public repo (billing details come from secrets). Contact info that is already published on a client's site is fine.
- **Commits.** Commit as the repo's existing author identity, and open a PR. The QA preview (`pr-<n>-<app>.joed.dev`) must come up before merging.
