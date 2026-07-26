// Library Imports
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconInfoCircle, IconX } from "@tabler/icons-react";
// API Imports
import { notifStyle } from "../api/notifications.ts";

/**
 * Send a notification with a green check to the notif queue
 * @param {string} title - notification title
 * @param {string} message - notification message content
 */
export function notifSuccess(title, message) {
  notifications.show({
    withCloseButton: true,
    autoClose: 5000,
    title: title,
    message: message,
    color: "green",
    icon: <IconCheck />,
    style: notifStyle,
    withBorder: true,
  });
}

/**
 * Send a notification with a yellow warning to the notif queue
 * @param {string} title - notification title
 * @param {string} message - notification message content
 */
export function notifWarn(title, message) {
  notifications.show({
    withCloseButton: true,
    autoClose: 5000,
    title: title,
    message: message,
    color: "yellow",
    icon: <IconAlertCircle />,
    style: notifStyle,
    withBorder: true,
  });
}

/**
 * Send a notification with a red x to the notif queue
 * @param {string} title - notification title
 * @param {string} message - notification message content
 */
export function notifFail(title, message) {
  notifications.show({
    withCloseButton: true,
    autoClose: 5000,
    title: title,
    message: message,
    color: "red",
    icon: <IconX />,
    style: notifStyle,
    withBorder: true,
  });
}