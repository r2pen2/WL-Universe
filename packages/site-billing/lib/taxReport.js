const fs = require("fs");
const path = require("path");
const { getStripe } = require("./stripe-client");
const logger = require("./logger");

// Monthly "set aside for taxes" email.
//
// Stripe pays out to Joe's bank. On the 1st of each month this totals last month's payouts (what actually
// reached the bank, after Stripe fees and refunds) and emails how much of it to set aside for taxes, with a
// running total for the tax year, the days left until it's due, and a projection for the whole year.
// The amount comes from Stripe, so new clients are included without changing anything.
//
// Env: TAX_SET_ASIDE_RATE (default 0.40), TAX_REPORT_TO (default joedobbelaar@gmail.com),
//      TAX_REPORT_ENABLED (default true), SITE_MAIL_API_KEY (required to send), SITE_MAIL_URL,
//      TAX_REPORT_MAIL_SITE (site-mail sender profile, default "billing" = billing@joed.dev).
// State: <SITE_BILLING_STATE_DIR>/tax-reports.json records which months were sent, so restarts don't resend.

const SUBJECT_PREFIX = "[Taxes]";
const TIME_ZONE = "America/New_York";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function rate(env = process.env) {
  const r = Number(env.TAX_SET_ASIDE_RATE ?? 0.4);
  if (!(r > 0 && r < 1)) throw new Error("TAX_SET_ASIDE_RATE must be between 0 and 1 (e.g. 0.4)");
  return r;
}

/** Today's calendar date in Joe's time zone: { year, month (0-11), day, hour }. */
function localNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", hourCycle: "h23" })
      .formatToParts(now)
      .map((p) => [p.type, Number(p.value)]),
  );
  return { year: parts.year, month: parts.month - 1, day: parts.day, hour: parts.hour };
}

/** The month before the given local date: { year, month }. */
function previousMonth({ year, month }) {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

const monthKey = ({ year, month }) => `${year}-${String(month + 1).padStart(2, "0")}`;

function parseMonthKey(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ""));
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error("month must look like 2026-10");
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
}

/** Federal and Massachusetts returns are due April 15 of the next year, moved to Monday if it falls on a weekend. */
function taxDueDate(taxYear) {
  const due = new Date(Date.UTC(taxYear + 1, 3, 15));
  const dow = due.getUTCDay();
  if (dow === 6) due.setUTCDate(17);
  if (dow === 0) due.setUTCDate(16);
  return due;
}

/** Paid payouts that arrived in [from, to) (unix seconds; Stripe arrival dates are calendar dates at 00:00 UTC). */
async function paidPayouts(stripe, from, to) {
  const out = [];
  for await (const p of stripe.payouts.list({ arrival_date: { gte: from, lt: to }, limit: 100 })) {
    if (p.status === "paid") out.push(p);
  }
  return out;
}

const sumCents = (payouts) => payouts.reduce((t, p) => t + p.amount, 0);

/**
 * Figures for the report on the given month. Earnings are payouts that reached the bank that month.
 * The yearly projection assumes every remaining month of the tax year earns what this month did.
 */
async function buildReport({ year, month }, { stripe = getStripe(), env = process.env, today = localNow() } = {}) {
  const r = rate(env);
  const unix = (y, m) => Math.floor(Date.UTC(y, m, 1) / 1000);
  const yearPayouts = await paidPayouts(stripe, unix(year, 0), unix(year, month + 1));
  const monthStart = unix(year, month);
  const monthCents = sumCents(yearPayouts.filter((p) => p.arrival_date >= monthStart));
  const ytdCents = sumCents(yearPayouts);
  const monthsLeft = 11 - month;
  const projectedCents = ytdCents + monthCents * monthsLeft;
  const due = taxDueDate(year);
  const todayUtc = Date.UTC(today.year, today.month, today.day);
  return {
    month: monthKey({ year, month }),
    monthName: `${MONTHS[month]} ${year}`,
    taxYear: year,
    rate: r,
    payoutCount: yearPayouts.filter((p) => p.arrival_date >= monthStart).length,
    earned: monthCents / 100,
    setAside: Math.round(monthCents * r) / 100,
    ytdEarned: ytdCents / 100,
    ytdSetAside: Math.round(ytdCents * r) / 100,
    monthsLeft,
    projectedEarned: projectedCents / 100,
    projectedTax: Math.round(projectedCents * r) / 100,
    dueDate: due.toISOString().slice(0, 10),
    dueLabel: due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
    daysUntilDue: Math.round((due.getTime() - todayUtc) / 86400000),
  };
}

const usd = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (r) => `${Math.round(r * 1000) / 10}%`;

function untilDue(days) {
  if (days < 0) return `${-days} days ago`;
  if (days < 60) return `in ${days} days`;
  const months = Math.round(days / 30.4);
  return `in ${days} days (about ${months} months)`;
}

function buildEmail(report) {
  const subject = `${SUBJECT_PREFIX} Set aside ${usd(report.setAside)} for ${report.monthName}`;
  const projection =
    report.monthsLeft > 0
      ? `If the rest of ${report.taxYear} looks like ${MONTHS[Number(report.month.slice(5)) - 1]}, you'll earn about ${usd(report.projectedEarned)} this year and owe about ${usd(report.projectedTax)} in tax.`
      : `${report.taxYear} is complete: you earned ${usd(report.projectedEarned)} and should have ${usd(report.projectedTax)} set aside.`;
  const rows = [
    [`Earned in ${report.monthName}`, usd(report.earned)],
    [`Set aside (${pct(report.rate)})`, usd(report.setAside)],
    [`Set aside so far in ${report.taxYear}`, `${usd(report.ytdSetAside)} of ${usd(report.ytdEarned)} earned`],
    [`${report.taxYear} taxes due`, `${report.dueLabel}, ${untilDue(report.daysUntilDue)}`],
    [`Projected ${report.taxYear} earnings`, usd(report.projectedEarned)],
    [`Projected ${report.taxYear} tax`, usd(report.projectedTax)],
  ];
  const text = [
    `Set aside ${usd(report.setAside)} for taxes.`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    projection,
    "",
    "Earnings are Stripe payouts that reached your bank that month, after Stripe's fees.",
  ].join("\n");
  const html =
    `<p style="font-size:18px">Set aside <b>${usd(report.setAside)}</b> for taxes.</p>` +
    `<table cellpadding="6" style="border-collapse:collapse">${rows
      .map(([k, v]) => `<tr><td style="color:#555">${k}</td><td><b>${v}</b></td></tr>`)
      .join("")}</table>` +
    `<p>${projection}</p>` +
    `<p style="color:#777;font-size:12px">Earnings are Stripe payouts that reached your bank that month, after Stripe's fees.</p>`;
  return { subject, text, html };
}

async function sendEmail(mail, { env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = env.SITE_MAIL_API_KEY;
  if (!apiKey) throw new Error("SITE_MAIL_API_KEY is not configured");
  const url = `${(env.SITE_MAIL_URL || "https://site-mail.joed.dev").replace(/\/$/, "")}/v1/send`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      site: env.TAX_REPORT_MAIL_SITE || "billing",
      to: env.TAX_REPORT_TO || "joedobbelaar@gmail.com",
      ...mail,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`site-mail ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return true;
}

function sentPath(env = process.env) {
  return path.join(env.SITE_BILLING_STATE_DIR || "/opt/services/data/app-assets/site-billing", "tax-reports.json");
}

function readSent(env) {
  try {
    return JSON.parse(fs.readFileSync(sentPath(env), "utf8"));
  } catch {
    return {};
  }
}

function markSent(key, report, env) {
  const sent = readSent(env);
  sent[key] = { sentAt: new Date().toISOString(), setAside: report.setAside, earned: report.earned };
  const file = sentPath(env);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, `${JSON.stringify(sent, null, 2)}\n`);
  fs.renameSync(`${file}.tmp`, file);
}

/**
 * Hourly tick: on the 1st-7th of a month, from 9am Eastern, send last month's report once.
 * (The week's window covers glados being down on the 1st without ever sending a stale report.)
 */
async function maybeSendMonthlyReport({ now = new Date(), env = process.env, stripe, fetchImpl } = {}) {
  if (String(env.TAX_REPORT_ENABLED ?? "true") === "false") return { skipped: "disabled" };
  const today = localNow(now);
  if (today.day > 7 || (today.day === 1 && today.hour < 9)) return { skipped: "not report time" };
  const target = previousMonth(today);
  const key = monthKey(target);
  if (readSent(env)[key]) return { skipped: "already sent", month: key };
  const report = await buildReport(target, { stripe, env, today });
  await sendEmail(buildEmail(report), { env, fetchImpl });
  markSent(key, report, env);
  logger.info("tax_report_sent", { month: key, setAside: report.setAside });
  return { sent: true, report };
}

module.exports = {
  SUBJECT_PREFIX,
  localNow,
  previousMonth,
  monthKey,
  parseMonthKey,
  taxDueDate,
  buildReport,
  buildEmail,
  sendEmail,
  maybeSendMonthlyReport,
};
