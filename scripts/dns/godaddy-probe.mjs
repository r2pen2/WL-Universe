/**
 * One-shot GoDaddy probe for anewdaycoaching.com email posture.
 * Auth: Authorization: Bearer $GODADDY_PAT
 */
const PAT = process.env.GODADDY_PAT;
const DOMAIN = process.env.GODADDY_DOMAIN || "anewdaycoaching.com";
const API = "https://api.godaddy.com";

if (!PAT) {
  console.error("GODADDY_PAT required");
  process.exit(1);
}

async function gd(method, path) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function summarize(label, result) {
  console.log(`\n=== ${label} (${result.status}) ===`);
  const b = result.body;
  if (typeof b === "string") {
    console.log(b.slice(0, 2000));
    return;
  }
  console.log(JSON.stringify(b, null, 2).slice(0, 4000));
}

const paths = [
  ["/v1/domains", "list domains (filter later)"],
  [`/v1/domains/${DOMAIN}`, "domain detail"],
  [`/v1/domains/${DOMAIN}/records`, "DNS at GoDaddy (may be empty if CF NS)"],
  [`/v1/domains/${DOMAIN}/records/MX`, "MX at GoDaddy"],
];

for (const [path, label] of paths) {
  summarize(label, await gd("GET", path));
}

// subscriptions / products probes
const extra = [
  "/v1/subscriptions",
  "/v1/shoppers/~",
  "/v1/cloud/providers",
];
for (const path of extra) {
  summarize(path, await gd("GET", path));
}

// After shopper id, try v2 forwards (domain HTTP forwards, not email)
const shopper = await gd("GET", "/v1/shoppers/~");
const customerId =
  shopper.body?.customerId ||
  shopper.body?.shopperId ||
  shopper.body?.shopperID;
console.log("\ncustomerId candidate:", customerId);
if (customerId) {
  summarize(
    "domain HTTP forwards",
    await gd("GET", `/v2/customers/${customerId}/domains/forwards/${DOMAIN}`),
  );
  summarize(
    "customer domains",
    await gd("GET", `/v2/customers/${customerId}/domains`),
  );
}

// Filter domain list for coaching / gardening
if (Array.isArray((await gd("GET", "/v1/domains")).body)) {
  // already printed
}
const listed = await gd("GET", "/v1/domains?statuses=ACTIVE&limit=100");
if (Array.isArray(listed.body)) {
  console.log("\n=== active domains (names) ===");
  for (const d of listed.body) {
    const name = d.domain || d;
    if (/coaching|garden|mixtape|dream|levin|bera|joe/i.test(String(name))) {
      console.log(JSON.stringify(d, null, 2).slice(0, 800));
    }
  }
}
