// POST /api/report: the 07 "Free website report" form (Nathan, 21 Nov 2026). Four fields: name, email, site, competitor (one, optional, URL only).
// Same pattern as /api/enquiry: spam test (Cloudflare Turnstile, action "report"), hidden honeypot, then one notification email to 34 through Resend
// (reply-to = the visitor). No acknowledgement email goes to the visitor: an automated email needs Nathan's approval first (Email Authority Policy v1.0).
//
// Environment (Cloudflare Pages > Settings > Variables and secrets):
//   RESEND_API_KEY / RESEND_KEY, TURNSTILE_SECRET_KEY, ENQUIRY_FROM   shared with /api/enquiry
//   REPORT_TO             text     optional: where report requests land. Not set = ENQUIRY_TO, so it works on deploy with no dashboard change.
//                                  The page's no-JS mailto is built from the same variable (scripts/build.mjs), so a change here needs a rebuild.
//   ALLOW_NO_TURNSTILE, TURNSTILE_VERIFY_URL, RESEND_API_URL          local testing only, as for /api/enquiry

const MAX_BODY = 8_000;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const str = (v, max) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "");
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => s.replace(/[\r\n]+/g, " ");
const local = (u) => typeof u === "string" && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u);
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

// "yourfirm.co.uk" or a full http(s) address -> { href, host } or null. The same rule as the page.
function site(v) {
  v = str(v, 200);
  if (!v || /\s/.test(v)) return null;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname) || u.username || u.password) return null;
    return { href: u.origin + (u.pathname === "/" ? "" : u.pathname), host: u.hostname.toLowerCase().replace(/^www\./, "") };
  } catch { return null; }
}
// verification: the report only goes to someone at the site's own domain ("Company email address required for verification")
const sameDomain = (email, host) => {
  const d = email.split("@").pop().toLowerCase();
  return d === host || host.endsWith("." + d) || d.endsWith("." + host);
};

export async function onRequestPost({ request, env: rawEnv }) {
  const env = Object.fromEntries(Object.entries(rawEnv || {}).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
  if (env.RESEND_KEY) env.RESEND_API_KEY = env.RESEND_KEY;
  const to = env.REPORT_TO || env.ENQUIRY_TO;
  const missing = ["RESEND_API_KEY", "ENQUIRY_FROM"].filter((k) => !env[k]);
  if (!to) missing.push("REPORT_TO or ENQUIRY_TO");
  if (!env.TURNSTILE_SECRET_KEY && env.ALLOW_NO_TURNSTILE !== "1") missing.push("TURNSTILE_SECRET_KEY");
  if (missing.length) return json({ ok: false, code: "not_configured", missing }, 500); // names only, never values

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, code: "too_large" }, 413);
  let d;
  try { d = JSON.parse(raw); } catch { return json({ ok: false, code: "bad_json" }, 400); }
  if (!d || typeof d !== "object") return json({ ok: false, code: "bad_json" }, 400);

  // honeypot: bots fill the hidden "homepage" field. Pretend it worked, send nothing.
  if (str(d.homepage, 200)) return json({ ok: true });

  const name = oneLine(str(d.name, 120)), email = str(d.email, 200), own = site(d.site);
  if (!name || !own || !EMAIL.test(email) || !sameDomain(email, own.host)) return json({ ok: false, code: "invalid" }, 400);
  let comp = null; // one competitor, URL only, optional
  if (str(d.competitor, 200)) {
    comp = site(d.competitor);
    if (!comp || comp.host === own.host) return json({ ok: false, code: "invalid" }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = str(d.turnstile, 2048);
    if (!token) return json({ ok: false, code: "spam_check" }, 400);
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET_KEY);
    form.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) form.append("remoteip", ip);
    let ok = false, detail = [];
    try {
      const r = await fetch(local(env.TURNSTILE_VERIFY_URL) ? env.TURNSTILE_VERIFY_URL : "https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
      const v = await r.json();
      ok = !!v.success && (!v.action || v.action === "report"); // a token made for another form doesn't count here
      detail = Array.isArray(v["error-codes"]) ? v["error-codes"] : [];
      if (v.success && !ok) detail = ["wrong_action"];
    } catch { ok = false; detail = ["siteverify_unreachable"]; }
    if (!ok) { console.error("turnstile", detail.join(",")); return json({ ok: false, code: "spam_check", detail }, 400); }
  }

  const when = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
  const rows = [
    ["Name", name], ["Email address", email], ["Website URL", own.href],
    ["Competitor website URL", comp ? comp.href : "(none given)"],
    ["Sent", when + " (UK)"],
  ];
  const first = name.split(/\s+/)[0];
  const sent = await send(env, {
    from: env.ENQUIRY_FROM,
    to: to.split(",").map((s) => s.trim()).filter(Boolean),
    reply_to: email,
    subject: `Free website report request: ${own.host}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nEmail domain matches the website. Reply to this email to answer ${first} directly.`,
    html:
      `<div style="font:15px/1.55 Arial,sans-serif;color:#1a1c20">` +
      `<p style="margin:0 0 14px;font:600 12px Arial;letter-spacing:.12em;text-transform:uppercase;color:#8c929a">34automation.co.uk free website report request</p>` +
      `<table style="border-collapse:collapse;margin:0 0 18px">` +
      rows.map(([k, v]) => `<tr><td style="padding:4px 18px 4px 0;color:#8c929a;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join("") +
      `</table><p style="margin:0;color:#8c929a">Email domain matches the website. Reply to this email to answer ${esc(first)} directly.</p></div>`,
  });
  if (!sent.ok) return json({ ok: false, code: "send_failed", status: sent.status }, 502);
  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, code: "method" }, 405);
}

async function send(env, msg) {
  try {
    const r = await fetch(local(env.RESEND_API_URL) ? env.RESEND_API_URL : "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
    if (!r.ok) console.error("resend", r.status, await r.text());
    return { ok: r.ok, status: r.status };
  } catch (e) {
    console.error("resend", e && e.message);
    return { ok: false, status: 0 };
  }
}
