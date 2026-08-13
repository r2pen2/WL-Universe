/**
 * Canonical local-dev client catalog for `npm run client -- <slug>`.
 */
export const CLIENTS = {
  "nicole-levin": {
    workspace: "@wl-universe/nicole-levin-client",
    port: 3105,
    site: "nicole-levin",
  },
  "beyond-the-bell": {
    workspace: "@wl-universe/beyond-the-bell-client",
    port: 3100,
    site: "beyond-the-bell",
  },
  "joe-dobbelaar": {
    workspace: "@wl-universe/joe-dobbelaar-client",
    port: 3102,
    site: "joe-dobbelaar",
  },
  "you-can-do-it-gardening": {
    workspace: "@wl-universe/you-can-do-it-gardening-client",
    port: 3103,
    site: "you-can-do-it-gardening",
  },
  "talk-about-dreams": {
    workspace: "@wl-universe/talk-about-dreams-client",
    port: 3104,
    site: "talk-about-dreams",
  },
  "a-new-day-coaching": {
    workspace: "@wl-universe/a-new-day-coaching-client",
    port: 3107,
    site: "a-new-day-coaching",
  },
  "boston-mixtape": {
    workspace: "@wl-universe/boston-mixtape-client",
    port: 3110,
    site: "boston-mixtape",
  },
  "wl-admin-portal": {
    workspace: "@wl-universe/wl-admin-portal-client",
    port: 3111,
    site: "wl-admin-portal",
  },
  "a-new-day-coaching-crm": {
    workspace: "@wl-universe/a-new-day-coaching-crm-client",
    port: 3108,
    site: "a-new-day-coaching-crm",
  },
};

export const STACK_SERVICES = [
  {
    name: "wl-cms",
    workspace: "@wl-universe/wl-cms",
    port: 3021,
    envKey: "WL_CMS_API_KEY",
  },
  {
    name: "wl-auth",
    workspace: "@wl-universe/wl-auth",
    port: 3022,
    envKey: "WL_AUTH_API_KEY",
  },
  {
    name: "wl-forms",
    workspace: "@wl-universe/wl-forms",
    port: 3023,
    envKey: "WL_FORMS_API_KEY",
    optional: true,
  },
  {
    name: "site-mail",
    workspace: "@wl-universe/site-mail",
    port: 3020,
    envKey: "SITE_MAIL_API_KEY",
    optional: true,
  },
];
