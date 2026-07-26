import { HomeworkPriority } from "./db/dbHomework.ts";
import { LinkMaster } from "./links.ts";

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

/** Get the time HH:MM of a date */
export function getTimeString(date) {
  date = new Date(date)
  const mins = date.getMinutes()
  return `${date.getHours() % 12}:${mins < 10 ? "0" : ""}${mins}${date.getHours() >= 13 ? "PM" : "AM"}`
}

export function getGnattDayString(date) {
  // Make sure we have a valid date object
  const d = new Date(date);
  
  // Break it down into its' parts
  const day = d.getUTCDate();
  const month = d.getMonth();
  // const year = d.getFullYear();

  // Format and return string
  return `${month + 1}/${day}`
}

/**
 * Formats a UTC date string so that it's easier to read
 * @param {Date} date string representing a UTC date
 * @returns {String} date formatted as a string in the format "Month Day, Year"
 */
export function getVerboseDateString(date) {
  // Make sure we have a valid date object
  const d = new Date(date);
  
  // Break it down into its' parts
  const day = d.getUTCDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  // Format and return string
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[month]} ${day}, ${year}`;
}


/**
 * Formats a UTC date string's time
 * @param {Date} date string representing a UTC date
 * @returns {String} date's time as a string in the format "hh:mm AM/PM"
 */
export function getEventTime(date) {
  
  // Make sure we have a valid date object
  const d = new Date(date);

  // Get the hours and minutes
  const hours = d.getHours();
  const minutes = d.getMinutes();

  // Determine if it's AM or PM
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours to 12-hour format
  const formattedHours = hours % 12 || 12;

  // Format and return string
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}


// Regular expressions to match patterns
export const priorityPattern = /!low|!med(ium)?|!high/i;
export const datePattern = /\b(s|start|d|due):(\d{1,2}\/\d{1,2}(\/(\d{4}|\d{2}))?|tod(ay)?|tom(orrow)?|yes(terday)?|((next )?|(last )?)mon(day)?|((next )?|(last )?)tue(sday)?|((next )?|(last )?)wed(nesday)?|((next )?|(last )?)thu(rsday)?|((next )?|(last )?)fri(day)?|((next )?|(last )?)sat(urday)?|((next )?|(last )?)sun(day)?)/gi;
export const subjectPattern = /#(\w+)/;
export const linkPattern = /(?:link:|>)(\S+)/;

export function parseQuickEntry(string) {
  let priority = null;
  let startDate = null;
  let dueDate = null;
  let description = string.trim();
  let subject = null;
  let href = null;

  // Extract and set priority
  const priorityMatch = description.match(priorityPattern);
  if (priorityMatch) {
    const priorityKey = priorityMatch[0].toLowerCase();
    if (priorityKey.includes("low")) {
      priority = HomeworkPriority.LOW;
    } else if (priorityKey.includes("med")) {
      priority = HomeworkPriority.MEDIUM;
    } else if (priorityKey.includes("high")) {
      priority = HomeworkPriority.HIGH;
    }
    // Remove the priority from the description
    description = description.replace(priorityPattern, '').trim();
  }

  // Function to handle date parsing and adjustment
  function parseAndAdjustDate(dateStr) {
    if (!dateStr) { return; }
    
    const keywords = ["today", "tod", "tomorrow", "tom", "yesterday", "yes", "monday", "mon", "tuesday", "tue", "wednesday", "wed", "thursday", "thu", "friday", "fri", "saturday", "sat", "sunday", "sun"];
    const hasNext = dateStr.indexOf("next") !== -1;
    const hasLast = dateStr.indexOf("last") !== -1;
    if (hasNext && hasLast) { return; }  // Can't have both next and last
    dateStr = dateStr.replace("next ", "").replace("last ", "");

    const str = dateStr.toLowerCase();
    if (keywords.includes(str)) {

      function getWeekdayByOffset(n) {      
        const d = new Date();
        d.setDate(d.getDate() + (n + 7 - d.getDay()) % 7);
        if (d.getDate() === new Date().getDate()) { d.setDate(d.getDate() + 7); }
        if (hasNext) { d.setDate(d.getDate() + 7); }
        if (hasLast) { d.setDate(d.getDate() - 7); }
        return d;
      }

      // This is a special case
      let today = new Date();
      switch(str) {
        case "today":
        case "tod":
          return new Date();;
        case "tomorrow":
        case "tom":
          today.setDate(today.getDate() + 1);
          return today;
        case "yesterday":
        case "yes":
          today.setDate(today.getDate() - 1);
          return today;
        case "monday":
        case "mon":
          return getWeekdayByOffset(1)
        case "tuesday":
        case "tue":
          return getWeekdayByOffset(2)
        case "wednesday":
        case "wed":
          return getWeekdayByOffset(3)
        case "thursday":
        case "thu":        
          return getWeekdayByOffset(4)
        case "friday":
        case "fri":
          return getWeekdayByOffset(5)
        case "saturday":
        case "sat":
          return getWeekdayByOffset(6)
        case "sunday":
        case "sun":
          return getWeekdayByOffset(7)
        default:
          return;
      }
    }


    let [month, day, year] = dateStr.split('/');
    if (month > 12) { return; }
    let yearUndefined = false;
    if (year === undefined) { year = new Date().getFullYear(); yearUndefined = true; }
    if (year.length === 2) { year = `20${year}`; }
    year = parseInt(year);
    // year += (year < 50) ? 2000 : 1900;  // Adjust year based on the value
    let date = new Date(year, month - 1, day);

    const today = new Date();
    if (date < today && yearUndefined) {  // Check if the parsed date is in the past
      date.setFullYear(date.getFullYear() + 1);  // Set to the next occurrence
    }
    return date;
  }

  // Extract and set dates for start and due
  let dateMatch;
  while ((dateMatch = datePattern.exec(description)) !== null) {
    const [fullMatch, key, dateStr] = dateMatch;
    const dateObj = parseAndAdjustDate(dateStr);
    if (key.toLowerCase() === 'start' || key.toLowerCase() === "s") {
      startDate = dateObj;
    } else if (key.toLowerCase() === 'due' || key.toLowerCase() === "d") {
      dueDate = dateObj;
    }
    // Remove the date from the description
    description = description.replace(fullMatch, '').trim();
    datePattern.lastIndex = 0;
  }

  // Extract and set subject
  const subjectMatch = description.match(subjectPattern);
  if (subjectMatch) {
    subject = subjectMatch[1];
    // Remove the subject from the description
    description = description.replace(subjectPattern, '').trim();
  }

  // Extract and set href
  const hrefMatch = description.match(linkPattern);
  if (hrefMatch) {
    href = hrefMatch[1];
    // Remove the href from the description
    description = description.replace(linkPattern, '').trim();
  }

  return {
    priority: priority,
    startDate: startDate,
    dueDate: dueDate,
    subject: subject,
    description: description,
    href: href ? LinkMaster.ensureAbsoluteUrl(href) : null
  };
}