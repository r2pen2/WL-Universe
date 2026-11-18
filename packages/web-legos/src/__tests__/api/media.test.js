import { parseTimecode, parseYoutubeLink } from "../../../api/media.ts";

describe("parseTimecode", () => {
  it.each([
    ["36", 36],
    ["0:36", 36],
    ["11:50", 710],
    ["1:02:03", 3723],
    ["36s", 36],
    ["1m30s", 90],
    ["1h2m3s", 3723],
    [" 11:50 ", 710],
    [42, 42],
  ])("reads %p as %p seconds", (input, seconds) => {
    expect(parseTimecode(input)).toBe(seconds);
  });

  it.each(["", "   ", "soon", "1:2:3:4", "-5"])("gives up on %p", (input) => {
    expect(parseTimecode(input)).toBeUndefined();
  });
});

describe("parseYoutubeLink", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", { id: "dQw4w9WgXcQ" }],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=Someone", { id: "dQw4w9WgXcQ" }],
    ["youtube.com/watch?v=dQw4w9WgXcQ", { id: "dQw4w9WgXcQ" }],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc123", { id: "dQw4w9WgXcQ" }],
    ["https://youtu.be/dQw4w9WgXcQ?t=36", { id: "dQw4w9WgXcQ", start: 36 }],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s", { id: "dQw4w9WgXcQ", start: 90 }],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ?start=12", { id: "dQw4w9WgXcQ", start: 12 }],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", { id: "dQw4w9WgXcQ" }],
    ["https://m.youtube.com/live/dQw4w9WgXcQ", { id: "dQw4w9WgXcQ" }],
    ["dQw4w9WgXcQ", { id: "dQw4w9WgXcQ" }],
  ])("reads %p", (link, expected) => {
    expect(parseYoutubeLink(link)).toEqual(expected);
  });

  it.each(["", "not a link", "https://vimeo.com/123456", "https://www.youtube.com/@somechannel"])("finds no video in %p", (link) => {
    expect(parseYoutubeLink(link).id).toBe("");
  });
});
