# 34automation.co.uk

The 34 Automation one-page site, ready for Cloudflare Pages.

```
public/              the site (HTML, CSS, JS, fonts, images, frame sheets)
  index.html         home page
  clients/           client area: code or link → Brand Builder
  privacy/           privacy notice
  404.html
  _headers           security headers, caching, noindex on *.pages.dev
  _redirects         tidy URLs (/contact, /privacy-policy, /client)
functions/api/
  enquiry.js         POST /api/enquiry: spam check, email to 34, acknowledgement to visitor
  config.js          GET /api/config: hands the page the Turnstile site key
site.config.json     company details and URLs, filled into the pages at build time
scripts/build.mjs    public/ → dist/, fills {{PLACEHOLDERS}}, blocks production if details are missing
```

## 1. Fill in the company details

Edit `site.config.json`:

| Key | What goes in |
|---|---|
| `legalName` | Exactly as registered, e.g. `34 Automation Ltd`. If not a company, your name and trading name. |
| `companyNumber` | Companies House number. Leave empty if not a limited company. |
| `registeredIn` | Usually `England and Wales`. |
| `address` | Registered office (company) or business address (sole trader). |
| `vatNumber` | Only if VAT registered. |
| `icoRegistration` | ICO registration number once the fee is paid. Optional. |

The production build (branch `main`) **stops** while `legalName` or `address` is empty, so the site can't go live without them. Preview builds show a ⚠ warning in the footer instead.

## 2. Cloudflare account and nameservers

1. Create a free Cloudflare account and **Add a domain** → `34automation.co.uk` → Free plan.
2. Cloudflare scans the existing records. Check these came across before you go further:

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | MX | `@` | `mx00.ionos.co.uk` (priority 10) | — |
   | MX | `@` | `mx01.ionos.co.uk` (priority 10) | — |
   | TXT | `@` | `v=spf1 include:_spf-eu.ionos.com ~all` | — |

   Also keep any IONOS `autodiscover`, `_dmarc` or DKIM records it found. **Delete** the old `A @ 217.160.0.42` (IONOS parking) record.
3. In IONOS → Domains → `34automation.co.uk` → Nameservers → use custom nameservers → paste the two Cloudflare gives you. Allow up to 48 hours (usually under 2).

## 3. Cloudflare Pages project

Workers & Pages → Create → Pages → **Connect to Git** → `nathanebyrom-stack/34automation-onepager`.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `node scripts/build.mjs` |
| Build output directory | `dist` |

Then **Custom domains** → add `34automation.co.uk` and `www.34automation.co.uk`.

**www → bare domain:** Rules → Redirect Rules → template *Redirect from WWW to root* (301, keep query string).

**Analytics:** Pages project → Metrics → enable Web Analytics (cookieless, nothing else to change).

## 4. Turnstile (spam check)

Cloudflare → Turnstile → Add widget → name `34 enquiry form`, hostnames `34automation.co.uk`, `www.34automation.co.uk`, mode **Managed**. Copy the site key and secret key.

## 5. Resend (email sending)

1. Create a Resend account → Domains → Add `34automation.co.uk`, region **Ireland (eu-west-1)**.
2. Add the records Resend lists (DKIM on `resend._domainkey`, SPF + MX on `send`) in Cloudflare DNS, **DNS only** (grey cloud). They don't touch your IONOS mail.
3. Once verified: API Keys → create, permission **Sending access**, domain `34automation.co.uk`.
4. Add DMARC in Cloudflare if there isn't one: `TXT _dmarc` → `v=DMARC1; p=none; rua=mailto:nathan@34automation.co.uk`

## 6. Environment variables

Pages project → Settings → Variables and secrets → **Production**:

| Name | Type | Value |
|---|---|---|
| `RESEND_API_KEY` | Secret | from step 5 |
| `TURNSTILE_SECRET_KEY` | Secret | from step 4 |
| `TURNSTILE_SITE_KEY` | Text | from step 4 |
| `ENQUIRY_TO` | Text | `nathan@34automation.co.uk` |
| `ENQUIRY_FROM` | Text | `34 Automation <enquiries@34automation.co.uk>` |

Redeploy after adding them (Deployments → latest → Retry).

## 7. Client area: clients.34automation.co.uk

The Brand Builder lives in `nathanebyrom-stack/34-brand-builder` on GitHub Pages, backend in Supabase (`34 Brand Builder`, London).

1. Cloudflare DNS: `CNAME clients` → `nathanebyrom-stack.github.io`, **DNS only** (grey cloud, so GitHub can issue the certificate).
2. GitHub → `34-brand-builder` → Settings → Pages → custom domain `clients.34automation.co.uk` → tick **Enforce HTTPS** once it's offered.
3. New links from `admin.html` now come out as `https://clients.34automation.co.uk/client/?k=…` (edge function updated 6 Nov 2026).
4. The free preview at the repo root sends leads through FormSubmit to `nathan@34automation.co.uk`. The first send triggers a FormSubmit activation email: click it.

## 8. Old domains

Add `34automation.com` and `34automation.online` to Cloudflare the same way (free), switch their nameservers in IONOS, and add a Redirect Rule on each: all requests → `https://34automation.co.uk` (301). Nothing on those domains is in use any more.

## 9. Launch test

- [ ] `https://34automation.co.uk` loads with a padlock; `www.` and `http://` both land on it.
- [ ] Send an enquiry from a phone and from a laptop: the email arrives in your inbox (check spam), Reply goes to the sender, the sender gets the acknowledgement.
- [ ] `/privacy/`, `/clients/` and a made-up URL (404 page) all load.
- [ ] A Brand Builder link from `admin.html` opens on `clients.34automation.co.uk`.
- [ ] PageSpeed Insights (mobile) 90+.
- [ ] Google Search Console: add the domain, submit `https://34automation.co.uk/sitemap.xml`. Same in Bing Webmaster Tools.
- [ ] Share the URL in a LinkedIn draft and check the preview card shows `og.jpg`.

## Local preview

```
npm install
cp .dev.vars.example .dev.vars   # test settings, no real email sent unless you add a key
npm run dev                       # http://localhost:8788
```

## Rollback

Cloudflare Pages → Deployments → any earlier deployment → **Rollback to this deployment**. DNS can be pointed back at IONOS by switching the nameservers back in IONOS.
