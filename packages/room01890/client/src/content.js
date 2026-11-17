/**
 * Site copy and CMS image ids for room01890, taken verbatim from room01890.com.
 *
 * TEXT: firestoreId -> text. The page passes it as each WL text's fallback, and
 * scripts/seed-cms.mjs writes it to wl-cms (siteText-R01) so the CMS starts out identical.
 * Stored text is the CMS's HTML form: "<br/>" separates paragraphs.
 *
 * IMAGES: the WLImageV2 ids. scripts/fetch-source-assets.mjs downloads each from Wix into
 * source-assets/images/<fileName>; scripts/seed-cms.mjs uploads them to wl-cms (siteImages-R01).
 *
 * Plain ESM with no JSX so the Node scripts can import it too.
 */

export const TEXT = {
  // Hero
  "hero-eyebrow": "Gatherings & Events",
  "hero-header": "Meet and Mingle",
  "hero-text": "Connect with new people, share great conversations and create memorable moments together.",

  // Meeting Space
  "meeting-space-header": "Meeting Space",

  // Events & Games
  "events-header": "Events & Games",
  "event-meeting-header": "Meeting Space",
  "event-meeting-subheader": "Weekly Gathering",
  "event-meeting-text": "Hold your discussions in our exclusive lounge space. A perfect blend of business and leisure.",
  "event-board-games-header": "Board Games",
  "event-board-games-subheader": "Monthly Event",
  "event-board-games-text":
    "Explore the world of tabletop gaming. From classic classics to modern innovations, we host curated sessions for every level of player.",
  "event-networking-header": "Networking Mixer",
  "event-networking-subheader": "Community Gathering",
  "event-networking-text":
    "Connect with a consultant to help plan an event or colaboration. A relaxed environment designed to foster meaningful professional relationships.",

  // Our Space
  "our-space-header": "Our Space",
  "our-space-text": "Our space blends professional consulting with a refined atmosphere for meetings and socializing",
  "gallery-3-title": "Women Playing Cards",

  // Contact
  "contact-header": "Get in Touch",
  "contact-text":
    "Whether you're looking for a private space for strategic meetings or a venue for high-stakes card games, our consulting team is ready to assist. Reach out to discuss your specific needs.",
  "contact-location-header": "Location",
  "contact-email-header": "Email",
  "contact-phone-header": "Phone",

  // Footer
  "footer-contact-header": "Contact",
  "footer-mission-header": "Our Mission",
  "footer-mission-text":
    "We provide strategic business advice and a curated space for card games and private meetings. Our goal is to empower your growth through professional consulting and a sophisticated social environment.",
  "footer-connect-header": "Connect",
  "footer-copyright": "© 2026 Consulting Space. All rights reserved.",

  // Book Online
  "services-header": "Our Services",
  "service-consultation-header": "Consultation",
  "service-consultation-duration": "1 hr",
  "service-consultation-price": "$75",
};

/** WLImageV2 ids, in page order. `media` is the Wix media id the photo was taken from. */
export const IMAGES = [
  { id: "hero-image", media: "8a9814_1755756e48ff412da7bf01373479424e~mv2.jpg", fileName: "hero-image.jpg", alt: "" },
  { id: "meeting-space-background", media: "8a9814_4e067f0c672d4ebfad1260e5ec18843a~mv2.jpg", fileName: "meeting-space-background.jpg", alt: "" },
  {
    id: "meeting-space-image-1",
    media: "8a9814_d326d708e1a1476caef3418c1e5ab23f~mv2.webp",
    fileName: "meeting-space-image-1.jpg",
    alt: "Studio photography of an empty meeting room featuring rows of gray office chairs facing a whiteboard and a desk. Bright, warm sunlight streams in from large side windows creating a professional and quiet atmosphere.",
  },
  {
    id: "meeting-space-image-2",
    media: "8a9814_9bae24227dcb4a279698e21a8d375c87~mv2.webp",
    fileName: "meeting-space-image-2.jpg",
    alt: "Interior photography of a mahjong table set up in a cozy, well-lit modern home. The scene conveys a warm, inviting atmosphere for social leisure.",
  },
  { id: "event-meeting-image", media: "8a9814_3740cb91fb88405f84a4f094795bb3da~mv2.jpg", fileName: "event-meeting-image.jpg", alt: "" },
  { id: "event-board-games-image", media: "8a9814_23514be3ae574d7c9a73ad46767c0dc1~mv2.jpg", fileName: "event-board-games-image.jpg", alt: "" },
  { id: "event-networking-image", media: "8a9814_3890eb6cfcd3493f9b73eb9e4360e827~mv2.jpg", fileName: "event-networking-image.jpg", alt: "" },
  { id: "gallery-1", media: "8a9814_63c6d6a0402c49a48e9d70ca3f864ca5~mv2.jpg", fileName: "gallery-1.jpg", alt: "" },
  { id: "gallery-2", media: "8a9814_d7cd97c5aec7478785fc38e3801b6913~mv2.jpg", fileName: "gallery-2.jpg", alt: "" },
  { id: "gallery-3", media: "11062b_62ab1b737b494e8c973199fcd9a6d58a~mv2.jpg", fileName: "gallery-3.jpg", alt: "Women Playing Cards" },
  { id: "gallery-4", media: "8a9814_31f10ae2a3f848eabf41c5bed63b2497~mv2.jpg", fileName: "gallery-4.jpg", alt: "" },
  { id: "gallery-5", media: "8a9814_2b2d97fbac974dca9d494c25c0de4ea7~mv2.jpg", fileName: "gallery-5.jpg", alt: "" },
  { id: "service-consultation-image", media: "nsplsh_f3af97add28145769389b85281455487~mv2.jpg", fileName: "service-consultation-image.jpg", alt: "Consultation" },
];

export const IMAGE_BY_ID = Object.fromEntries(IMAGES.map((img) => [img.id, img]));

/** Footer / header logo (bundled, not CMS). */
export const LOGO_MEDIA = "8a9814_7074dda80f774830a6dc480fb040f55f~mv2.png";

/** Footer social links, as the source has them. */
export const SOCIALS = [
  { key: "facebook", label: "Facebook", href: "http://www.facebook.com" },
  { key: "instagram", label: "Instagram", href: "http://www.instagram.com" },
  { key: "youtube", label: "YouTube", href: "http://www.youtube.com" },
  { key: "x", label: "X", href: "http://www.x.com" },
  { key: "linkedin", label: "LinkedIn", href: "http://www.linkedin.com" },
  { key: "tiktok", label: "TikTok", href: "http://www.tiktok.com" },
];

export const SERVICE_TYPES = ["Consulting", "Card Games", "Space Rental"];

/**
 * Contact info (WLEmailAddress / WLPhoneNumber / WLStreetAddress). The values live in the CMS
 * (Site settings → Contact info); these are shown until it has them.
 */
export const CONTACTS = {
  email: "info@room01890.com",
  phone: "781-910-4756",
  address: "38 Church St, 2nd Floor\nWinchester, MA 01890",
};
