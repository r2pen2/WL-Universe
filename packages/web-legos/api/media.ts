export function getYoutubeEmbedCode(link: string) {
  if (link.includes("youtube.com")) {
    // This is a long link. We need to pull out the query
    const queryHeader = "watch?v=";
    const codeStart = link.indexOf(queryHeader) + queryHeader.length;
    return link.substring(codeStart, link.indexOf("&", codeStart));
  } if (link.includes("youtu.be")) {
    // This is a short link. We need to get what's after the slash
    const queryHeader = "https://youtu.be/";
    const codeStart = link.indexOf(queryHeader) + queryHeader.length;
    return link.substring(codeStart);
  }
  return link;
}

/**
 * Pull the video id and any start time out of a YouTube link. Takes watch, youtu.be, embed, shorts
 * and live links (with or without extra query params) or a bare 11-character id.
 * @returns `{ id, start }`, start in seconds when the link has `t=` / `start=`; id is "" if none found
 */
export function parseYoutubeLink(link: string): { id: string, start?: number } {
  const text = (link || "").trim();
  if (/^[\w-]{11}$/.test(text)) { return { id: text }; }
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { id: "" };
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id = "";
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] || "";
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, kind, rest] = url.pathname.split("/");
    id = kind === "watch" ? url.searchParams.get("v") || "" : ["embed", "shorts", "live", "v"].includes(kind) ? rest || "" : "";
  }
  if (!/^[\w-]{11}$/.test(id)) { return { id: "" }; }
  const start = parseTimecode(url.searchParams.get("t") || url.searchParams.get("start") || "");
  return start === undefined ? { id } : { id, start };
}

/**
 * Seconds from a timecode as people write them: "36", "0:36", "11:50", "1:02:03", "36s", "1m30s",
 * "1h2m3s". Returns undefined for blank or unreadable input.
 */
export function parseTimecode(value: string | number): number | undefined {
  if (typeof value === "number") { return Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined; }
  const text = (value || "").trim().toLowerCase();
  if (!text) { return undefined; }
  if (/^\d+(:\d{1,2}){0,2}$/.test(text)) {
    return text.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  }
  const units = text.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (units && (units[1] || units[2] || units[3])) {
    return Number(units[1] || 0) * 3600 + Number(units[2] || 0) * 60 + Number(units[3] || 0);
  }
  return undefined;
}
