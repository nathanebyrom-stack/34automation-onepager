// POST /api/review — the Reviews form (section 05).
// Checks every field, runs the spam test (Cloudflare Turnstile) and emails the review to 34 to check by hand.
// Nothing is published from here: a review only appears on the site once it's added to public/reviews.json.
//
// Environment: the same settings as /api/enquiry (Cloudflare Pages > Settings > Variables and secrets):
//   RESEND_API_KEY / RESEND_KEY  secret   Resend API key (RESEND_KEY wins, as in enquiry.js)
//   TURNSTILE_SECRET_KEY         secret   Turnstile secret key
//   ENQUIRY_TO                   text     where reviews land, e.g. nathan@34automation.co.uk
//   ENQUIRY_FROM                 text     sender, e.g. 34 Automation <enquiries@34automation.co.uk>
//   ALLOW_NO_TURNSTILE           text     "1" only for local testing
//   RESEND_API_URL, TURNSTILE_VERIFY_URL  local testing only (stand-ins), never set in Cloudflare

const MAX_BODY = 8_000;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const clean = (v) => (typeof v === "string" ? v.replace(/\u0000/g, "").replace(/\r\n?/g, "\n").trim() : "");
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => s.replace(/\s+/g, " ");

export async function onRequestPost({ request, env: rawEnv }) {
  // trim pasted settings: a stray space or newline in a dashboard secret breaks verification
  const env = Object.fromEntries(Object.entries(rawEnv || {}).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
  if (env.RESEND_KEY) env.RESEND_API_KEY = env.RESEND_KEY;
  const missing = ["RESEND_API_KEY", "ENQUIRY_TO", "ENQUIRY_FROM"].filter((k) => !env[k]);
  if (!env.TURNSTILE_SECRET_KEY && env.ALLOW_NO_TURNSTILE !== "1") missing.push("TURNSTILE_SECRET_KEY");
  if (missing.length) return json({ ok: false, code: "not_configured", missing }, 500); // names only, never values

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, code: "too_large" }, 413);
  let d;
  try { d = JSON.parse(raw); } catch { return json({ ok: false, code: "bad_json" }, 400); }
  if (!d || typeof d !== "object" || Array.isArray(d)) return json({ ok: false, code: "bad_json" }, 400);

  // honeypot: bots fill the hidden "website" field. Pretend it worked, send nothing.
  if (clean(d.website)) return json({ ok: true });

  const business = oneLine(clean(d.business));
  if (!business || business.length > 80) return json({ ok: false, code: "invalid", field: "business" }, 400);
  const rating = typeof d.rating === "number" ? d.rating : typeof d.rating === "string" && /^\s*[1-5]\s*$/.test(d.rating) ? +d.rating : NaN;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ ok: false, code: "invalid", field: "rating" }, 400);
  const reviewer = d.reviewer === "client" || d.reviewer === "visitor" ? d.reviewer : "";
  if (!reviewer) return json({ ok: false, code: "invalid", field: "reviewer" }, 400);
  if (d.comment != null && typeof d.comment !== "string") return json({ ok: false, code: "invalid", field: "comment" }, 400);
  const comment = clean(d.comment);
  if (comment.length > 280) return json({ ok: false, code: "too_long", field: "comment" }, 400);

  if (env.TURNSTILE_SECRET_KEY) {
    const token = typeof d.turnstile === "string" ? d.turnstile.trim().slice(0, 2048) : "";
    if (!token) return json({ ok: false, code: "spam_check" }, 400);
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET_KEY);
    form.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) form.append("remoteip", ip);
    let ok = false, detail = [];
    try {
      const r = await fetch(env.TURNSTILE_VERIFY_URL || "https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
      const v = await r.json();
      ok = !!v.success && (!v.action || v.action === "review"); // a token made for another form doesn't count here
      detail = Array.isArray(v["error-codes"]) ? v["error-codes"] : [];
      if (v.success && !ok) detail = ["wrong_action"];
    } catch { ok = false; detail = ["siteverify_unreachable"]; }
    if (!ok) { console.error("turnstile", detail.join(",")); return json({ ok: false, code: "spam_check", detail }, 400); }
  }

  const now = new Date();
  const when = now.toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
  const day = now.toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD, UK date
  const entry = JSON.stringify(comment ? { business, rating, reviewer, comment, date: day } : { business, rating, reviewer, date: day }, null, 2);
  const rows = [["Business", business], ["Score", `${rating} out of 5`], ["Worked with us", reviewer === "client" ? "Yes, a client" : "No, rating the website"], ["Sent", when + " (UK)"]];
  const how =
    "To publish it, add it to public/reviews.json in the 34automation-onepager repo (inside the [ ], comma between entries) and push to main. " +
    "Publish genuine reviews, good or bad. Don't edit the wording. If you're not publishing it, just delete this email.";

  const sent = await send(env, {
    from: env.ENQUIRY_FROM,
    to: env.ENQUIRY_TO.split(",").map((s) => s.trim()).filter(Boolean),
    subject: `New review to check: ${business} · ${rating}/5`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nComment:\n${comment || "(none)"}\n\n${how}\n\nReady to paste:\n${entry}\n`,
    html:
      `<div style="font:15px/1.55 Arial,sans-serif;color:#1a1c20">` +
      `<p style="margin:0 0 14px;font:600 12px Arial;letter-spacing:.12em;text-transform:uppercase;color:#8c929a">34automation.co.uk review, not published yet</p>` +
      `<table style="border-collapse:collapse;margin:0 0 18px">` +
      rows.map(([k, v]) => `<tr><td style="padding:4px 18px 4px 0;color:#8c929a;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join("") +
      `</table><p style="margin:0 0 6px;color:#8c929a">Comment:</p>` +
      `<p style="margin:0 0 18px;white-space:pre-wrap">${comment ? esc(comment) : "(none)"}</p>` +
      `<p style="margin:0 0 10px">${esc(how)}</p>` +
      `<p style="margin:0 0 6px;color:#8c929a">Ready to paste:</p>` +
      `<pre style="margin:0;padding:12px;background:#f1f3f5;border:1px solid #d4d8dd;font:13px/1.5 Consolas,monospace;white-space:pre-wrap">${esc(entry)}</pre></div>`,
  });
  if (!sent.ok) return json({ ok: false, code: "send_failed", status: sent.status }, 502);
  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, code: "method" }, 405);
}

async function send(env, msg) {
  try {
    const r = await fetch(env.RESEND_API_URL || "https://api.resend.com/emails", {
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
