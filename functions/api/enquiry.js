// POST /api/enquiry — the "Start a conversation" form.
// Checks the spam test (Cloudflare Turnstile), emails the enquiry to 34 (reply-to = the visitor)
// and sends the visitor a short acknowledgement. Email goes out through Resend.
//
// Environment (Cloudflare Pages > Settings > Variables and secrets):
//   RESEND_API_KEY        secret   Resend API key (sending access, 34automation.co.uk only)
//   TURNSTILE_SECRET_KEY  secret   Turnstile secret key
//   TURNSTILE_SITE_KEY    text     Turnstile site key (served to the page by /api/config)
//   ENQUIRY_TO            text     where enquiries land, e.g. nathan@34automation.co.uk
//   ENQUIRY_FROM          text     sender, e.g. 34 Automation <enquiries@34automation.co.uk>
//   SEND_ACK              text     "0" to switch off the visitor acknowledgement (default on)
//   ALLOW_NO_TURNSTILE    text     "1" only for local testing
//   TURNSTILE_VERIFY_URL  text     local testing only: a stand-in for Turnstile's siteverify (never set in Cloudflare)

const MAX_BODY = 20_000;
const INTERESTS = ["Website", "Marketing", "Automation", "Not sure yet"];
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const str = (v, max) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "");
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => s.replace(/[\r\n]+/g, " ");
const local = (u) => typeof u === "string" && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u); // test stand-ins only ever point at this machine
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

export async function onRequestPost({ request, env: rawEnv }) {
  // trim pasted settings: a stray space or newline in a dashboard secret breaks verification
  const env = Object.fromEntries(Object.entries(rawEnv || {}).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
  if (env.RESEND_KEY) env.RESEND_API_KEY = env.RESEND_KEY; // RESEND_KEY (newer secret) wins over RESEND_API_KEY
  const missing = ["RESEND_API_KEY", "ENQUIRY_TO", "ENQUIRY_FROM"].filter((k) => !env[k]);
  if (!env.TURNSTILE_SECRET_KEY && env.ALLOW_NO_TURNSTILE !== "1") missing.push("TURNSTILE_SECRET_KEY");
  if (missing.length) return json({ ok: false, code: "not_configured", missing }, 500); // names only, never values

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, code: "too_large" }, 413);
  let d;
  try { d = JSON.parse(raw); } catch { return json({ ok: false, code: "bad_json" }, 400); }
  if (!d || typeof d !== "object") return json({ ok: false, code: "bad_json" }, 400);

  // honeypot: bots fill the hidden "website" field. Pretend it worked, send nothing.
  if (str(d.website, 200)) return json({ ok: true });

  const f = {
    name: oneLine(str(d.name, 120)),
    company: oneLine(str(d.company, 160)),
    email: str(d.email, 200),
    phone: oneLine(str(d.phone, 40)),
    message: str(d.message, 4000),
    interest: Array.isArray(d.interest) ? d.interest.filter((i) => INTERESTS.includes(i)) : [],
  };
  if (!f.name || !f.message || !EMAIL.test(f.email)) return json({ ok: false, code: "invalid" }, 400);

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
      const r = await fetch(local(env.TURNSTILE_VERIFY_URL) ? env.TURNSTILE_VERIFY_URL : "https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form }); // TURNSTILE_VERIFY_URL: local testing only
      const v = await r.json();
      ok = !!v.success && (!v.action || v.action === "enquiry"); // a token made for another form doesn't count here
      detail = Array.isArray(v["error-codes"]) ? v["error-codes"] : [];
      if (v.success && !ok) detail = ["wrong_action"];
    } catch { ok = false; detail = ["siteverify_unreachable"]; }
    if (!ok) { console.error("turnstile", detail.join(",")); return json({ ok: false, code: "spam_check", detail }, 400); }
  }

  const first = f.name.split(/\s+/)[0];
  const when = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
  const rows = [
    ["Name", f.name], ["Company", f.company || "—"], ["Email", f.email], ["Phone", f.phone || "—"],
    ["Interested in", f.interest.join(", ") || "—"], ["Sent", when + " (UK)"],
  ];

  const notify = {
    from: env.ENQUIRY_FROM,
    to: env.ENQUIRY_TO.split(",").map((s) => s.trim()).filter(Boolean),
    reply_to: f.email,
    subject: `New enquiry: ${f.name}${f.company ? ", " + f.company : ""}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nWhere their brand is now:\n${f.message}\n\nReply to this email to answer ${first} directly.`,
    html:
      `<div style="font:15px/1.55 Arial,sans-serif;color:#1a1c20">` +
      `<p style="margin:0 0 14px;font:600 12px Arial;letter-spacing:.12em;text-transform:uppercase;color:#8c929a">34automation.co.uk enquiry</p>` +
      `<table style="border-collapse:collapse;margin:0 0 18px">` +
      rows.map(([k, v]) => `<tr><td style="padding:4px 18px 4px 0;color:#8c929a;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join("") +
      `</table><p style="margin:0 0 6px;color:#8c929a">Where their brand is now:</p>` +
      `<p style="margin:0 0 18px;white-space:pre-wrap">${esc(f.message)}</p>` +
      `<p style="margin:0;color:#8c929a">Reply to this email to answer ${esc(first)} directly.</p></div>`,
  };

  const sent = await send(env, notify);
  if (!sent.ok) return json({ ok: false, code: "send_failed", status: sent.status }, 502);

  if (env.SEND_ACK !== "0") {
    const ackText =
      `Hi ${first},\n\n` +
      `Thanks for getting in touch.. your message has landed with me and I'll come back to you the same working day.\n\n` +
      `If you've got a drawing, your current site or anything else that would help, just reply to this email and add it.\n\n` +
      `Thanks, Nathan\n34 Automation\n\n---\nWhat you sent us:\n${f.message}`;
    await send(env, {
      from: env.ENQUIRY_FROM,
      to: [f.email],
      reply_to: env.ENQUIRY_TO.split(",")[0].trim(),
      subject: `Got your message, ${first}`,
      text: ackText,
      html:
        `<div style="font:15px/1.6 Arial,sans-serif;color:#1a1c20;max-width:560px">` +
        `<p>Hi ${esc(first)},</p>` +
        `<p>Thanks for getting in touch.. your message has landed with me and I'll come back to you the same working day.</p>` +
        `<p>If you've got a drawing, your current site or anything else that would help, just reply to this email and add it.</p>` +
        `<p>Thanks, Nathan<br>34 Automation</p>` +
        `<hr style="border:0;border-top:1px solid #d4d8dd;margin:24px 0"><p style="color:#8c929a;margin:0 0 6px">What you sent us:</p>` +
        `<p style="color:#8c929a;white-space:pre-wrap;margin:0">${esc(f.message)}</p></div>`,
    }); // a failed acknowledgement doesn't fail the enquiry: 34 already has it
  }
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
