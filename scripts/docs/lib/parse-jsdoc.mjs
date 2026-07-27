/**
 * Dumb JSDoc block parser — copies tags from source only; never invents prose.
 */

/**
 * @param {string} raw comment body without enclosing /** *\/
 */
export function parseJsdocBlock(raw) {
  if (!raw || typeof raw !== "string") {
    return emptyDoc();
  }

  const lines = raw
    .replace(/^\s*\/\*\*?/, "")
    .replace(/\*\/\s*$/, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""));

  const descriptionLines = [];
  const params = [];
  const links = [];
  let deprecated = null;
  let defaults = null;
  let see = null;
  let returns = null;
  let currentTag = null;

  function flushTag() {
    currentTag = null;
  }

  for (const line of lines) {
    const tagMatch = line.match(/^@(\w+)\s*(.*)$/);
    if (tagMatch) {
      flushTag();
      const [, tag, rest] = tagMatch;
      if (tag === "param") {
        const parsed = parseParam(rest);
        params.push(parsed);
        currentTag = { type: "param", ref: parsed };
      } else if (tag === "deprecated") {
        deprecated = rest.trim();
        currentTag = { type: "deprecated" };
      } else if (tag === "default") {
        defaults = rest.trim();
        currentTag = { type: "default" };
      } else if (tag === "link" || tag === "see") {
        const linkText = rest.trim();
        if (tag === "see") see = linkText;
        links.push(linkText);
        currentTag = null;
      } else if (tag === "returns" || tag === "return") {
        returns = rest.trim();
        currentTag = { type: "returns" };
      } else if (tag === "enum" || tag === "typedef" || tag === "type") {
        // Keep type tags out of description; they are structural, not prose we invent.
        currentTag = null;
      } else {
        // Unknown tags: preserve on description only if we already started? Skip inventing.
        currentTag = null;
      }
      continue;
    }

    if (currentTag?.type === "param" && currentTag.ref) {
      if (line.trim()) {
        currentTag.ref.description = [currentTag.ref.description, line.trim()]
          .filter(Boolean)
          .join(" ");
      }
      continue;
    }
    if (currentTag?.type === "deprecated") {
      if (line.trim()) {
        deprecated = [deprecated, line.trim()].filter(Boolean).join(" ");
      }
      continue;
    }
    if (currentTag?.type === "default") {
      if (line.trim()) {
        defaults = [defaults, line.trim()].filter(Boolean).join("\n");
      }
      continue;
    }
    if (currentTag?.type === "returns") {
      if (line.trim()) {
        returns = [returns, line.trim()].filter(Boolean).join(" ");
      }
      continue;
    }

    descriptionLines.push(line);
  }

  const description = descriptionLines.join("\n").trim();

  return {
    description: description || null,
    params,
    deprecated,
    defaults,
    links,
    see,
    returns,
  };
}

function parseParam(rest) {
  // @param {type} name - desc  OR  @param {type} name.desc  OR @param name - desc
  let type = null;
  let name = null;
  let description = "";
  let working = rest.trim();

  const typeMatch = working.match(/^\{([^}]*)\}\s*(.*)$/);
  if (typeMatch) {
    type = typeMatch[1].trim();
    working = typeMatch[2].trim();
  }

  const nameMatch = working.match(/^([^\s-]+)\s*(?:-\s*)?(.*)$/);
  if (nameMatch) {
    name = nameMatch[1].replace(/^\[|\]$/g, "");
    description = nameMatch[2].trim();
  } else {
    description = working;
  }

  return { name, type, description };
}

function emptyDoc() {
  return {
    description: null,
    params: [],
    deprecated: null,
    defaults: null,
    links: [],
    see: null,
    returns: null,
  };
}

/**
 * Find the JSDoc comment immediately preceding `index` in `source`.
 * Returns { doc, start, end } or null.
 */
export function findPrecedingJsdoc(source, index) {
  const before = source.slice(0, index);
  const re = /\/\*\*([\s\S]*?)\*\//g;
  let match;
  let last = null;
  while ((match = re.exec(before)) !== null) {
    last = match;
  }
  if (!last) return null;
  // Only whitespace may sit between the comment and the export.
  const afterComment = before.slice(last.index + last[0].length);
  if (afterComment.trim() !== "") return null;
  return {
    raw: last[1],
    start: last.index,
    end: index,
    doc: parseJsdocBlock(last[1]),
  };
}

export function hasDocContent(doc) {
  if (!doc) return false;
  return Boolean(
    doc.description ||
      doc.deprecated ||
      doc.defaults ||
      (doc.params && doc.params.length) ||
      (doc.links && doc.links.length) ||
      doc.see ||
      doc.returns
  );
}
