import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import wl from "../plugin.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
});

tester.run("contact-links", wl.rules["contact-links"], {
  valid: [
    `<WLEmailAddress fallback="info@example.com" />`,
    `const href = useContactHref("phone", { fallback: "(617) 555-0123" });`,
    `<a href="https://example.com">Site</a>`,
  ],
  invalid: [
    { code: `<a href="mailto:info@example.com">Email</a>`, errors: [{ messageId: "link" }] },
    { code: `<Link href="callto:6175550123">Call</Link>`, errors: [{ messageId: "link" }] },
    { code: "window.open(`tel:${phone}`)", errors: [{ messageId: "link" }] },
  ],
});

tester.run("no-contact-text", wl.rules["no-contact-text"], {
  valid: [
    `<WLEmailAddress fallback="info@example.com" />`,
    `<input placeholder="email@company.com" />`,
    `<path d="M23.5594 14.7228 0 0 24 24 123 456 7890" />`,
    `<p>Call us any time</p>`,
    `<Text>$75 for 2024 sessions</Text>`,
  ],
  invalid: [
    { code: `<p>Email info@example.com today</p>`, errors: [{ messageId: "email" }] },
    { code: `<Text>(617) 555-0123</Text>`, errors: [{ messageId: "phone" }] },
    { code: `<Text>{"781-910-4756"}</Text>`, errors: [{ messageId: "phone" }] },
    { code: `<Button aria-label="Email info@example.com" />`, errors: [{ messageId: "email" }] },
  ],
});

tester.run("wl-text", wl.rules["wl-text"], {
  valid: [
    `<WLHeaderV2 firestoreId="hero-header" />`,
    `<h1><WLLayoutText id="x" /></h1>`,
    `<p>{status}</p>`,
    `<p>・</p>`,
  ],
  invalid: [
    { code: `<h1>Meet and Mingle</h1>`, errors: [{ messageId: "heading" }] },
    { code: `<p>Connect with new people.</p>`, errors: [{ messageId: "paragraph" }] },
    { code: `<h3>{"Our Space"}</h3>`, errors: [{ messageId: "heading" }] },
  ],
});

tester.run("wl-images", wl.rules["wl-images"], {
  valid: [
    `import logo from "./logo.png"; <img src={logo} alt="" />`,
    `import facebook from "./fb.svg"; import x from "./x.svg"; const ICONS = { facebook, x }; <img src={ICONS[key]} alt="" />`,
    `<img src={cmsAssetUrl(member.imageSource)} alt="" />`,
    `<WLImageV2 firestoreId="hero-image" />`,
  ],
  invalid: [
    { code: `<img src="https://static.wixstatic.com/media/a.jpg" alt="" />`, errors: [{ messageId: "img" }] },
    { code: `<img src={photoUrl} alt="" />`, errors: [{ messageId: "img" }] },
    { code: `const photos = { a: "https://x/y.jpg" }; <img src={photos.a} alt="" />`, errors: [{ messageId: "img" }] },
  ],
});

tester.run("wl-forms", wl.rules["wl-forms"], {
  valid: [
    `import { FormResponse } from "../libraries/Web-Legos/api/admin.ts";`,
    `import { initializeApp } from "firebase/app";`,
    `<form onSubmit={submit}></form>`,
  ],
  invalid: [
    { code: `import { getFirestore } from "firebase/firestore";`, errors: [{ messageId: "import" }] },
    { code: `import emailjs from "@emailjs/browser";`, errors: [{ messageId: "import" }] },
    { code: `<form action="https://formspree.io/f/abc"></form>`, errors: [{ messageId: "action" }] },
  ],
});
