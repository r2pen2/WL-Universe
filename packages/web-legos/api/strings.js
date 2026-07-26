/**
 *
      resultHtml += (workingString.substring(0, closer + 1) + "/");
      workingString = workingString.substring(closer + 1);
 */

function addClosingTags(htmlString) {

  let workingString = htmlString;
  let resultHtml = "";

  /**
   * Holy shit I cannot believe this works
   */
  function getValidOpener() {
    let lastFound = 0;
    while (true) {
      const newOpener = workingString.indexOf("<", lastFound);
      if (newOpener === -1) { break ; }
      const nextLineBreak = workingString.indexOf("<br/>", lastFound);
      if (newOpener !== nextLineBreak) {
        return newOpener;
      } else {
        lastFound = nextLineBreak + "<br/>".length;
      }
    }
    return -1;
  }

  while (workingString.indexOf("<") !== -1) {
    const opener = getValidOpener();
    if (opener === -1) { break; }
    const closer = workingString.indexOf("<", opener + 1);
    resultHtml += (workingString.substring(0, closer + 1) + "/");
    workingString = workingString.substring(closer + 1);
  }
  resultHtml += workingString;

  // Replace line breaks that may have been changed by accident
  resultHtml = resultHtml.replaceAll("</br/>", "<br/>");
  return resultHtml;
}

export function HTMLToMarkdown(string) {
  let newString = string;
  // Repalce line breaks
  newString = newString.replaceAll("<br/>", "\n\n" )
  // Replace bolds
  newString = newString.replaceAll("<strong>", "**");
  newString = newString.replaceAll("</strong>", "**");
  // Replace italics
  newString = newString.replaceAll("<em>", "*");
  newString = newString.replaceAll("</em>", "*");

  // Handle links
  while (newString.includes("<a") && newString.includes("</a")) {

    const linkStart = newString.indexOf("<a");
    const linkEnd = newString.indexOf("</a>");

    const nameStart = newString.indexOf(">", linkStart);
    const nameEnd = newString.indexOf("<", nameStart);
    const nameText = newString.substring(nameStart + 1, nameEnd);

    const hrefStart = newString.indexOf(`href="`, linkStart);
    const hrefEnd = newString.indexOf(`"`, hrefStart + `href="`.length);
    const href = newString.substring(hrefStart + `href="`.length, hrefEnd);

    const markdownString = `[${nameText}](${href})`;

    newString = newString.substring(0, linkStart) + markdownString + newString.substring(linkEnd + "</a>".length);
  }

  return newString;
}

/**
 * Turn any markdown string into HTML for injection
 * @param {string} markdownString - markdown formatted string
 * @returns
 */
export function markdownToHTML(markdownString) {
  let newString = markdownString;
  // Repalce line breaks
  newString = newString.replace(/\n+/g, "<br/>");
  // Replace bolds
  newString = newString.replaceAll("**", "<strong>");
  newString = newString.replaceAll("*", "<em>");
  newString = addClosingTags(newString);

  // Handle links
  while (newString.includes("[") && newString.includes("]") && newString.includes("(") && newString.includes(")")) {
    const nameStart = newString.indexOf("[");
    const nameEnd = newString.indexOf("]", nameStart);
    const nameText = newString.substring(nameStart + 1, nameEnd);
    const hrefStart = newString.indexOf("(");
    const hrefEnd = newString.indexOf(")", hrefStart);
    const href = newString.substring(hrefStart + 1, hrefEnd);

    const linkElementString = `<a href="${href}" target="blank">${nameText}</a>`;

    newString = newString.substring(0, nameStart) + linkElementString + newString.substring(hrefEnd + 1);
  }

  return newString;
}

/**
 * Formats a UTC date string so that it's easier to read
 * @param {Date} date string representing a UTC date
 * @returns {String} date formatted as a string in the format "month/day/year"
 */
export function getSlashDateString(date) {
  // Make sure we have a valid date object
  const d = new Date(date);

  // Break it down into its' parts
  const day = d.getUTCDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  // Format and return string
  return `${month + 1}/${day}/${year}`
}

/**
* Remove all non-numeric characters from a string via regex
* @param {string} string string to remove all non-numeric chars
* @returns string w/ only numbers
*/
export function makeNumeric(string) {
  return string.replace(/\D+/g, '');
}

/**
* Capitalize the first letter of a string
* @param {string} string string to capitalize
* @returns string with first letter capitalized
*/
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Formats a UTC date's time of day so that it's easier to read
 * @param {Date} date string representing a UTC date
 * @returns {String} time of day formatted as a string in the format "hh:mm"
 */
export function getTimeOfDay(date) {
  // Make sure we have a valid date object
  const d = new Date(date);

  function addZero(i) {
    if (i < 10) {i = "0" + i}
    return i;
  }

  // Break it down into its' parts
  const hoursRaw = d.getHours();
  const hours = addZero(hoursRaw % 13);
  const minutes = addZero(d.getMinutes());

  // Format and return string
  return `${hours}:${minutes} ${hoursRaw >= 12 ? "PM" : "AM"}`
}

export class WLDateTime extends Date {

  /** Create a Date with time 0 */
  constructor() {
    super(0)
  }

  /** Load in target time */
  loadTime(seconds) {
    this.setSeconds(seconds + this.getTimezoneOffset() * 60)
  }

  /**
   * @override
   * Get WLDateTime as a string representing time as dd/mm/yy hh:mm AM/PM
   * @returns time string
   */
  toString() {
    return `${getSlashDateString(this)} ${getTimeOfDay(this)}`;
  }
}

export function enforcePx(string) {
  return (string+"px").replace("pxpx", "px");
}
