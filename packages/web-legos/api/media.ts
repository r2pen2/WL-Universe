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
