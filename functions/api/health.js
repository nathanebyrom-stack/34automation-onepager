// GET /api/health: is the enquiry form wired up? Reports yes/no flags only, never values, and calls nothing outside.
// (It used to check the Resend key against Resend's API on every hit; anyone could trigger that, so it's gone. Check the key in Resend instead.)
export async function onRequestGet({ env: raw }) {
  const env = Object.fromEntries(Object.entries(raw || {}).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
  const body = {
    resendKeySet: !!(env.RESEND_KEY || env.RESEND_API_KEY),
    turnstileSecretSet: !!env.TURNSTILE_SECRET_KEY,
    turnstileSiteKeySet: !!env.TURNSTILE_SITE_KEY,
    enquiryTo: !!env.ENQUIRY_TO,
    enquiryFrom: !!env.ENQUIRY_FROM,
  };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
