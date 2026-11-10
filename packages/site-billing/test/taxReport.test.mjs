import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tax = require("../lib/taxReport.js");

const day = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / 1000);

/** Fake Stripe: payouts.list filters by arrival_date like the real API and is async-iterable. */
function fakeStripe(payouts) {
  return {
    payouts: {
      list({ arrival_date: { gte, lt } }) {
        const hits = payouts.filter((p) => p.arrival_date >= gte && p.arrival_date < lt);
        return { async *[Symbol.asyncIterator]() { yield* hits; } };
      },
    },
  };
}

// Made-up amounts (cents).
const payouts = [
  { amount: 1000, status: "paid", arrival_date: day(2025, 12, 30) }, // last year: ignored
  { amount: 1500, status: "paid", arrival_date: day(2026, 9, 11) },
  { amount: 1000, status: "paid", arrival_date: day(2026, 10, 14) },
  { amount: 4000, status: "paid", arrival_date: day(2026, 10, 30) },
  { amount: 5000, status: "failed", arrival_date: day(2026, 10, 20) }, // never reached the bank
  { amount: 2000, status: "paid", arrival_date: day(2026, 11, 2) }, // next month: not in October's report
];

test("report: month and year-to-date earnings, set-aside, projection, due date", async () => {
  const report = await tax.buildReport(
    { year: 2026, month: 9 },
    { stripe: fakeStripe(payouts), env: { TAX_SET_ASIDE_RATE: "0.4" }, today: { year: 2026, month: 10, day: 1 } },
  );
  assert.equal(report.month, "2026-10");
  assert.equal(report.earned, 50);
  assert.equal(report.setAside, 20);
  assert.equal(report.ytdEarned, 65);
  assert.equal(report.ytdSetAside, 26);
  assert.equal(report.monthsLeft, 2);
  assert.equal(report.projectedEarned, 165);
  assert.equal(report.projectedTax, 66);
  assert.equal(report.dueDate, "2027-04-15");
  assert.equal(report.daysUntilDue, 165);
});

test("December's report covers the finished year", async () => {
  const report = await tax.buildReport(
    { year: 2026, month: 11 },
    { stripe: fakeStripe(payouts), env: {}, today: { year: 2027, month: 0, day: 1 } },
  );
  assert.equal(report.monthsLeft, 0);
  assert.equal(report.projectedEarned, report.ytdEarned);
  assert.match(tax.buildEmail(report).text, /2026 is complete/);
});

test("email: subject and wording", async () => {
  const report = await tax.buildReport(
    { year: 2026, month: 9 },
    { stripe: fakeStripe(payouts), env: {}, today: { year: 2026, month: 10, day: 1 } },
  );
  const mail = tax.buildEmail(report);
  assert.equal(mail.subject, "[Taxes] Set aside $20.00 for October 2026");
  assert.ok(mail.text.startsWith("Set aside $20.00 for taxes."));
  assert.ok(mail.text.includes("Set aside so far in 2026: $26.00 of $65.00 earned"));
  assert.ok(mail.text.includes("2026 taxes due: April 15, 2027, in 165 days (about 5 months)"));
  assert.ok(mail.text.includes("Projected 2026 tax: $66.00"));
  assert.doesNotMatch(mail.text, /tax account/);
});

test("due date moves off weekends", () => {
  assert.equal(tax.taxDueDate(2026).toISOString().slice(0, 10), "2027-04-15"); // Thursday
  assert.equal(tax.taxDueDate(2027).toISOString().slice(0, 10), "2028-04-17"); // Apr 15 2028 is a Saturday
  assert.equal(tax.taxDueDate(2032).toISOString().slice(0, 10), "2033-04-15");
});

test("rate must be a fraction", async () => {
  await assert.rejects(tax.buildReport({ year: 2026, month: 0 }, { stripe: fakeStripe([]), env: { TAX_SET_ASIDE_RATE: "40" } }), /between 0 and 1/);
});

test("schedule: sends once early in the month, from 9am Eastern", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tax-"));
  const env = { SITE_BILLING_STATE_DIR: dir, SITE_MAIL_API_KEY: "k", TAX_REPORT_TO: "owner@example.com" };
  const sent = [];
  const fetchImpl = async (url, init) => { sent.push(JSON.parse(init.body)); return { ok: true }; };
  const deps = { env, stripe: fakeStripe(payouts), fetchImpl };

  // Dec 1, 8am Eastern (13:00 UTC): too early.
  assert.equal((await tax.maybeSendMonthlyReport({ ...deps, now: new Date("2026-12-01T13:00:00Z") })).skipped, "not report time");
  // Dec 1, 9am Eastern: sends November's report.
  const first = await tax.maybeSendMonthlyReport({ ...deps, now: new Date("2026-12-01T14:00:00Z") });
  assert.equal(first.sent, true);
  assert.equal(first.report.month, "2026-11");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "owner@example.com");
  assert.equal(sent[0].site, "billing");
  assert.equal(sent[0].subject, "[Taxes] Set aside $8.00 for November 2026");
  // Later the same week (or after a restart): not again.
  assert.equal((await tax.maybeSendMonthlyReport({ ...deps, now: new Date("2026-12-03T15:00:00Z") })).skipped, "already sent");
  // Mid-month: nothing to do.
  assert.equal((await tax.maybeSendMonthlyReport({ ...deps, now: new Date("2026-11-10T15:00:00Z") })).skipped, "not report time");
  assert.equal(sent.length, 1);
});

test("a failed send isn't marked, so the next hour retries", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tax-"));
  const env = { SITE_BILLING_STATE_DIR: dir, SITE_MAIL_API_KEY: "k" };
  const now = new Date("2026-12-01T15:00:00Z");
  const failing = async () => ({ ok: false, status: 502, text: async () => "smtp" });
  await assert.rejects(tax.maybeSendMonthlyReport({ env, now, stripe: fakeStripe(payouts), fetchImpl: failing }), /site-mail 502/);
  const ok = await tax.maybeSendMonthlyReport({ env, now, stripe: fakeStripe(payouts), fetchImpl: async () => ({ ok: true }) });
  assert.equal(ok.sent, true);
});

test("can be switched off", async () => {
  assert.equal((await tax.maybeSendMonthlyReport({ env: { TAX_REPORT_ENABLED: "false" } })).skipped, "disabled");
});
