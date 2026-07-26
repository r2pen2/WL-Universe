import { navigationItems } from "../components/Navigation"

export function getTab() {
  
  if (window.location.hash.includes("drive-admin")) return navigationItems.ADMINDRIVE
  if (window.location.hash.includes("users-admin")) return navigationItems.ADMINUSERS
  if (window.location.hash.includes("tools-admin")) return navigationItems.ADMINTOOLS
  if (window.location.hash.includes("forms-admin")) return navigationItems.ADMINFORMS
  if (window.location.hash.includes("invoices-admin")) return navigationItems.ADMININVOICES
  if (window.location.hash.includes("dashboard")) return navigationItems.DASHBOARD
  if (window.location.hash.includes("invoices")) return navigationItems.INVOICES
  if (window.location.hash.includes("settings")) return navigationItems.SETTINGS
  if (window.location.hash.includes("forms")) return navigationItems.FORMS
  if (window.location.hash.includes("schedule")) return navigationItems.SCHEDULE

  return "dashboard"
}