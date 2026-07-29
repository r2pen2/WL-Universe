const PAT = process.env.GODADDY_PAT;
const DOMAIN = process.env.GODADDY_DOMAIN || "beyondthebelleducation.com";
const API = "https://api.godaddy.com";
if (!PAT) { console.error("GODADDY_PAT required"); process.exit(1); }

async function gd(method, path) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${PAT}`, Accept: "application/json" },
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}
function out(label, r) {
  console.log(`\n=== ${label} (${r.status}) ===`);
  console.log(typeof r.body === "string" ? r.body.slice(0, 3000) : JSON.stringify(r.body, null, 2).slice(0, 5000));
}

out("domains list", await gd("GET", "/v1/domains?statuses=ACTIVE,PENDING_DNS_ACTIVE&limit=50"));
out("domain detail", await gd("GET", `/v1/domains/${DOMAIN}`));
out("all records", await gd("GET", `/v1/domains/${DOMAIN}/records`));
out("MX records", await gd("GET", `/v1/domains/${DOMAIN}/records/MX`));
out("NS records", await gd("GET", `/v1/domains/${DOMAIN}/records/NS`));
// legacy email forwarding endpoints sometimes used
for (const p of [
  `/v1/domains/${DOMAIN}/forwarding`,
  `/v1/domains/forwarding/${DOMAIN}`,
  `/v2/customers/self/domains/forwards/${DOMAIN}`,
]) out(p, await gd("GET", p));
