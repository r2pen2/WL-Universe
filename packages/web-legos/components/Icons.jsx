// Library Imports
import { Button } from "@nextui-org/react";

// Style Imports
import "../assets/style/icons.css";

/** MUI & Bootstrap class list for icons— for some reason they straight up don't display without these */
const iconClasses = "MuiSvgIcon-root MuiSvgIcon-fontSizeLarge css-tzssek-MuiSvgIcon-root web-legos-social-icon-hover-effect ";

/** Size for icons when not otherwise specified */
const defaultIconSize = "40px";

/**
 * @enum {string}
 * Brand hex colors for all supported icons
 */
export const iconColors = {
  calendar: "#000000",
  faceblock: "#1877F2",
  facebook: "#1877F2",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  location: "#FFFFFF",
  mail: "#FFFFFF",
  phone: "#FFFFFF",
  tiktok: "#15CBC5",
  youtube: "#FF0000",
}

/**
 * @enum {string}
 * Svg title strings for all supported icons
 */
const iconTitles = {
  calendar: "Calendar",
  faceblock: "Facebook",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  location: "Maps",
  mail: "Mail",
  phone: "Phone",
  tiktok: "TikTok",
  youtube: "Youtube",
}

/**
 * @enum {string}
 * Svg path strings for all supported icons
 */
const iconSvgPaths = {
  calendar: "M700-80v-120H580v-60h120v-120h60v120h120v60H760v120h-60Zm-520-80q-24 0-42-18t-18-42v-540q0-24 18-42t42-18h65v-60h65v60h260v-60h65v60h65q24 0 42 18t18 42v302q-15-2-30-2t-30 2v-112H180v350h320q0 15 3 30t8 30H180Zm0-470h520v-130H180v130Zm0 0v-130 130Z",
  faceblock: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
}

/**
 * @enum {string}
 * Strings for all supported platform keys
 */
export const platformKeys = {
  CALENDAR: "calendar",
  FACEBLOCK: "faceblock",
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  LINKEDIN: "linkedin",
  LOCATION: "location",
  MAIL: "mail",
  PHONE: "phone",
  TIKTOK: "tiktok",
  YOUTUBE: "youtube",
}

/**
 * Parent component for all social icons: {@link TikTokIcon}, {@link InstagramIcon}, etc.
 * @see {@link SocialButton} if you would like to redirect the user on click.
 * @param {string} platformKey - playform key for interfacing with {@link iconColors}, {@link iconTitles}, and {@link iconSvgPaths}
 * @param {number} size - icon size in pixels
 * @param {string} color - SVG fill color override
 * @default
 * const defaultIconSize = "40px";
 */
export function SocialIcon({platformKey, size, color}) {

  /** Title to be displayed on hover from {@link iconTitles} */
  const iconTitle = iconTitles[platformKey];
  /** SVG fill color from {@link iconColors} */
  const iconColor = iconColors[platformKey];
  /** SVG path for brand logo from {@link iconSvgPaths} */
  const svgPath = iconSvgPaths[platformKey];

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={iconClasses + `web-legos-${platformKey}`}
      style={{
        width: size ? size : defaultIconSize,
        height: "auto",
      }}
    >
      <title>{iconTitle}</title>
      <path fill={color ? color : iconColor} d={svgPath}/>
    </svg>
  );
}

/**
 * A Web-Legos custom calendar icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the calendar logo
 */
export function CalendarIcon({color, size}) {
  return <SocialIcon platformKey="calendar" size={size} color={color} />;
}


/**
 * A Web-Legos custom square Facebook icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the Faceblock logo
 */
export function FaceblockIcon({color, size}) {
  return <SocialIcon platformKey="faceblock" size={size} color={color} />;
}

/**
 * A Web-Legos custom Facebook icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the Facebook logo
 */
export function FacebookIcon({color, size}) {
  return <SocialIcon platformKey="facebook" size={size} color={color} />;
}

/**
 * A Web-Legos custom Instagram icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the Instagram logo
 */
export function InstagramIcon({color, size}) {
  return <SocialIcon platformKey="instagram" size={size} color={color} />;
}

/**
 * A Web-Legos custom Location icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the Location logo
 */
export function LocationIcon({color, size}) {
  return <SocialIcon platformKey="location" size={size} color={color} />;
}

/**
 * A Web-Legos custom Mail icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the Mail logo
 */
export function MailIcon({color, size}) {
  return <SocialIcon platformKey="mail" size={size} color={color} />;
}

/**
 * A Web-Legos custom Phone icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the Phone logo
 */
export function PhoneIcon({color, size}) {
  return <SocialIcon platformKey="phone" size={size} color={color} />;
}

/**
 * A Web-Legos custom TikTok icon
 * @param {string} color - icon fill color override
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the TikTok logo
 */
export function TikTokIcon({color, size}) {
  return <SocialIcon platformKey="tiktok" size={size} color={color} />;
}

/**
 * A Web-Legos custom YouTube icon
 * @param {number} size - icon size in pixels
 * @returns A {@link SocialIcon} with the YouTube logo
 */
export function YouTubeIcon({color, size}) {
  return <SocialIcon platformKey="youtube" size={size} color={color} />;
}

/**
 * Parent component for all social buttons: {@link TikTokButton}, {@link InstagramButton}, etc.
 * @see {@link SocialButton} if you would don't want to allow onClick events
 * @param {string} socialIcon - icon for the button ({@link TikTokIcon}, {@link InstagramIcon}, etc.)
 * @param {number} socialLink - redirect link for onClick event
 * @param {boolean} bordered - whether to include border around icon
 * @param {string} borderColor - color for border
 * @default
 * bordered = false
 */
export function SocialButton({socialIcon, socialLink, bordered, borderColor}) {
  return <Button bordered={bordered} css={{borderColor: borderColor, overflow: "visible"}} light auto icon={socialIcon} onClick={() => window.open(socialLink, "_blank")} />;
}

/**
 * A Web-Legos custom calendar button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} calendarLink - a link to some calendar related thing
 * @returns A {@link SocialButton} with the YouTube logo
 */
export function CalendarButton({color, iconSize, calendarLink}) {
  return <SocialButton socialIcon={<CalendarIcon size={iconSize} color={color} />} socialLink={calendarLink} />;
}

/**
 * A Web-Legos custom Faceblock button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} faceblockLink - a link to somewhere on Faceblock
 * @returns A {@link SocialButton} with the Faceblock logo
 */
export function FaceblockButton({color, iconSize, faceblockLink}) {
  return <SocialButton socialIcon={<FaceblockIcon size={iconSize} color={color} />} socialLink={faceblockLink} />;
}

/**
 * A Web-Legos custom Facebook button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} facebookLink - a link to somewhere on Facebook
 * @returns A {@link SocialButton} with the Facebook logo
 */
export function FacebookButton({color, iconSize, facebookLink}) {
  return <SocialButton socialIcon={<FacebookIcon size={iconSize} color={color} />} socialLink={facebookLink} />;
}

/**
 * A Web-Legos custom TikTok button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} tikTokLink - a link to somewhere on TikTok
 * @returns A {@link SocialButton} with the TikTok logo
 */
export function TikTokButton({color, iconSize, tiktokLink}) {
  return <SocialButton socialIcon={<TikTokIcon size={iconSize} color={color} />} socialLink={tiktokLink} />;
}

/**
 * A Web-Legos custom Instagram button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} instagramLink - a link to somewhere on Instagram
 * @returns A {@link SocialButton} with the Instagram logo
 */
export function InstagramButton({color, iconSize, instagramLink}) {
  return <SocialButton socialIcon={<InstagramIcon size={iconSize} color={color} />} socialLink={instagramLink} />;
}

/**
 * A Web-Legos custom Location button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} locationLink - a link to somewhere on Location
 * @returns A {@link SocialButton} with the Location logo
 */
export function LocationButton({color, iconSize, locationLink}) {
  return <SocialButton socialIcon={<LocationIcon size={iconSize} color={color} />} socialLink={locationLink} />;
}

/**
 * A Web-Legos custom Mail button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} mailLink - a link to somewhere on Mail
 * @returns A {@link SocialButton} with the Mail logo
 */
export function MailButton({color, iconSize, mailLink}) {
  return <SocialButton socialIcon={<MailIcon size={iconSize} color={color} />} socialLink={mailLink} />;
}

/**
 * A Web-Legos custom Phone button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} phoneLink - a link to somewhere on Phone
 * @returns A {@link SocialButton} with the Phone logo
 */
export function PhoneButton({color, iconSize, phoneLink}) {
  return <SocialButton socialIcon={<PhoneIcon size={iconSize} color={color} />} socialLink={phoneLink} />;
}

/**
 * A Web-Legos custom YouTube button
 * @param {string} color - icon fill color override
 * @param {number} iconSize - icon size in pixels
 * @param {string} youtubeLink - a link to somewhere on YouTube
 * @returns A {@link SocialButton} with the YouTube logo
 */
export function YouTubeButton({color, iconSize, youtubeLink}) {
  return <SocialButton socialIcon={<YouTubeIcon size={iconSize} color={color} />} socialLink={youtubeLink} />;
}
