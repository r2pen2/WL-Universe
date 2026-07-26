const isDevServer = window.location.hostname === "localhost";

export function setHostname(hostname: string) {
  if (isDevServer) { localStorage.setItem("wl-dev-hostname", "https://" + hostname); }
}

export function getHostname() {
  const storage = localStorage.getItem("wl-dev-hostname");
  return (storage && isDevServer) ? storage : "";
}
