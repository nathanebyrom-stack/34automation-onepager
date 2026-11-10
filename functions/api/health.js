// GET /api/health: is the enquiry form wired up? Reports status only, never values.
export async function onRequestGet({ env: raw }) {
  const env = Object.fromEntries(Object.entries(raw || {}).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
  if (env.RESEND_KEY) env.RESEND_API_KEY = env.RESEND_KEY; // RESEND_KEY (newer secret) wins over RESEND_API_KEY
  let resend = "missing";
  if (env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } });
      const j = await r.json().catch(() => ({}));
      // a sending-only key answers 401 restricted_api_key here: that means the key itself is valid
      resend = r.ok || j.name === "restricted_api_key" ? "key_valid" : `${j.name || r.status}: ${j.message || ""}`;
    } catch { resend = "unreachable"; }
  }
  const body = {
    resend,
    turnstileSecretSet: !!env.TURNSTILE_SECRET_KEY,
    turnstileSiteKeySet: !!env.TURNSTILE_SITE_KEY,
    enquiryTo: !!env.ENQUIRY_TO,
    enquiryFrom: env.ENQUIRY_FROM || null,
  };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
