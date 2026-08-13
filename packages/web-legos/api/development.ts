const isDevServer = window.location.hostname === "localhost";

/**
 * Store a local API hostname for legacy same-origin helpers.
 * Accepts host ("example.com"), host:port, or full URL ("http://localhost:3021").
 */
export function setHostname(hostname: string) {
  if (!isDevServer) return;
  const trimmed = (hostname || "").trim();
  if (!trimmed) {
    localStorage.removeItem("wl-dev-hostname");
    return;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    localStorage.setItem("wl-dev-hostname", trimmed.replace(/\/$/, ""));
    return;
  }
  localStorage.setItem("wl-dev-hostname", `https://${trimmed}`);
}

export function getHostname() {
  const storage = localStorage.getItem("wl-dev-hostname");
  return storage && isDevServer ? storage : "";
}
