/**
 * eslint-plugin-wl: keeps WL sites on WL components (see AGENTS.md).
 *
 * The rules only run on site code (packages/<site>/client/src, minus the synced web-legos copy in
 * libraries/). web-legos is where the raw primitives (<a href="mailto:">, <img>, <h1>) are allowed
 * to live; sites import the WL component instead.
 */

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(^|[^\w+])(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]\d{4}(?!\w)/;
const CONTACT_SCHEME = /^\s*(mailto|tel|callto):/i;

const TEXT_ELEMENTS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p"]);
// Attributes whose text visitors see or hear (others, like className or an SVG path's d, aren't copy).
const VISIBLE_ATTRS = new Set(["title", "alt", "aria-label", "label", "value", "content", "text", "caption", "subtitle", "description", "header", "tooltip"]);
const RESTRICTED_IMPORTS = {
  "firebase/firestore": "Read site data through wl-cms (web-legos api) and save form responses with FormResponse (wl-forms).",
  "firebase/database": "Read site data through wl-cms (web-legos api) and save form responses with FormResponse (wl-forms).",
  "@emailjs/browser": "Send form notifications through site-mail (web-legos MailManager).",
  "emailjs-com": "Send form notifications through site-mail (web-legos MailManager).",
};

function stringValue(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral") return node.quasis.map((q) => q.value.cooked ?? "").join("");
  return null;
}

function elementName(node) {
  const name = node.openingElement ? node.openingElement.name : node.name;
  return name && name.type === "JSXIdentifier" ? name.name : null;
}

function attribute(opening, name) {
  return opening.attributes.find((a) => a.type === "JSXAttribute" && a.name && a.name.name === name);
}

const contactLinks = {
  meta: {
    type: "problem",
    docs: { description: "No hand-written mailto:/tel:/callto: links; use WL contact components." },
    messages: {
      link: "Hard-coded {{scheme}}: link. Render WLEmailAddress / WLPhoneNumber, or use useContactHref() for an icon or button (AGENTS.md rule 1).",
    },
    schema: [],
  },
  create(context) {
    function check(node) {
      const value = stringValue(node);
      const match = value && CONTACT_SCHEME.exec(value);
      if (match) context.report({ node, messageId: "link", data: { scheme: match[1].toLowerCase() } });
    }
    return { Literal: check, TemplateLiteral: check };
  },
};

const noContactText = {
  meta: {
    type: "problem",
    docs: { description: "No email addresses or phone numbers written into JSX." },
    messages: {
      email: "Email address written into the page. Use <WLEmailAddress fallback=\"...\" /> (AGENTS.md rule 1).",
      phone: "Phone number written into the page. Use <WLPhoneNumber fallback=\"...\" /> (AGENTS.md rule 1).",
    },
    schema: [],
  },
  create(context) {
    function check(node, text) {
      if (!text) return;
      if (EMAIL.test(text)) context.report({ node, messageId: "email" });
      else if (PHONE.test(text)) context.report({ node, messageId: "phone" });
    }
    return {
      JSXText(node) {
        check(node, node.value);
      },
      JSXAttribute(node) {
        const name = node.name && node.name.name;
        if (!VISIBLE_ATTRS.has(name)) return;
        if (node.value && node.value.type === "Literal") check(node.value, stringValue(node.value));
      },
      "JSXExpressionContainer > Literal, JSXExpressionContainer > TemplateLiteral"(node) {
        // {"text"} as a child; attribute values like fallback={"..."} are handled above.
        if (node.parent.parent.type === "JSXAttribute") return;
        check(node, stringValue(node));
      },
    };
  },
};

const wlText = {
  meta: {
    type: "suggestion",
    docs: { description: "Headings and paragraphs with copy are WL text, so admins can edit them." },
    messages: {
      heading: "<{{tag}}> with hard-coded copy. Use WLHeaderV2 / WLLayoutHeader with a text id (AGENTS.md rule 3).",
      paragraph: "<p> with hard-coded copy. Use WLTextV2 / WLLayoutText with a text id (AGENTS.md rule 3).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXElement(node) {
        const tag = elementName(node);
        if (!TEXT_ELEMENTS.has(tag)) return;
        const hasCopy = node.children.some((child) => {
          const text = child.type === "JSXText" ? child.value : child.type === "JSXExpressionContainer" ? stringValue(child.expression) : null;
          return text && /[A-Za-z]{2,}/.test(text);
        });
        if (hasCopy) context.report({ node: node.openingElement, messageId: tag === "p" ? "paragraph" : "heading", data: { tag } });
      },
    };
  },
};

const wlImages = {
  meta: {
    type: "suggestion",
    docs: { description: "Photos are WLImageV2; <img> only for bundled assets (logos, icons)." },
    messages: {
      img: "<img> that isn't a bundled asset. Photos are WLImageV2 with an image id (AGENTS.md rule 3); <img> is only for imported logos and icons.",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    function resolve(identifier) {
      let scope = sourceCode.getScope(identifier);
      while (scope) {
        const variable = scope.set.get(identifier.name);
        if (variable) return variable;
        scope = scope.upper;
      }
      return null;
    }
    function isImported(identifier) {
      const variable = resolve(identifier);
      return Boolean(variable && variable.defs.some((def) => def.type === "ImportBinding"));
    }
    // const ICONS = { facebook, instagram } / [logoA, logoB]: a map of imported assets.
    function isAssetMap(identifier) {
      if (isImported(identifier)) return true;
      const variable = resolve(identifier);
      const def = variable && variable.defs[0];
      const init = def && def.type === "Variable" ? def.node.init : null;
      if (!init) return false;
      const values = init.type === "ObjectExpression" ? init.properties.map((p) => p.value) : init.type === "ArrayExpression" ? init.elements : null;
      return Boolean(values && values.length && values.every((v) => v && v.type === "Identifier" && isImported(v)));
    }
    return {
      JSXOpeningElement(node) {
        if (!node.name || node.name.name !== "img") return;
        const src = attribute(node, "src");
        if (!src) return;
        const expr = src.value && src.value.type === "JSXExpressionContainer" ? src.value.expression : src.value;
        if (expr && expr.type === "Identifier" && isImported(expr)) return;
        if (expr && expr.type === "MemberExpression" && expr.object.type === "Identifier" && isAssetMap(expr.object)) return;
        // CMS model images (testimonials, staff, ...) are already admin-managed.
        if (expr && expr.type === "CallExpression" && expr.callee.type === "Identifier" && expr.callee.name === "cmsAssetUrl") return;
        context.report({ node, messageId: "img" });
      },
    };
  },
};

const wlForms = {
  meta: {
    type: "problem",
    docs: { description: "Forms and site data go through wl-forms / wl-cms / site-mail." },
    messages: {
      import: "Don't import {{source}} in a site. {{hint}} (AGENTS.md rule 2)",
      action: "<form action> posts somewhere else. Handle onSubmit with FormResponse (wl-forms) plus a MailManager email (AGENTS.md rule 2).",
    },
    schema: [],
  },
  create(context) {
    function checkSource(node, source) {
      const hint = RESTRICTED_IMPORTS[source];
      if (hint) context.report({ node, messageId: "import", data: { source, hint } });
    }
    return {
      ImportDeclaration(node) {
        checkSource(node, node.source.value);
      },
      "CallExpression[callee.name='require']"(node) {
        const source = stringValue(node.arguments[0]);
        if (source) checkSource(node, source);
      },
      JSXOpeningElement(node) {
        if (node.name && node.name.name === "form" && attribute(node, "action")) context.report({ node, messageId: "action" });
      },
    };
  },
};

export default {
  meta: { name: "eslint-plugin-wl", version: "1.0.0" },
  rules: {
    "contact-links": contactLinks,
    "no-contact-text": noContactText,
    "wl-text": wlText,
    "wl-images": wlImages,
    "wl-forms": wlForms,
  },
};
