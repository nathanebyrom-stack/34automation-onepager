
function hcBoot(REPORT){
"use strict";
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =====================================================================
   CLIENT: the template slot (2). Every real report fills this in.
   ===================================================================== */
var CLIENT = {name:"Vellmoor Precision", site:"www.vellmoor.example", tested:"20 November 2026, 17:32"};
/* v5 · a live report replaces the sample client */
function hcWhen(iso){
  try { var o = {}; new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Europe/London'}).formatToParts(new Date(iso)).forEach(function(p){ o[p.type] = p.value; });
    return o.day + ' ' + o.month + ' ' + o.year + ', ' + o.hour + ':' + o.minute; } catch(e){ return String(iso || '').slice(0, 10); }
}
if (REPORT) CLIENT = {name: REPORT.name || REPORT.domain, site: REPORT.domain, tested: hcWhen(REPORT.tested)};

/* =====================================================================
   STATUSES (5): labels, colours, thresholds AND display order, in one place.
   - Thresholds are per check score, 0-10 (min and max inclusive).
   - Array order = display order everywhere (tally, filters, footer key). Worst first.
   - To swap Advisory and Needs attention: swap those two objects (display order),
     or swap their labels (if Nathan wants Advisory to cover 4-5 instead).
   ===================================================================== */
var STATUSES = [
  {k:"fail",      label:"Fail",            min:0, max:3,  c:"#D7263D", ink:"#FFFFFF", tint:"#FFE1E4"},
  {k:"attention", label:"Needs attention", min:4, max:5,  c:"#F46036", ink:"#0E0F11", tint:"#FFE6DA"},
  {k:"advisory",  label:"Advisory",        min:6, max:7,  c:"#F2B705", ink:"#0E0F11", tint:"#FFF0C2"},
  {k:"pass",      label:"Pass",            min:8, max:10, c:"#1B998B", ink:"#0E0F11", tint:"#D9F3EF"}
];
/* v5 · a check the engine couldn't take. Left out of every total; never a Fail (Ruby's rule for "Not measured"). */
var NM = {k:"nm", label:"Not scored", c:"#C3C7CC", ink:"#0E0F11", tint:"#F1EFE9"};

/* =====================================================================
   COPY: every new or changed string lives here.
   [Nathan]  = Nathan's own words (steers 4 and 13), typos only fixed. Don't restyle.
   [Maya]    = from maya/scorecard-v2-copy.md (humanized + slop-gated; Edie/Quinn not yet run).
   [Nova]    = Nova placeholder; Maya to replace or approve.
   ===================================================================== */
var COPY = {
  bannerBrand:   "Automation",                                   // [Nova] banner reads "34 Automation Website Health Check"
  bannerTitle:   "Website Health Check",                         // [Nova]
  clientLabel:   "Client", siteLabel: "Website", testedLabel: "Tested",   // [Nova]
  specTag:       "Example health check",                         // [Nova] steer 3
  specChecks:    "checks", specAreas: "areas",                   // [Nova]
  intro:         "Your website still starts every morning? So does an old banger, but nobody expects it to park itself. A site that works but can’t run an AI widget, WhatsApp chat or automatic booking is obsolete. When it fails on almost everything, a boot full of patches only buys you time, but a rebuild is built to last. This Website Health Check is free.",   // [Nathan] option B, 20 Nov; v4.4 last sentence = [Maya] pick (A), Nathan 20 Nov: no "cheaper", longevity
  introLegend:   "Each check is marked Fail, Needs attention, Advisory or Pass. If you look after your own site, retest after each fix.",   // [Quinn] legend under the intro (locked)
  /* v4.2 · verdict by the overall score. [Maya] 2026-11-20-hc-v4-2-copy.md; **…** renders bold */
  verdictLabel:  "Repair or replace?",                           // [Maya]
  verdictRepair: "**Repair.** Not many checks fail, so keep the site and work through the list below.",   // [Maya]
  verdictMid:    "**Close call.** Enough checks fail that it’s worth weighing a rebuild against the fixes before you decide.",   // [Maya] v4.4
  verdictReplace:"**Replace.** With this many Fails, a rebuild will do a far better job than patching it.",   // [Maya]
  footerVerdict: "“Repair or replace?” is set by how many checks your site fails: {RULE}.",   // [Maya]
  footerVerdictRule: "{repair} or fewer is Repair, {replace} or more is Replace, and anything in between is a Close call",   // [Leo] fills {RULE}; numbers come from VERDICT_RULE
  verdictBelief: "It comes down to your goals and how much you believe in what you sell. If you believe your business has a future, the right partner and a road map make this the start of something good, and if that partner is us, judge us by this page: the rates shown aren’t our prices, and your fix list is yours to use with whoever you like.",   // [Maya] v4.7 alternative, Edie's tweak "if that partner is us"; empty = hidden
  /* [Maya] v4.7 longer pick (not used): "Which way you go comes down to your goals and how much you believe in what you sell, and if you’re running this check, we’d guess you believe your business has a future. With the right partner and a road map, fixing or rebuilding is the start of something good, and if we’re the right fit, you’ve already seen how we work: a verdict set by how many checks fail, and UK market rates that aren’t our prices." */
  verdictFloor:  "A Fail on ‘Ready for today’s tools’ makes the verdict at least a Close call.",   // [Maya] run 2 force-rule wording, adapted; v4.5 (Nathan yes, 21 Nov)
  copyCompetitorsHead: "Competitor to compare:",                 // [Maya] v4.3
  rvPrivacy:     "What happens to this name? See our [[privacy notice]].",   // [Maya] v4.3 · link: PRIVACY_URL
  balloonedNote: "We look hardest at the home page. It’s usually a buyer’s first impression of your business, and a slow, dated or vague one is hard to shake.",   // [Maya] steer 6
  drawingHelp:   "Each numbered balloon marks one check on a mock-up of your current home page. Select a balloon to jump to that check.",   // [Nova]
  swipeHint:     "Swipe sideways to see the whole page →",  // [Nova]
  whyLabel:      "Why it matters",                               // [Nova]
  caseStudiesWhy:"Buyers want proof you’ve done a job like theirs. Case studies and testimonials give them that before they pick up the phone.",   // [Maya] steer 9
  failHead:      "Found",                                        // steer 8; v4.6 "Fail" -> "Found" (Edie HOLD 1: one verdict per check)
  fixHead:       "Fix",
  costHead:      "UK market rate",                               // [Maya] v4.2 §6 (Nathan 18:10)
  costLabel:     "Not 34 Automation’s price.",  // [Maya] v4.2 §6, short per-card label; Quinn cut "UK market rate," (said 3 times per card), 20 Nov
  costLead:      "These are UK market rates for the work, not 34 Automation’s prices.",   // [Maya] v4.4 (accurate-price line removed, Nathan PART 1.4)
  costValPrefix: "UK market rate:",                              // [Maya] v4.2 §6, before each figure
  costPending:   "UK market rate: being sourced",                // [Maya] v4.2 §6
  costPendingNote:"Sourced UK market rate to follow.",            // [Maya] v4.2 §6
  pickBtn:       "Add to fix list",                              // [Maya] v4.4 (was quoteBtn "Get a quote"; planning, not pricing)
  quoteAdded:    "Added to your fix list",                       // [Nova]
  fixHelp:       "Press “Add to fix list” on any check you’d like fixed and it’ll appear here, ready to plan with.",   // [Maya] v4.4
  fixEmpty:      "Nothing added yet.",                           // [Nova]
  addFail:       "Add all Fails",                                 // Leo
  clearList:     "Clear list",
  copyList:      "Copy fix list",                                // Leo
  copied:        "Copied",                                       // [Nova]
  copyEmpty:     "Add a check first, then copy.",                // [Nova]
  copyFallback:  "Select the list below and copy it (Ctrl+C or ⌘C).",   // [Nova]
  /* v4.4 · one invitation to talk about a rebuild (tickText deleted). [Maya] 2026-11-21-hc-v4-4-copy.md §2 */
  talkHead:      "Want a site that’s built to last?",            // [Maya]
  talkBody:      "This Health Check is free, and your fix list is yours to use with whoever you like. If you’d rather start again, 34 Automation does full rebrands and website rebuilds. Talk to us and we’ll go through your full report with you.",   // [Maya]
  talkBtn:       "Talk to us about a rebuild",                   // [Maya]
  talkAria:      "Talk to 34 Automation about a rebrand and website rebuild",   // [Maya]
  talkNote:      "Your fix list and the competitor you’ve named go with it. See our [[privacy notice]].",   // [Maya] link: PRIVACY_URL
  talkNoteSolo:  "Your fix list goes with it. See our [[privacy notice]].",   // [Maya] no-competitor variant + her privacy sentence (Nova joined them)
  talkSent:      "Thanks, that’s come through. We’ll be in touch.",   // [Maya] shown only once capture is on (not yet)
  captureOff:    "Thanks. This prototype can’t send anything yet, so nothing has been sent.",   // [Nova]
  fabLabel:      "Fix list",
  noMatch:       "No checks match these filters.",               // [Nova]
  footerHowTitle:"How this health check works",                  // [Maya]
  footerHow:     "There are 18 checks across nine areas, each scored out of 10, to one decimal place. Below 4 is a Fail, 4 to 5.9 Needs attention, 6 to 7.9 Advisory and 8 or more a Pass. Each area’s score is the average of its checks, shown out of 100, and uses the same bands as your overall score: under 45, 45 to 74, and 75 or more. Your overall score is the total of all 18 scores as a share of 180, shown out of 100 and rounded to a whole number.",   // [Maya] v4.4; v4.8 decimals + area bands [Nova], Quinn/Edie PASS with fixes applied. NB repeats STATUSES thresholds: update both if they change
  footerFixFirst:"“Fix first” sorts the checks from the lowest score up.",   // v1 line
  footerCostsTitle:"About the UK market rates",
  footerCosts:   "Each cost shows the UK market rate for that fix, estimated from published rate surveys and supplier price lists. These aren’t 34 Automation’s prices. They’re there to help you plan.",   // [Maya] v4.4
  costsAsOf:     "UK market rates as of {date}. Every figure is an estimate, tagged EST.",   // [Nova]
  heroCompareBtn:"How you compare ↓",                            // [Nova]
  cmpTitle:      "How you compare",                              // [Nova]
  cmpPassOf:     "{p} of {t} measures passed",                   // [Nova]
  cmpOfMeasured: " {w} of {t} measured",                         // [Nova] v4.6 "1 pass of 10 measured" (Edie)
  cmpPassOne:    "pass", cmpPassMany: "passes",                  // [Nova] v4.6 fills {w}
  cmpYou:        "You",                                          // [Nova] = Maya filled.col.client
  cmpNMNote:     "{k} not compared because a figure couldn’t be taken.",   // [Nova]
  cmpPass:       "Pass", cmpFail: "Fail",                        // [Nova]
  cmpNM:         "Not measured",                                 // [Nova] Ruby's wording (Maya filled.notMeasured)
  cmpBorder:     "Borderline",                                   // [Nova] our own rule, see data notes
  cmpPassLine:   "pass ≤ {v} {u}",                               // [Nova]
  cmpPassFrom:   "passes when a standard is named",              // [Nova]
  cmpLineKey:    "pass line",                                    // [Nova]
  cmpInfoTitle:  "For information, not scored",                  // [Nova]
  cmpInfoShort:  "Info",                                         // [Nova]
  /* v4.1 · client-named competitor slots. [Maya] = maya-copy.md, 20 Nov 2026 (humanized + slop-gated 5/5; Quinn/Edie not yet run) */
  cmpMethodLine: "The competitor you name is checked with you in your full report, not on this page.",   // [Maya] v4.3 method line
  rvKicker:      "Your competitor (optional)",                   // [Maya] v4.3 compare.kicker
  rvHeading:     "Who do you want to be compared with?",      // [Maya] compare.heading
  rvIntro:       "Name one competitor you’d like to be compared with. We check them with you in your full report, so on this page they show as Not measured. Leave it blank and we’ll just benchmark your own site.",   // [Maya] v4.4 ("Optional" kept once, in rvKicker)
  rvSlot1:       "Competitor",                                   // [Maya] v4.4 slot label
  rvNameLabel:   "Company name",                                 // [Maya] field.name.label
  rvNamePh:      "Competitor’s company name",                    // [Maya] field.name.placeholder
  rvUrlLabel:    "Website",                                      // [Maya] field.url.label
  rvUrlPh:       "www.competitor.example",               // [Maya] field.url.placeholder
  rvUrlHelp:     "Use their main website address. We’ll check it with you in your full report.",   // [Maya] field.url.help
  rvErrMissing:  "Add a company name and a website.",            // [Maya] error.missing
  rvErrUrl:      "That website address doesn’t look right. Try something like www.competitor.example",   // [Maya] error.url
  rvEmptySlot:   "No competitor added yet. Add one and they’ll show up here next to your results.",   // [Maya] v4.3 empty.slot
  rvEmptyNone:   "Nothing to add? No problem. Your report still covers every check on your own site.",   // [Maya] empty.none
  rvAdd:         "Add competitor",                               // [Maya] btn.add
  rvSave:        "Save",                                         // [Maya] btn.save
  rvEdit:        "Edit",                                         // [Maya] btn.edit
  rvClear:       "Clear",                                        // [Maya] btn.clear
  rvCancel:      "Cancel",                                       // [Maya] btn.cancel
  rvAriaAdd:     "Add competitor",                               // [Maya] v4.3 aria.add ({n} dropped)
  rvAriaEdit:    "Edit {name}",                                  // [Maya] aria.edit
  rvAriaClear:   "Clear {name}",                                 // [Maya] aria.clear
  rvCaption:     "You vs {name}, same checks",                   // [Maya] filled.caption / sample.caption
  rvAhead:       "You’re ahead",                                 // [Maya] filled.ahead
  rvBehind:      "They’re ahead",                                // [Maya] filled.behind
  rvLevel:       "Level",                                        // [Maya] filled.level
  rvSummary:     "You’re ahead on {n} of {total} checks.",       // [Maya] filled.summary
  rvSampleBadge: "Sample",                                       // [Maya] sample.badge
  rvSampleMark:  "Illustrative: sample firm and scores",         // [Maya] sample.marker
  rvSampleSlot:  "Illustrative: sample firm and scores. Measured here to show how it looks; a competitor you name shows as Not measured until your full report.",   // [Nova] v4.6 (Edie: rvIntro vs sample)
  cmpOutTitle:   "Measured from outside",                        // [Nova]
  cmpOutHelp:    "Each has a fixed, repeatable test, so these are compared.",   // [Nova]
  cmpPartTitle:  "Partly measurable",                            // [Nova]
  cmpPartHelp:   "Only part of each can be tested without judgement, so these are shown or noted but not scored. The exception is whether a certificate is mentioned (check 13), which is scored.",   // [Nova]
  cmpInTitle:    "Not compared",                                 // [Nova] v4.6 (was "Can’t be measured from outside"; now also holds checks 17-18)
  cmpInHelp:     "Two come down to opinion, and the two AI readiness checks aren’t in the comparison yet, so these four aren’t compared.",   // [Nova] v4.6; v4.8 Quinn/Edie wording
  cmpTable:      "All figures, with dates and times",            // [Nova]
  cmpMeasure:    "Measure",                                      // [Nova]
  cmpRuns:       "runs",                                         // [Nova]
  /* v4.4 · AI readiness area. [Maya] run 2 (humanized + slop-gated 5/5; Edie not run) */
  aiBlurb:       "Whether your site can run chat, WhatsApp or online booking, and whether it already does.",   // [Maya] under the area heading
  fictional:     "Illustrative example · fictional client",  // Leo
  prototype:     "Prototype · not yet reviewed for publication",
  /* [v5] new for live reports. Not yet through Maya, Edie or Quinn. */
  v5SpecTag:     "Automatic health check",
  v5FixNone:     "Nothing to fix here.",
  v5FixNM:       "Nothing to plan until it’s been checked.",
  v5FixPro:      "A marketing specialist scores this in the full report.",
  v5WordPro:     "Full report only",
  v5CostNone:    "No cost. This check passes.",
  v5CostNM:      "No figure yet.",
  v5Measured:    "Measured automatically · {date} · {n} read",
  v5Auto:        "Automatic report · scoring rules awaiting review",
  v5AutoHow:     "This report was produced automatically, from outside your site. Checks marked Not measured are left out of the area scores and the overall score, and never count as a Fail."
};
var FULL = REPORT && REPORT.full;   /* v5.2 · the paid full report: a designer's review laid over the automatic report */
if (REPORT){
  var hcPages = (REPORT.sources || {}).pages || 1;
  COPY.specTag = COPY.v5SpecTag;
  COPY.fictional = COPY.v5Measured.replace('{date}', CLIENT.tested).replace('{n}', hcPages + (hcPages === 1 ? ' page' : ' pages'));
  COPY.prototype = COPY.v5Auto;
  if (FULL){
    COPY.specTag = 'Full report';
    COPY.fictional = 'Reviewed by a 34 Automation marketing specialist' + (FULL.delivered_at ? ' · ' + hcWhen(FULL.delivered_at) : '');
    COPY.prototype = 'Full report';
  }
}

var CATS = [
  {id:'first',   name:'First impression', cc:'var(--c-first)'},
  {id:'clarity', name:'Clarity of offer', cc:'var(--c-clarity)'},
  {id:'tech',    name:'Technical detail', cc:'var(--c-tech)'},
  {id:'mobile',  name:'Mobile',           cc:'var(--c-mobile)'},
  {id:'speed',   name:'Speed',            cc:'var(--c-speed)'},
  {id:'enquiry', name:'Enquiry path',     cc:'var(--c-enquiry)'},
  {id:'trust',   name:'Trust signals',    cc:'var(--c-trust)'},
  {id:'seo',     name:'SEO basics',       cc:'var(--c-seo)'},
  {id:'ai',      name:'AI readiness',     cc:'var(--c-ai)', blurb: COPY.aiBlurb}   /* v4.4 · 9th area [Maya] */
];
var CAT_HEX = ['#FF6B4A','#FF9F1C','#F5C200','#6CC04A','#14B3A6','#3B8BEB','#8B5CF6','#7CD4F5','#C2E812'];   /* backdrop B still cycles the first 8 */
/* "finding" lines kept as data (unused on cards since steer 9); "flaw" text shows under the Found heading (v4.6). */
var M = [
 {id:'hero-photo', cat:'first', name:'Hero photo', raw:5.3, flaw:'Washed-out stock hero photo', fix:'A half-day professional shoot of your real parts and shop floor', finding:'The first thing visitors see is a pale stock image that could belong to any business.', b:[700,252], t:[770,322]},
 {id:'headline', cat:'first', name:'Home page headline', raw:3.1, flaw:'“Welcome to our website!” headline', fix:'Rewrite the home page headline and intro', finding:'The headline says nothing about what Vellmoor makes, for whom, or in what batch sizes.', b:[20,256], t:[92,256]},
 {id:'offer-structure', cat:'clarity', name:'Offer structure', raw:4.8, flaw:'19 processes, no sectors or batch sizes', fix:'Restructure services into 3 core capabilities, plus sector pages (copy and page build)', finding:'Buyers have to work out from a list of 19 processes whether Vellmoor fits their part.', b:[668,150], t:[550,158]},
 {id:'spec-page', cat:'tech', name:'Spec page', raw:3.4, flaw:'No tolerances, materials or capacity', fix:'One capability and spec page an engineer can quote from (technical copy)', finding:'An engineer cannot find tolerances, materials or capacity, so cannot shortlist Vellmoor from the site.', b:[302,484], t:[206,512]},
 {id:'machine-list', cat:'tech', name:'Machine list', raw:7.2, flaw:'Machine list last updated in 2019', fix:'Update the machine list (content edit)', finding:'The equipment list exists but is dated 2019, which invites questions about what is on the floor now.', b:[592,484], t:[490,511]},
 {id:'tap-to-call', cat:'mobile', name:'Tap to call', raw:6.0, flaw:'Phone number can’t be tapped to call', fix:'Tap-to-call links and a sticky quote button (front-end fix)', finding:'On a phone the number is plain text, so a buyer has to copy it to call.', b:[946,164], t:[878,162]},
 {id:'responsive', cat:'mobile', name:'Phone layout', raw:3.0, flaw:'Layout breaks on phones', fix:'Responsive theme fix, or rebuild of key templates', finding:'At phone width the menu and tables run off the side of the screen.', b:[1062,232], t:[1077,303]},
 {id:'image-weight', cat:'speed', name:'Page weight', raw:5.0, flaw:'9.6 MB home page', fix:'Compress and resize images, switch to modern formats, add lazy loading', finding:'The home page downloads 9.6 MB, most of it oversized photos.', b:[862,280], t:[843,244]},
 {id:'hosting', cat:'speed', name:'Server speed', raw:5.0, flaw:'7.8 s to main content', fix:'Move to quality managed hosting, plus caching/CDN', finding:'Main content takes 7.8 s to appear on a phone, and the server takes 1.9 s to respond.', b:[836,103], t:[802,103]},
 {id:'quote-form', cat:'enquiry', name:'Quote form', raw:3.4, flaw:'Only a “Click here to email us” link, no drawing upload', fix:'Quote form with drawing upload', finding:'The only route to a quote is an email link, with no way to attach a drawing.', b:[340,311], t:[291,311]},
 {id:'reply-promise', cat:'enquiry', name:'Reply promise', raw:4.2, flaw:'No reply-time promise or confirmation', fix:'Automatic confirmation email and a line saying when you’ll reply', finding:'After an enquiry there is no confirmation and no idea when a reply will come.', b:[706,642], t:[676,591]},
 {id:'case-studies', cat:'trust', name:'Case studies', raw:1.6, flaw:'No case studies', fix:'2–3 written case studies', finding:'There are no examples of past work, so the capability claims have nothing behind them.', b:[866,488], t:[824,441]},
 {id:'certs', cat:'trust', name:'Certificates', raw:6.6, flaw:'ISO 9001 mentioned, certificate not linked', fix:'Show or link the certificate and accreditations', finding:'ISO 9001 is mentioned on the home page, but the certificate is not shown or linked.', b:[248,548], t:[216,552]},
 {id:'titles-meta', cat:'seo', name:'Page titles', raw:3.0, flaw:'Every page titled “Home | Vellmoor”', fix:'A unique title and meta description for each page', finding:'Every page has the same title, so search results and browser tabs all read “Home | Vellmoor”.', b:[466,26], t:[432,62]},
 {id:'local-listing', cat:'seo', name:'Local listing', raw:6.0, flaw:'Incomplete Google Business Profile', fix:'Complete and optimise the Google Business Profile', finding:'The local business listing is missing opening hours, photos and services.', b:[470,642], t:[468,597]},
 {id:'security-https', cat:'seo', name:'HTTPS security', raw:5.0, flaw:'“Not secure” warnings: no HTTPS, mixed content', fix:'Install an SSL certificate and fix mixed content', finding:'Browsers flag the site as “Not secure” and some pages load insecure content.', b:[20,104], t:[78,104]},
 /* v4.4 · AI readiness (Ruby 2026-11-21-hc-ai-readiness.md; copy [Maya] run 2). Scores 3 and 2 are SAMPLES for the fictional
    Vellmoor, like every score here. look / pass / failLine / nm kept as data (method notes; not shown on cards, like "finding"). */
 {id:'platform-ready', cat:'ai', name:"Ready for today’s tools", raw:3.2, flaw:'Drupal 7, out of security support since January 2025', fix:"Move to a current, supported platform (usually part of a rebuild)", finding:"It runs on Drupal 7, which lost security support in January 2025. The theme hasn’t changed since 2013 and no outside scripts load.",
  look:"We look at what the site’s built on, whether that platform still gets security updates, whether outside scripts already load, and when it was last looked after.",
  pass:"Pass: a supported platform that already runs outside scripts and has been updated in the last 12 months.",
  failLine:"Fail: the platform’s out of security support, or it’s a hand-built site nobody has touched in years.",
  nm:"We couldn’t tell what the site’s built on, so this one’s Not measured. It doesn’t count as a Fail.",
  lockNote:"Whether an agency has the site locked down can’t be seen from outside. We check that with you in your full report.",
  b:[556,644], t:[565,606]},
 {id:'tools-in-use', cat:'ai', name:'Chat and booking', raw:2.2, flaw:'No chat, WhatsApp or booking', fix:'Add WhatsApp chat, online booking or an AI chat assistant', finding:'There’s no chat, WhatsApp or booking. Buyers get a phone number and a “Click here to email us” link, and that’s it.',
  look:"We look at the home page on a desktop and a phone for chat, WhatsApp or booking that works. We open any widget but don’t send anything.",
  pass:"Pass: working chat, WhatsApp or online booking, on desktop and phone.",
  failLine:"Fail: phone and email are the only ways in.",
  runNote:"Set-up only. Running costs are extra and billed in US dollars.",
  b:[962,594], t:[904,593]}
];
/* one-line "why it matters" notes under a check title (steer 9: case studies only) */
/* v4.8 · each check holds a one-decimal SAMPLE score "raw" (0-10). It drives
   status, tally, Fails and verdict, and is shown to one decimal. Area and overall scores average it, so they needn't land on
   multiples of 5. */
if (REPORT) M.forEach(function(m){
  var c = (REPORT.checks || {})[m.id] || {};
  m.raw = (typeof c.score === 'number' && isFinite(c.score)) ? c.score : null;
  m.flaw = c.flaw || NM.label; m.finding = c.finding || '';
  m.nmWhy = m.raw == null ? (c.nm || c.finding || '') : '';
  m.lockNote = c.note || (m.id === 'platform-ready' ? m.lockNote : '');
  m.pro = c.basis === 'specialist';   /* v5.3 · scored by a marketing specialist in the full report only */   /* v5.2 · e.g. "Scored on resolution only" */
});
M.forEach(function(m){ m.score = m.raw; });   /* v4.8 · score = raw, shown with f1() */
var WHY = {'case-studies': COPY.caseStudiesWhy};

M.forEach(function(m,i){m.n=i+1;});
var byId = {}; M.forEach(function(m){byId[m.id]=m;});
var catById = {}; CATS.forEach(function(c){catById[c.id]=c;});
var stById = {}; STATUSES.forEach(function(s){stById[s.k]=s;}); stById.nm = NM;
/* v5 · measured checks only feed the totals; the Not measured status is listed only when a report has one */
var MEAS = M.filter(function(m){ return typeof m.raw === 'number'; });
var SHOWN = MEAS.length < M.length ? STATUSES.concat([NM]) : STATUSES;

/* ---------- cost data: the ONE source (unchanged from v1) ---------- */
var COSTS = {};
try { COSTS = JSON.parse(document.getElementById('costs').textContent) || {}; } catch(e){ COSTS = {}; console.warn('costs block unreadable'); }
COSTS.metrics = COSTS.metrics || {};
var state = { cat:'all', status:'all', sort:'area', picks:{} };

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function gbp(n){ return '£' + Math.round(n).toLocaleString('en-GB'); }
function safeUrl(u){ return /^https?:\/\//i.test(u||'') ? u : ''; }
/* v4.8 · half-open bands so one-decimal scores fit: a status runs from its min up to (not including) the next status's min.
   Same result as before for whole numbers. */
function statusOf(score){ if (typeof score !== 'number' || !isFinite(score)) return NM; for (var i=STATUSES.length-1;i>=0;i--){ if (score >= STATUSES[i].min) return STATUSES[i]; } return STATUSES[0]; }
function f1(x){ return (+x).toFixed(1); }   /* v4.8 · check scores to one decimal */
/* v4.2 · "Repair or replace?" verdict (Ruby, 2026-11-20-hc-verdict-rule.md; Leo's decision: three states).
   Counts Fails (STATUSES 'fail', 0-3) among measured checks. Replace: 3/4 or more fail (v4.4: 14+ of 18; was 12+ of 16).
   Repair: 1/4 or fewer fail (4 or fewer of 18; was 4 or fewer of 16). Otherwise 'mid' (Close call).
   v4.5: floorIfFail {checkId: minVerdict}: a Fail on that check lifts the verdict to at least minVerdict, never higher
   (Nathan, 21 Nov: platform-ready Fail => at least Close call; it never forces Replace). Called without ids = count rule only.
   Non-numbers ("Not measured") are skipped, never counted as Fails. The footer rule line is built from the same constants. */
var VERDICT_RULE = {of:4, repairMax:1, replaceMin:3, floorIfFail:{'platform-ready':'mid'}};
var VERDICT_RANK = {repair:0, mid:1, replace:2};
function verdictOf(scores, ids){
  var v = verdictCount(scores);
  if (v && ids) ids.forEach(function(id, i){
    var f = VERDICT_RULE.floorIfFail[id], x = scores[i];
    if (f && typeof x === 'number' && isFinite(x) && statusOf(x).k === 'fail' && VERDICT_RANK[f] > VERDICT_RANK[v]) v = f;
  });
  return v;
}
function verdictCount(scores){
  var measured = scores.filter(function(x){ return typeof x === 'number' && isFinite(x); });
  if (!measured.length) return null;
  var fails = measured.filter(function(x){ return statusOf(x).k === 'fail'; }).length;
  if (fails * VERDICT_RULE.of >= measured.length * VERDICT_RULE.replaceMin) return 'replace';
  if (fails * VERDICT_RULE.of <= measured.length * VERDICT_RULE.repairMax) return 'repair';
  return 'mid';
}
var VERDICT_UI = {repair:{copy:'verdictRepair', st:'pass'}, mid:{copy:'verdictMid', st:'advisory'}, replace:{copy:'verdictReplace', st:'fail'}};
/* escape everything, then turn **…** into bold */
function boldMd(t){ return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
var PRIVACY_URL = 'https://34automation.co.uk/privacy/#health-check';
function band(t){ return t<45?{w:'Losing customers',c:'#D7263D',bg:'#FFE1E4'}:t<75?{w:'Needs attention',c:'#F2B705',bg:'#FFF0C2'}:{w:'Pass',c:'#1E8E3E',bg:'#DDF3E2'}; }   /* v4.8 clear green (was teal #1B998B); also on the dial ring/key and area bars */
function marketOf(id){ var e = COSTS.metrics[id]; return e && e.market ? e.market : null; }
function hasRange(c){ return c && typeof c.low === 'number' && typeof c.high === 'number'; }
function rangeTxt(c){ return c.low === c.high ? gbp(c.low) : gbp(c.low) + '–' + gbp(c.high); }
function pad2(n){ return (n<10?'0':'') + n; }
function longDate(iso){ var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||''); if(!p) return iso||''; var mo=['January','February','March','April','May','June','July','August','September','October','November','December']; return (+p[3]) + ' ' + mo[+p[2]-1] + ' ' + p[1]; }

/* ---------- fill COPY slots ---------- */
document.querySelectorAll('[data-copy]').forEach(function(el){ var k = el.getAttribute('data-copy'); if (COPY[k] != null) el.textContent = COPY[k]; });
try { document.title = COPY.bannerTitle + ' · ' + CLIENT.name + (REPORT ? '' : ' (sample)'); } catch(e){}

/* ---------- client details + count line ---------- */
$('client').innerHTML = [[COPY.clientLabel, CLIENT.name],[COPY.siteLabel, CLIENT.site],[COPY.testedLabel, CLIENT.tested]]
  .map(function(r){ return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>'; }).join('');
$('spec').innerHTML = '<span class="spec-n"><b>'+M.length+'</b><span>'+esc(COPY.specChecks)+'</span></span>'
  + '<span class="spec-n"><b>'+CATS.length+'</b><span>'+esc(COPY.specAreas)+'</span></span>'
  + '<span class="spec-tag">'+esc(COPY.specTag)+'</span>';

/* ---------- icons ---------- */
var IC = {
  flaw:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 23 21H1z" fill="#D7263D"/><path d="M12 9v5M12 17v.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  fix:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#3B8BEB"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cost:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#C9A24C"/><text x="12" y="17" text-anchor="middle" font-family="Arial" font-weight="700" font-size="14" fill="#0E0F11">£</text></svg>',
  arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h15M13 6l6 6-6 6" stroke="#0E0F11" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
/* before / after mini illustrations per area */
var BA = {
  first:['<rect x="4" y="6" width="54" height="28" rx="3" fill="#E1E5E9"/><circle cx="22" cy="20" r="6" fill="#C9CED4"/><circle cx="38" cy="20" r="6" fill="#C9CED4"/>',
         '<rect x="4" y="6" width="54" height="28" rx="3" fill="#0E0F11"/><circle cx="31" cy="20" r="9" fill="none" stroke="#FF9F1C" stroke-width="4" stroke-dasharray="4 3"/><circle cx="31" cy="20" r="3" fill="#C9A24C"/>'],
  clarity:['<g stroke="#9AA1A9" stroke-width="2">'+[8,13,18,23,28,33].map(function(y){return '<path d="M6 '+y+'h50"/>';}).join('')+'</g>',
           '<rect x="4" y="8" width="16" height="24" rx="3" fill="#FF6B4A"/><rect x="23" y="8" width="16" height="24" rx="3" fill="#FF9F1C"/><rect x="42" y="8" width="16" height="24" rx="3" fill="#F5C200"/>'],
  tech:['<rect x="6" y="5" width="50" height="30" rx="2" fill="none" stroke="#9AA1A9" stroke-width="2"/><text x="31" y="27" text-anchor="middle" font-size="18" font-weight="700" fill="#D7263D">?</text>',
        '<rect x="6" y="5" width="50" height="30" rx="2" fill="#fff" stroke="#0E0F11" stroke-width="2"/><path d="M6 15h50M6 25h50M26 5v30" stroke="#0E0F11" stroke-width="1.4"/><text x="40" y="13" font-size="7" text-anchor="middle" font-family="monospace">±0.01</text><text x="40" y="23" font-size="7" text-anchor="middle" font-family="monospace">316L</text>'],
  mobile:['<rect x="22" y="3" width="18" height="34" rx="4" fill="#fff" stroke="#9AA1A9" stroke-width="2"/><rect x="25" y="10" width="30" height="6" fill="#D7263D" opacity=".7"/>',
          '<rect x="22" y="3" width="18" height="34" rx="4" fill="#fff" stroke="#0E0F11" stroke-width="2"/><rect x="25" y="9" width="12" height="5" rx="1" fill="#6CC04A"/><rect x="25" y="16" width="12" height="5" rx="1" fill="#6CC04A"/><rect x="25" y="26" width="12" height="6" rx="3" fill="#C9A24C"/>'],
  speed:['<rect x="6" y="16" width="50" height="9" rx="4.5" fill="#E6E3DB"/><rect x="6" y="16" width="12" height="9" rx="4.5" fill="#D7263D"/>',
         '<rect x="6" y="16" width="50" height="9" rx="4.5" fill="#14B3A6"/><path d="M32 6l-6 12h6l-3 14 9-17h-6l3-9z" fill="#0E0F11"/>'],
  enquiry:['<rect x="14" y="10" width="34" height="22" rx="2" fill="#fff" stroke="#9AA1A9" stroke-width="2"/><path d="M14 12l17 11 17-11" fill="none" stroke="#9AA1A9" stroke-width="2"/>',
           '<rect x="10" y="4" width="42" height="32" rx="3" fill="#fff" stroke="#0E0F11" stroke-width="2"/><path d="M15 11h24M15 17h24" stroke="#3B8BEB" stroke-width="3"/><path d="M31 32V23M27 26l4-4 4 4" stroke="#0E0F11" stroke-width="2" fill="none"/>'],
  trust:['<rect x="16" y="6" width="30" height="28" rx="2" fill="none" stroke="#9AA1A9" stroke-width="2" stroke-dasharray="4 3"/>',
         '<circle cx="31" cy="17" r="11" fill="#8B5CF6"/><path d="M24 26l-3 10 6-3 4 4 0-9M38 26l3 10-6-3-4 4" fill="#8B5CF6"/><path d="M26 17l3.5 3.5L36 14" stroke="#fff" stroke-width="2.6" fill="none"/>'],
  seo:['<rect x="4" y="10" width="17" height="9" rx="2" fill="#E1E5E9"/><rect x="23" y="10" width="17" height="9" rx="2" fill="#E1E5E9"/><rect x="42" y="10" width="17" height="9" rx="2" fill="#E1E5E9"/>',
       '<rect x="4" y="10" width="17" height="9" rx="2" fill="#2A9FD0"/><rect x="23" y="10" width="17" height="9" rx="2" fill="#FF9F1C"/><rect x="42" y="10" width="17" height="9" rx="2" fill="#3B8BEB"/><path d="M31 24c-4 0-6 3-6 5 0 4 6 9 6 9s6-5 6-9c0-2-2-5-6-5z" fill="#0E0F11"/>'],
  /* v4.4 · AI readiness: a dead, dashed chat bubble -> a live chat bubble and a booked slot */
  ai:['<path d="M10 7h30a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H22l-8 7v-7h-4a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3z" fill="none" stroke="#9AA1A9" stroke-width="2" stroke-dasharray="4 3"/><path d="M47 30 L57 12" stroke="#D7263D" stroke-width="2.6" stroke-linecap="round"/>',
      '<path d="M7 6h26a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H18l-7 6v-6H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="#C2E812" stroke="#0E0F11" stroke-width="2" stroke-linejoin="round"/><circle cx="13" cy="15" r="2" fill="#0E0F11"/><circle cx="20" cy="15" r="2" fill="#0E0F11"/><circle cx="27" cy="15" r="2" fill="#0E0F11"/><rect x="40" y="12" width="18" height="18" rx="2" fill="#fff" stroke="#0E0F11" stroke-width="2"/><path d="M40 18h18" stroke="#0E0F11" stroke-width="2"/><path d="M45 23.5l2.5 2.5 5-5" stroke="#0E0F11" stroke-width="2" fill="none" stroke-linecap="round"/>']
};
function baSvg(cat){
  var p = BA[cat];
  return '<div class="ba" aria-hidden="true"><span>Now</span><svg viewBox="0 0 62 40">'+p[0]+'</svg><span>→</span><svg viewBox="0 0 62 40">'+p[1]+'</svg><span>Fixed</span></div>';
}

/* ---------- totals ---------- */
var sum = MEAS.reduce(function(a,m){return a+m.raw;},0);   /* v4.8 raw */
var total = MEAS.length ? Math.round(sum/(MEAS.length*10)*100) : 0;
var B = band(total);
function catScore(cid){
  var ms = MEAS.filter(function(m){return m.cat===cid;}); if (!ms.length) return null;   /* v5 · null = nothing measured in this area */
  var s = ms.reduce(function(a,m){return a+m.raw;},0);   /* v4.8 raw */
  return Math.round(s/(ms.length*10)*100);
}

/* ---------- dial ---------- */
(function dial(){
  var arc = $('dialArc'), num = $('dialNum');
  arc.setAttribute('stroke', B.c);
  var bl = $('bandLabel');
  bl.textContent = B.w; bl.style.background = B.bg;
  document.querySelector('.dial svg title').textContent = 'Overall score ' + total + ' out of 100: ' + B.w;
  var target = total*0.75;
  if (reduce){ arc.setAttribute('stroke-dasharray', target+' 100'); num.textContent = total; return; }
  var t0 = null, D = 1400;
  function step(ts){ if(!t0) t0 = ts; var p = Math.min(1,(ts-t0)/D); var e = 1-Math.pow(1-p,3);
    arc.setAttribute('stroke-dasharray', (target*e).toFixed(2)+' 100'); num.textContent = Math.round(total*e);
    if (p<1) requestAnimationFrame(step); }
  setTimeout(function(){ requestAnimationFrame(step); }, 250);
})();

/* tally, in STATUSES order */
function countBy(k){ return M.filter(function(m){ return statusOf(m.score).k === k; }).length; }
if (SHOWN.length > STATUSES.length) $('tally').classList.add('nm5');
$('tally').innerHTML = SHOWN.map(function(s){ return '<div style="background:'+s.tint+'"><b>'+countBy(s.k)+'</b>'+esc(s.label)+'</div>'; }).join('');

/* ---------- v4.2 · verdict by the score (computed, never hard-coded) + footer rule line ---------- */
(function(){
  var sc = M.map(function(m){ return m.score; }), box = $('verdict'), v = verdictOf(sc, M.map(function(m){ return m.id; }));
  if (!v){ box.classList.add('hidden'); return; }
  var ui = VERDICT_UI[v], s = stById[ui.st];
  box.setAttribute('data-verdict', v);
  box.style.setProperty('--vc', s.c); box.style.setProperty('--vt', s.tint);
  $('verdictSay').innerHTML = boldMd(COPY[ui.copy]) + (v !== verdictOf(sc) ? ' ' + esc(COPY.verdictFloor) : '');   /* v4.5 · note only when the floor applied */
  var vb = $('verdictBelief');   /* v4.8 · v4.7 slot */
  if (COPY.verdictBelief){ vb.innerHTML = boldMd(COPY.verdictBelief); vb.hidden = false; } else { vb.textContent = ''; vb.hidden = true; }
  var n = MEAS.length;
  var rule = COPY.footerVerdictRule
    .replace('{repair}', Math.floor(n * VERDICT_RULE.repairMax / VERDICT_RULE.of))
    .replace('{replace}', Math.ceil(n * VERDICT_RULE.replaceMin / VERDICT_RULE.of));
  $('footVerdict').textContent = COPY.footerVerdict.replace('{RULE}', rule) + ' ' + COPY.verdictFloor;   /* v4.5 */
})();
$('rvPrivacy').innerHTML = esc(COPY.rvPrivacy).replace(/\[\[(.+?)\]\]/, '<a href="'+esc(PRIVACY_URL)+'" target="_blank" rel="noopener">$1</a>');

/* ---------- category tiles + area chips + status chips ---------- */
(function(){
  var g = $('catgrid'), ch = $('chips'), sc = $('schips');
  g.innerHTML = CATS.map(function(c){
    var s = catScore(c.id), cb = s == null ? {w: NM.label, c: NM.c, bg: NM.tint} : band(s);   /* v4.8 · bar + label follow the dial's bands; icon keeps --cc */
    return '<button type="button" class="catbtn" data-cat="'+c.id+'" data-score="'+s+'" data-band="'+esc(cb.w)+'" aria-pressed="false" style="--cc:'+c.cc+';--bc:'+cb.c+'">'
      + '<span class="dot" aria-hidden="true"><svg viewBox="0 0 62 40" width="22" height="16">'+BA[c.id][1]+'</svg></span>'
      + '<span class="nm">'+esc(c.name)+'</span><span class="bar"><i data-w="'+(s == null ? 0 : s)+'"></i></span><span class="sc">'+(s == null ? esc(cb.w) : s+' / 100 · '+esc(cb.w))+'</span></button>';
  }).join('');
  ch.innerHTML = '<button type="button" class="chip" data-cat="all" aria-pressed="true">All '+M.length+'</button>' + CATS.map(function(c){
    return '<button type="button" class="chip" data-cat="'+c.id+'" aria-pressed="false" style="--cc:'+c.cc+'"><i aria-hidden="true"></i>'+esc(c.name)+'</button>';
  }).join('');
  sc.innerHTML = '<button type="button" class="chip" data-status="all" aria-pressed="true">All</button>' + SHOWN.map(function(s){
    return '<button type="button" class="chip" data-status="'+s.k+'" aria-pressed="false" style="--cc:'+s.c+'"><i aria-hidden="true"></i>'+esc(s.label)+' <span class="cnt">'+countBy(s.k)+'</span></button>';
  }).join('');
  requestAnimationFrame(function(){ setTimeout(function(){ g.querySelectorAll('.bar i').forEach(function(i){ i.style.width = i.getAttribute('data-w')+'%'; }); }, 200); });
  g.addEventListener('click', function(e){ var b = e.target.closest('.catbtn'); if(!b) return; var c = b.getAttribute('data-cat'); setCat(state.cat===c?'all':c); $('toolbar').scrollIntoView({behavior: reduce?'auto':'smooth'}); });
  ch.addEventListener('click', function(e){ var b = e.target.closest('.chip'); if(b) setCat(b.getAttribute('data-cat')); });
  sc.addEventListener('click', function(e){ var b = e.target.closest('.chip'); if(b) setStatus(b.getAttribute('data-status')); });
})();
function setCat(c){
  state.cat = c;
  document.querySelectorAll('#chips .chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-cat')===c)); });
  document.querySelectorAll('.catbtn').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-cat')===c)); });
  render();
}
function setStatus(k){
  state.status = k;
  document.querySelectorAll('#schips .chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-status')===k)); });
  render();
}

/* ---------- balloons ---------- */
(function(){
  var g = $('balloons'), tip = $('dtip'), sheet = $('sheet'), html = '';
  M.forEach(function(m){
    var s = statusOf(m.score), bx=m.b[0], by=m.b[1], tx=m.t[0], ty=m.t[1];
    html += '<a class="balloon-g" href="#m-'+m.id+'" data-id="'+m.id+'" aria-label="Balloon '+m.n+': '+esc(m.name)+', '+f1(m.score)+' out of 10, '+esc(s.label)+'">'
      + '<path d="M'+bx+' '+by+' L'+tx+' '+ty+'" stroke="#0E0F11" stroke-width="1.6" fill="none"/>'
      + '<circle cx="'+tx+'" cy="'+ty+'" r="3.5" fill="#0E0F11"/>'
      + '<circle class="halo" cx="'+bx+'" cy="'+by+'" r="24" fill="none" stroke="#0E0F11" stroke-width="3"/>'
      + (s.k==='fail' ? '<circle class="pulse" cx="'+bx+'" cy="'+by+'" r="17" fill="'+s.c+'"/>' : '')
      + '<circle class="b" cx="'+bx+'" cy="'+by+'" r="17" fill="'+s.c+'" stroke="#0E0F11" stroke-width="2.5"/>'
      + '<text x="'+bx+'" y="'+(by+5)+'" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="700" font-size="15" fill="'+s.ink+'">'+m.n+'</text></a>';
  });
  g.innerHTML = html;
  var bk = $('bkey');
  bk.innerHTML = M.map(function(m){ var s = statusOf(m.score); return '<li><a href="#m-'+m.id+'" data-id="'+m.id+'"><b style="background:'+s.c+';color:'+s.ink+'">'+m.n+'</b>'+esc(m.name)+'<span class="sr">, '+f1(m.score)+' out of 10, '+esc(s.label)+'</span></a></li>'; }).join('');
  bk.addEventListener('click', function(e){ var a = e.target.closest('a'); if(!a) return; e.preventDefault(); goTo(a.getAttribute('data-id')); });
  function show(a){
    var m = byId[a.getAttribute('data-id')], s = statusOf(m.score);
    tip.innerHTML = '<b>'+m.n+' · '+esc(m.name)+'</b> · '+f1(m.score)+'/10 '+esc(s.label)+'<br>'+esc(m.flaw);
    var r = a.querySelector('circle.b').getBoundingClientRect(), sr = sheet.getBoundingClientRect();
    var x = r.left - sr.left + r.width/2, y = r.top - sr.top;
    tip.classList.add('on');
    var w = tip.offsetWidth; x = Math.max(8, Math.min(sr.width - w - 8, x - w/2));
    var top = y - tip.offsetHeight - 10; if (top < 4) top = y + r.height + 10;
    tip.style.left = x+'px'; tip.style.top = top+'px';
  }
  function hide(){ tip.classList.remove('on'); }
  g.querySelectorAll('a').forEach(function(a){
    a.addEventListener('mouseenter', function(){show(a);}); a.addEventListener('mouseleave', hide);
    a.addEventListener('focus', function(){show(a);}); a.addEventListener('blur', hide);
    a.addEventListener('click', function(e){ e.preventDefault(); hide(); goTo(a.getAttribute('data-id')); });
  });
  $('sheetScroll').addEventListener('scroll', hide, {passive:true});
})();
function goTo(id){
  var m = byId[id];
  var needCat = state.cat !== 'all' && state.cat !== m.cat;
  var needSt = state.status !== 'all' && state.status !== statusOf(m.score).k;
  if (needSt){ state.status = 'all'; document.querySelectorAll('#schips .chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-status')==='all')); }); }
  if (needCat) setCat('all'); else if (needSt) render();
  var el = $('m-'+id); if (!el) return;
  el.scrollIntoView({behavior: reduce?'auto':'smooth', block:'start'});
  el.classList.add('flash'); setTimeout(function(){el.classList.remove('flash');}, 1600);
  var h = el.querySelector('h3'); h.setAttribute('tabindex','-1'); h.focus({preventScroll:true});
  try { history.replaceState(null,'','#m-'+id); } catch(e){}
}

/* ---------- cost cell (market only; the "34 price" mode is removed) ---------- */
function costCell(m){
  var c = marketOf(m.id);
  if (!hasRange(c)){
    return '<p class="cval pending">'+esc(COPY.costPending)+' <span class="est">EST</span></p><p class="cbasis">'+esc(COPY.costPendingNote)+'</p>' + srcBlock(c);
  }
  return '<p class="cval"><span class="cpre">'+esc(COPY.costValPrefix)+'</span> <span class="crange">'+rangeTxt(c)+'</span> <span class="est">'+esc(c.status||'EST')+'</span></p>'
    + '<p class="cunit">'+esc(c.unit||'')+'</p>'
    + (m.runNote ? '<p class="cnote">'+esc(m.runNote)+'</p>' : '')   /* v4.4 · [Maya] tools-in-use runNote, under the cost */
    + (c.basis ? '<p class="cbasis">'+esc(c.basis)+'</p>' : '')
    + srcBlock(c);
}
function srcBlock(c){
  var s = (c && c.sources) || [];
  if (!s.length) return '';
  return '<details class="src"><summary>Sources ('+s.length+')</summary><ul>' + s.map(function(x){
    var u = safeUrl(x.url), t = esc(x.title || x.url || 'Source');
    var meta = [x.type, x.date].filter(Boolean).map(esc).join(' · ');
    return '<li>' + (u ? '<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+t+'</a>' : t) + (meta ? ' <span class="cunit">('+meta+')</span>' : '') + '</li>';
  }).join('') + '</ul></details>';
}

/* ---------- card ---------- */
function card(m){
  var c = catById[m.cat], s = statusOf(m.score), meter = '';
  for (var i=1;i<=10;i++) meter += '<i class="'+(i<=m.score?'on':'')+'"></i>';
  return '<article class="metric" id="m-'+m.id+'" style="--cc:'+c.cc+';--hc:'+s.c+'" aria-labelledby="t-'+m.id+'">'
   + '<div class="mhead"><div class="mnum" aria-hidden="true">'+m.n+'</div>'
   + '<div><p class="mcat"><i aria-hidden="true"></i>'+esc(c.name)+' · check '+m.n+'</p><h3 id="t-'+m.id+'">'+esc(m.name)+'</h3>'
   + (WHY[m.id] ? '<p class="why"><b>'+esc(COPY.whyLabel)+'</b>'+esc(WHY[m.id])+'</p>' : '')
   + '</div>'
   + '<div class="score"><span class="pill" style="background:'+s.c+';color:'+s.ink+'">'+(s.k === 'nm' ? '–' : f1(m.score)+'<small>/10</small>')+'</span><span class="word">'+esc(m.pro ? COPY.v5WordPro : s.label)+'</span><span class="meter" aria-hidden="true">'+meter+'</span></div></div>'
   + '<div class="ffc">'
   + '<div class="col flaw"><h4>'+IC.flaw+esc(COPY.failHead)+'</h4><p>'+esc(s.k === 'nm' && m.nmWhy ? m.nmWhy : m.flaw)+'</p></div>'
   + '<div class="arrow" aria-hidden="true">'+IC.arrow+'</div>'
   + '<div class="col fix"><h4>'+IC.fix+esc(COPY.fixHead)+'</h4><p>'+esc(s.k === 'pass' ? COPY.v5FixNone : s.k === 'nm' ? (m.pro ? COPY.v5FixPro : COPY.v5FixNM) : m.fix)+'</p></div>'
   + '<div class="arrow" aria-hidden="true">'+IC.arrow+'</div>'
   + '<div class="col cost"><h4>'+IC.cost+esc(COPY.costHead)+'</h4><p class="clabel">'+esc(COPY.costLabel)+'</p><div class="cbody">'+(s.k === 'pass' || s.k === 'nm' ? '<p class="cval pending">'+esc(s.k === 'pass' ? COPY.v5CostNone : COPY.v5CostNM)+'</p>' : costCell(m))+'</div></div>'
   + '</div>'
   + (m.lockNote ? '<p class="mnote">'+esc(m.lockNote)+'</p>' : '')   /* v4.4 · [Maya] platform-ready lockNote */
   + (s.k === 'pass' || s.k === 'nm' ? '' : '<label class="addfix"><input type="checkbox" data-pick="'+m.id+'"'+(state.picks[m.id]?' checked':'')+'><span class="q-off">'+esc(COPY.pickBtn)+'</span><span class="q-on">'+esc(COPY.quoteAdded)+'</span></label>')
   + '</article>';
}

/* ---------- render list ---------- */
function render(){
  var list = $('list'), out = '';
  var ms = M.filter(function(m){ return (state.cat==='all' || m.cat===state.cat) && (state.status==='all' || statusOf(m.score).k===state.status); });
  if (!ms.length){ list.innerHTML = '<p class="empty-state">'+esc(COPY.noMatch)+'</p>'; return; }
  if (state.sort === 'first'){
    ms = ms.slice().sort(function(a,b){ return (a.score == null) - (b.score == null) || a.score-b.score || a.n-b.n; });   /* v5 · Not measured last */
    out = '<div class="flat"><div class="sec-h"><div><h2>Fix first</h2><p>Lowest scores at the top.</p></div></div>' + ms.map(card).join('') + '</div>';
  } else {
    CATS.forEach(function(c){
      var g = ms.filter(function(m){return m.cat===c.id;}); if (!g.length) return;
      var s = catScore(c.id);
      out += '<section class="group" style="--cc:'+c.cc+'" aria-labelledby="g-'+c.id+'"><div class="ghead"><div><h2 id="g-'+c.id+'">'+esc(c.name)+'</h2><span class="gsc">'+(s == null ? esc(NM.label) : s+' / 100')+' · '+g.length+' check'+(g.length>1?'s':'')+'</span>'+(c.blurb ? '<p class="gblurb">'+esc(c.blurb)+'</p>' : '')+'</div>'+baSvg(c.id)+'</div><div class="gbody">'+g.map(card).join('')+'</div></section>';
    });
  }
  list.innerHTML = out;
}

/* ---------- fix list: names only, no prices, no totals (12) ---------- */
function pickedIds(){ return M.filter(function(m){return state.picks[m.id];}).map(function(m){return m.id;}); }
function renderFix(){
  var ids = pickedIds(), ul = $('flItems');
  ul.innerHTML = ids.length ? ids.map(function(id){ var m = byId[id];
      return '<li><span class="n">#'+m.n+'</span><span>'+esc(m.name)+'</span><button type="button" data-unpick="'+id+'" aria-label="Remove '+esc(m.name)+'">×</button></li>'; }).join('')
    : '<li class="empty">'+esc(COPY.fixEmpty)+'</li>';
  $('fabCount').textContent = ids.length;
  $('fab').classList.toggle('show', ids.length > 0);
  document.body.classList.toggle('fab-on', ids.length > 0);
  if (!ids.length) $('copyFallback').classList.add('hidden');
}

/* ---------- copy fix list (replaces Print) ---------- */
var copyTimer = null;
function say(msg, keep){ var st = $('copyStatus'); st.textContent = msg; clearTimeout(copyTimer); if (!keep) copyTimer = setTimeout(function(){ st.textContent = ''; }, 2600); }
/* v4.2 · the competitor the client typed into the slot (v4.3: one slot; saved slot only; the sample firm is excluded).
   Replaced by the compare section once it has loaded. Held in memory only: no cookies or storage. */
var clientCompetitors = function(){ return []; };
/* v4.2 · ONE enquiry payload. v4.4: sent (once capture is on) by the "Talk to us about a rebuild" buttons; unchanged shape:
   client, website, picks (the fix list) and competitors (at most 1, client-typed; sample firm excluded). */
function enquiryPayload(){
  return {
    client: CLIENT.name,
    website: CLIENT.site,
    picks: pickedIds().map(function(id){ return {id: id, name: byId[id].name}; }),
    competitors: clientCompetitors()
  };
}
function copyFix(){
  var names = pickedIds().map(function(id){ return byId[id].name; });
  var fb = $('copyFallback');
  if (!names.length){ say(COPY.copyEmpty); return; }
  var comps = clientCompetitors();
  var text = names.join('\n') + (comps.length
    ? '\n\n' + COPY.copyCompetitorsHead + '\n' + comps.map(function(c){ return c.name + ' (' + c.website + ')'; }).join('\n')
    : '');
  function ok(){ fb.classList.add('hidden'); say(COPY.copied); }
  function fallback(){
    fb.value = text; fb.rows = Math.min(8, text.split('\n').length + 1); fb.classList.remove('hidden');
    try { fb.focus(); fb.select(); } catch(e){}
    var done = false; try { done = document.execCommand('copy'); } catch(e){ done = false; }
    if (done) ok(); else say(COPY.copyFallback, true);
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  } catch(e){ fallback(); }
}

/* ---------- events ---------- */
$('list').addEventListener('change', function(e){
  var id = e.target.getAttribute('data-pick'); if (!id) return;
  if (e.target.checked) state.picks[id] = true; else delete state.picks[id];
  renderFix();
});
$('flItems').addEventListener('click', function(e){
  var b = e.target.closest('[data-unpick]'); if (!b) return;
  var id = b.getAttribute('data-unpick'); delete state.picks[id];
  var cb = document.querySelector('[data-pick="'+id+'"]'); if (cb) cb.checked = false;
  renderFix();
});
$('addFail').addEventListener('click', function(){
  M.forEach(function(m){ if (statusOf(m.score).k==='fail') state.picks[m.id] = true; });
  render(); renderFix();
});
$('clearFl').addEventListener('click', function(){ state.picks = {}; render(); renderFix(); say(''); });
$('copyFl').addEventListener('click', copyFix);
/* capture waits for privacy section (ticket 23 rule). v4.4: the tick box is gone; ONE invitation, "Talk to us about a rebuild"
   (#talk in the fix-list aside, echoed once in the footer). Both buttons build the same enquiryPayload() (picks AND the
   client-typed competitor), so the competitor travels with it once capture is switched on. Capture stays OFF until the privacy
   notice's #health-check section is live. Until then the payload is built and discarded: no request, no storage. */
var CAPTURE_ON = false;
function linkPrivacy(t){ return esc(t).replace(/\[\[(.+?)\]\]/, '<a href="'+esc(PRIVACY_URL)+'" target="_blank" rel="noopener">$1</a>'); }
/* what travels with the enquiry: fix list, plus the competitor if one has been named (Maya's talkNote) */
function renderTalk(){
  var t = clientCompetitors().length ? COPY.talkNote : COPY.talkNoteSolo;
  document.querySelectorAll('[data-talk-note]').forEach(function(p){ p.innerHTML = linkPrivacy(t); });
}
document.querySelectorAll('[data-talk]').forEach(function(b){
  b.textContent = COPY.talkBtn; b.setAttribute('aria-label', COPY.talkAria);
  b.addEventListener('click', function(){
    var payload = enquiryPayload(); /* built, never sent: capture is off (see above) */
    var n = $(b.getAttribute('data-talk') === 'footer' ? 'footTalkStatus' : 'talkStatus');
    n.textContent = CAPTURE_ON ? COPY.talkSent : COPY.captureOff; n.classList.remove('hidden');
  });
});
document.querySelectorAll('[data-sort]').forEach(function(b){ b.addEventListener('click', function(){
  state.sort = b.getAttribute('data-sort');
  document.querySelectorAll('[data-sort]').forEach(function(x){ x.setAttribute('aria-pressed', String(x===b)); });
  render(); }); });
$('fixFirstBtn').addEventListener('click', function(){
  document.querySelector('[data-sort="first"]').click(); setCat('all');
  $('toolbar').scrollIntoView({behavior: reduce?'auto':'smooth'});
});

/* footer cost notes */
(function(){
  $('costNote').textContent = COPY.costsAsOf.replace('{date}', longDate(COSTS.asOf));
  var r = COSTS.rates || {}, keys = Object.keys(r), ul = $('ratesList');
  if (!keys.length){ $('ratesBox').classList.add('hidden'); return; }
  ul.innerHTML = keys.map(function(k){ var x = r[k];
    var v = (typeof x.low==='number' && typeof x.high==='number') ? rangeTxt(x) + ' ' + esc(x.unit||'') : 'being sourced';
    return '<li>'+esc(x.label||k)+': '+v+' <span class="est">EST</span>'+ srcBlock(x) +'</li>'; }).join('');
})();

/* =====================================================================
   BACKDROPS (14). All inline SVG, no images, no network.
   A · Night inspection  B · Daylight waterfall  C · Gold source view
   ===================================================================== */
var NARROW = window.matchMedia && matchMedia('(max-width: 899px)').matches;
var MONO = 'IBM Plex Mono, ui-monospace, Menlo, Consolas, monospace';

/* B: a page-load waterfall cascading across the hero, plus a loading filmstrip.
   Decorative only: the only figures shown (7.8 s) come from the example data. */
(function buildB(){
  var svg = $('bgB'), film = $('bgBF'); if (!svg || !film) return;
  var files = ['index.html','style.css','fonts.css','jquery.min.js','slider.js','stock-workshop-final2.jpg','logo.png','gallery-01.jpg','gallery-02.jpg','analytics.js','cookie-banner.js','map-embed.js','gallery-03.jpg','icons.svg','machines.pdf','contact.php','footer.css','gallery-04.jpg','favicon.ico','tracking.js'];
  var h = '';
  files.forEach(function(f,i){
    var y = 34 + i*28, x0 = 150 + i*31 + ((i*7)%3)*12, wait = 18 + ((i*29)%46), dur = 60 + ((i*53)%220);
    if (i === 5) dur = 400; /* the hero photo hogs the load */
    var c = CAT_HEX[i%8], d = reduce ? 0 : (i*55);
    h += '<text x="'+(x0-10)+'" y="'+(y+11)+'" text-anchor="end" font-family="'+MONO+'" font-size="11" fill="#4F5358" fill-opacity=".7">'+esc(f)+'</text>'
      + '<rect class="b-bar" x="'+x0+'" y="'+y+'" width="'+wait+'" height="13" rx="4" fill="'+c+'" fill-opacity=".3" style="animation-delay:'+d+'ms"/>'
      + '<rect class="b-bar" x="'+(x0+wait)+'" y="'+y+'" width="'+dur+'" height="13" rx="4" fill="'+c+'" style="animation-delay:'+(d+140)+'ms"/>';
  });
  h += '<g class="b-mile" font-family="'+MONO+'" font-size="12" font-weight="600">'
    + '<path d="M600 2V600" stroke="#3B8BEB" stroke-width="2" stroke-dasharray="6 6"/><rect x="606" y="2" width="92" height="22" rx="4" fill="#3B8BEB"/><text x="614" y="17" fill="#0E0F11">DOM ready</text>'
    + '<path d="M930 2V600" stroke="#D7263D" stroke-width="2.5"/><rect x="812" y="2" width="112" height="22" rx="4" fill="#D7263D"/><text x="820" y="17" fill="#fff">Main content</text></g>';
  svg.innerHTML = h;
  /* filmstrip: the page painting in, frame by frame */
  var f = '<text x="0" y="12" font-family="'+MONO+'" font-size="11" letter-spacing="3" fill="#4F5358">FILMSTRIP · '+esc(CLIENT.site.toUpperCase())+'</text>';
  for (var k=0;k<6;k++){
    var x = k*182, y = 22, w = 150, ht = 88;
    f += '<g><rect x="'+(x+1)+'" y="'+y+'" width="'+w+'" height="'+ht+'" rx="6" fill="#fff" stroke="#0E0F11" stroke-opacity=".3" stroke-width="1.5"/>';
    if (k>=1) f += '<rect x="'+(x+9)+'" y="'+(y+8)+'" width="'+(w-16)+'" height="9" rx="2" fill="#D8DDE2"/>';
    if (k>=2) f += '<rect x="'+(x+13)+'" y="'+(y+27)+'" width="64" height="8" rx="2" fill="#9AA1A9"/><rect x="'+(x+13)+'" y="'+(y+41)+'" width="44" height="6" rx="2" fill="#3B8BEB" fill-opacity=".7"/>';
    if (k>=3) f += '<rect x="'+(x+87)+'" y="'+(y+24)+'" width="52" height="36" rx="2" fill="#E1E5E9"/>';
    if (k>=4) f += '<rect x="'+(x+13)+'" y="'+(y+66)+'" width="38" height="14" rx="2" fill="#ECEAE4"/><rect x="'+(x+57)+'" y="'+(y+66)+'" width="38" height="14" rx="2" fill="#ECEAE4"/><rect x="'+(x+101)+'" y="'+(y+66)+'" width="38" height="14" rx="2" fill="none" stroke="#C9CED4" stroke-dasharray="3 3"/>';
    if (k===5) f += '<rect x="'+(x+107)+'" y="'+(y+28)+'" width="30" height="10" rx="5" fill="#FF6B4A"/>';
    if (k<5) f += '<path d="M'+(x+157)+' '+(y+44)+'h18m-6 -6l6 6l-6 6" stroke="#0E0F11" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    f += '</g>';
  }
  f += '<text x="1" y="128" font-family="'+MONO+'" font-size="12" fill="#4F5358">0 s</text><text x="'+(5*182+1)+'" y="128" font-family="'+MONO+'" font-size="12" font-weight="600" fill="#B01E31">7.8 s · main content</text>';
  film.innerHTML = f;
})();

/* C: the page's own source, oversized and tilted, with faults underlined like a spell-check.
   Tags use the real check numbers and names from M. */
(function buildC(){
  var svg = $('bgC'); if (!svg) return;
  var L = [
    ['<!doctype html>'],
    ['<html lang="en">'],
    ['<head>'],
    ['  ','<title>Home | Vellmoor</title>','','titles-meta'],
    ['  <link href="','http://','vellmoor.example/style.css">','security-https'],
    ['</head>'],
    ['<body>'],
    ['  <img src="','stock-workshop-final2.jpg','">','hero-photo'],
    ['  <h1>','Welcome to our website!','</h1>','headline'],
    ['  <a href="mailto:info@vellmoor.example">','Click here to email us','</a>','quote-form'],
    ['  <p>Call ','01632 960 000','</p>','tap-to-call'],
    ['  <section id="our-work">','coming soon','</section>','case-studies'],
    ['</body>'],
    ['</html>']
  ];
  var FS = 30, CW = FS*0.6, X = 160, h = '<g transform="rotate(-7 750 500)">';
  L.forEach(function(l,i){
    var y = 110 + i*62, raw = l[0], ind = raw.length - raw.replace(/^ +/,'').length;
    var before = raw.replace(/^ +/,''), fault = l[1]||'', after = l[2]||'', x = X + ind*CW;
    h += '<text x="'+(X-34)+'" y="'+y+'" text-anchor="end" font-family="'+MONO+'" font-size="20" fill="#0E0F11" fill-opacity=".22">'+pad2(i+1)+'</text>';
    h += '<text x="'+x+'" y="'+y+'" font-family="'+MONO+'" font-size="'+FS+'" fill="#0E0F11">'
      + '<tspan fill-opacity=".24">'+esc(before)+'</tspan>'
      + (fault ? '<tspan fill-opacity=".62" font-weight="600">'+esc(fault)+'</tspan>' : '')
      + (after ? '<tspan fill-opacity=".24">'+esc(after)+'</tspan>' : '') + '</text>';
    if (fault){
      var x0 = x + before.length*CW, x1 = x0 + fault.length*CW, n = Math.max(2, Math.floor((x1-x0)/10)), d = 'M'+x0.toFixed(1)+' '+(y+10)+' q5 -7 10 0';
      for (var j=1;j<n;j++) d += ' t10 0';
      h += '<path class="c-sq" d="'+d+'" fill="none" stroke="#9B1B2A" stroke-opacity=".85" stroke-width="2.6" stroke-linecap="round" style="animation-delay:'+(reduce?0:300+i*120)+'ms"/>';
      var m = byId[l[3]], s = statusOf(m.score), lab = pad2(m.n)+' '+m.name, tx = x + (before.length+fault.length+after.length)*CW + 28, tw = lab.length*10.2 + 46;
      h += '<g font-family="'+MONO+'" font-size="17" font-weight="600"><rect x="'+tx+'" y="'+(y-25)+'" width="'+tw.toFixed(0)+'" height="34" rx="7" fill="#0E0F11"/>'
        + '<rect x="'+(tx+12)+'" y="'+(y-14)+'" width="12" height="12" rx="3" fill="'+s.c+'"/>'
        + '<text x="'+(tx+32)+'" y="'+(y-2)+'" fill="#C9A24C">'+esc(lab)+'</text></g>';
    }
    if (i === L.length-1) h += '<rect class="c-caret" x="'+(x + before.length*CW + 8)+'" y="'+(y-26)+'" width="16" height="34" fill="#0E0F11" fill-opacity=".8"/>';
  });
  svg.innerHTML = h + '</g>';
})();

/* switcher + ?bg=a|b|c (no storage; the URL carries the choice) */
(function(){
  var valid = {a:1,b:1,c:1}, q = 'a';
  try { var p = new URLSearchParams(location.search).get('bg'); if (p && valid[p.toLowerCase()]) q = p.toLowerCase(); } catch(e){}
  function setBg(k, push){
    document.body.setAttribute('data-bg', k);
    document.querySelectorAll('[data-setbg]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-setbg')===k)); });
    if (push){ try { var u = new URL(location.href); u.searchParams.set('bg', k); history.replaceState(null, '', u.toString()); } catch(e){} }
  }
  setBg(q, false);
  $('bgswitch').addEventListener('click', function(e){ var b = e.target.closest('[data-setbg]'); if (b) setBg(b.getAttribute('data-setbg'), true); });
})();

/* =====================================================================
   HOW YOU COMPARE (v4.1, Nova). Reads ONLY the #compare-data block.
   v4.1: no automatic local list. v4.3: the client names ONE competitor
   (one "slot"); a filled slot sits side by side with the client across the
   same checks. A slot with no figures yet shows "Not measured".
   Rules (from the data): score = passes / measures actually taken,
   unweighted; "not measured" leaves the denominator; borderline is a label only.
   ?cmp=empty opens with the one slot empty (the sample cleared).
   ===================================================================== */
(function compare(){
  var C = null;
  try { C = JSON.parse($('compare-data').textContent); } catch(e){ console.warn('compare block unreadable'); }
  /* v5 · a live report: the sample client and the sample competitor go, the measured site comes in */
  if (C && REPORT){
    C.label = ''; C.sample = ''; C.asOf = String(REPORT.tested || '').slice(0, 10);
    C.slots = FULL && FULL.competitor ? [{slot: 1, id: 'comp', name: FULL.competitor.name, domain: FULL.competitor.domain, url: FULL.competitor.url, selectedBy: 'client', values: FULL.competitor.values}] : [];
    C.sites = [{id:'client', client:true, name: CLIENT.name, domain: CLIENT.site, selectedBy:'client', values: REPORT.values || {}}];
    var OV = {   /* how the automatic run takes each measure (the sample block describes the hand-run method) */
      weight: {how:'Total size of the files the home page loads, from one automatic run. Pass ≤ 1,600 KiB (Google’s stated target).', method:'engine: sum of home-page files'},
      lcp:    {how:'Largest Contentful Paint, PageSpeed Insights mobile, one run. Pass ≤ 2.5 s (web.dev).', method:'psi-mobile'},
      ttfb:   {how:'Time to first byte from one fixed server, median of 3. Pass ≤ 0.8 s (web.dev).', method:'engine: fetch, median of 3'},
      mobile: {label:'Phone layout set up', yes:'Viewport set and small-screen layout rules found', no:'No viewport setting, or no small-screen layout rules found', how:'Viewport meta includes width= and the stylesheets hold small-screen rules. Sideways scroll isn’t tested automatically.', method:'HTML and CSS parse'},
      tap:    {method:'HTML parse'}, quote: {method:'HTML parse'}, upload: {method:'HTML parse'},
      listing:{how:'Checked by hand, signed out, in your full report. Information only.', method:'manual'}
    };
    (C.metrics || []).forEach(function(m){ var o = OV[m.id]; if (o) Object.keys(o).forEach(function(k){ m[k] = o[k]; }); });
    if (C.coverage && C.coverage.yes && C.coverage.yes.responsive != null) C.coverage.yes.responsive = 'By proxy: viewport set and small-screen layout rules found';
  }
  var sec = $('compare'); if (!sec) return;
  if (!C || !C.sites || !C.metrics){ sec.classList.add('hidden'); return; }
  var MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function sd(iso){ var p = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso||''); return p ? (+p[3])+' '+MO[+p[2]-1]+' '+p[1] : (iso||''); }
  function sdt(iso){ var t = /T(\d{2}:\d{2})/.exec(iso||''); return sd(iso) + (t ? ', ' + t[1] : ''); }
  function fill(t, o){ return String(t == null ? '' : t).replace(/\{(\w+)\}/g, function(_,k){ return o[k] != null ? o[k] : ''; }); }
  var meth = C.method || {};
  var BPCT = ((meth.borderline || {}).pct || 10) / 100;
  var scored = C.metrics.filter(function(m){ return !m.info; }), info = C.metrics.filter(function(m){ return m.info; });
  var me = C.sites.filter(function(x){ return x.client; })[0] || C.sites[0];
  var LV = ['none','named','shown'];
  var SLOT_C = [{sc:'#3B8BEB', st:'#EEF5FE'}];   /* v4.3: one slot, one colour */
  function val(site, m){ return (site.values || {})[m.id] || null; }
  function measured(v){ return !!v && v.v != null; }
  function pass(m, v){
    if (!measured(v)) return null;
    if (m.type === 'bool') return !!v.v;
    if (m.type === 'level') return LV.indexOf(v.v) >= LV.indexOf(m.passFrom || 'named');
    if (m.type === 'num') return m.better === 'higher' ? v.v >= m.pass : v.v <= m.pass;
    return null;
  }
  function borderline(m, v){ return m.type === 'num' && measured(v) && Math.abs(v.v - m.pass) <= m.pass * BPCT; }
  function nfmt(m, x){ var s = (+x).toFixed(m.dp == null ? 1 : m.dp); return m.dp === 0 ? (+s).toLocaleString('en-GB') : s; }
  function said(m, v, withTime){
    var when = withTime ? sdt(v && v.at) : sd(v && v.at);
    if (!measured(v)) return COPY.cmpNM + (v && v.nm ? ': ' + v.nm : '') + (v && v.at ? ', ' + when : '');
    if (m.type === 'bool') return (v.v ? m.yes : m.no) + ', ' + when;
    if (m.type === 'level') return (m.levels[v.v] || v.v) + ', ' + when;
    if (m.type === 'text') return '“' + v.v + '”, ' + when;
    var r = v.runs && v.runs.length ? ' (median of ' + v.runs.length + ')' : '';
    return nfmt(m, v.v) + ' ' + m.unit + (v.alt ? ' · ' + v.alt : '') + r + ', ' + when;
  }
  function tally(site){ var p = 0, t = 0; scored.forEach(function(m){ var r = pass(m, val(site,m)); if (r !== null){ t++; if (r) p++; } }); return {p:p, t:t}; }
  function initials(site){ return site.name.replace(/&/g,' ').split(/\s+/).filter(Boolean).slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase(); }
  function chip(id){ var m = byId[id]; if (!m) return ''; var s = statusOf(m.score);
    return '<a class="ckchip" href="#m-'+m.id+'" data-goto="'+m.id+'" aria-label="Check '+m.n+': '+esc(m.name)+'"><b style="background:'+s.c+';color:'+s.ink+'">'+m.n+'</b>'+esc(m.name)+'</a>'; }
  function segs(site){
    return '<span class="segs'+(reduce?' on':'')+'" aria-hidden="true">' + scored.map(function(m){ var r = pass(m, val(site,m));
      return '<i class="'+(r===null?'nm':r?'ok':'')+'" title="'+esc(m.label+': '+(r===null?COPY.cmpNM:r?COPY.cmpPass:COPY.cmpFail))+'"></i>'; }).join('') + '</span>';
  }
  function bareDomain(u){ return String(u||'').trim().replace(/^https?:\/\//i,'').replace(/^\/+/,'').replace(/\/+$/,'').toLowerCase(); }
  function okUrl(u){ var d = bareDomain(u); return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d+)?(\/\S*)?$/i.test(d) && !/\s/.test(u.trim()); }

  /* header: sample tags + method line (no selection or fallback lines in v4.1) */
  $('cmpFict').textContent = C.label || '';
  $('cmpSample').textContent = C.sample || '';
  $('cmpMethod').textContent = COPY.cmpMethodLine;
  $('cmpScoring').textContent = [meth.scoring, (meth.borderline||{}).note].filter(Boolean).join(' ');

  /* slot state: from the data, or empty with ?cmp=empty. v4.3: ONE slot only (MAX_SLOTS); extra data slots are ignored */
  var startEmpty = false;
  try { startEmpty = (new URLSearchParams(location.search).get('cmp') || '').toLowerCase() === 'empty'; } catch(e){}
  var MAX_SLOTS = 1;
  var slots = [0].map(function(i){
    var d = (C.slots || [])[i] || {};
    var filled = !startEmpty && !!(d.name && d.domain);
    return {i:i, filled:filled, editing:false, err:'', errField:'', draft:null,
            site: filled ? {id: d.id || ('slot'+(i+1)), name: d.name, domain: d.domain, url: d.url || '', sample: !!d.sample, values: d.values || {}} : null};
  });
  function filledSlots(){ return slots.filter(function(x){ return x.filled && x.site; }); }
  /* v4.2 · hand the client-typed competitor to the enquiry (copy list + enquiryPayload). Sample firm left out.
     v4.3: an array of at most MAX_SLOTS (= 1) {name, website}; kept as an array so the payload shape is unchanged. */
  clientCompetitors = function(){
    return filledSlots().filter(function(x){ return !x.site.sample; })
      .map(function(x){ return {name: x.site.name, website: x.site.domain}; }).slice(0, MAX_SLOTS);
  };

  /* ---------- the two cards: you + the one slot (v4.3) ---------- */
  function youCard(){
    var k = tally(me);
    return '<section class="rv you" aria-label="'+esc(COPY.cmpYou+': '+me.name)+'">'
      + '<p class="rv-k"><span class="num">'+esc(COPY.cmpYou)+'</span></p>'
      + '<p class="rv-nm">'+esc(me.name)+'</p><p class="dom">'+esc(me.domain)+'</p>'
      + '<p class="score">'+k.p+'<small>'+esc(fill(COPY.cmpOfMeasured,{t:k.t, w:(k.p===1?COPY.cmpPassOne:COPY.cmpPassMany)}))+'</small></p>'
      + segs(me) + '</section>';
  }
  function slotLabel(x){ return COPY.rvSlot1; }   /* v4.3: one slot */
  function slotForm(x){
    var n = x.i + 1, d = x.draft || (x.site ? {name: x.site.name, url: x.site.url || x.site.domain} : {name:'', url:''});
    var idN = 'rvName'+n, idU = 'rvUrl'+n, idH = 'rvHelp'+n, idE = 'rvErr'+n;
    return '<form novalidate data-slot="'+x.i+'">'
      + '<div class="fld"><label for="'+idN+'">'+esc(COPY.rvNameLabel)+'</label>'
      + '<input id="'+idN+'" name="name" type="text" autocomplete="organization" maxlength="80" placeholder="'+esc(COPY.rvNamePh)+'" value="'+esc(d.name)+'"'
      + (x.errField==='name'||x.errField==='both' ? ' aria-invalid="true"' : '') + ' aria-describedby="'+idE+'"></div>'
      + '<div class="fld"><label for="'+idU+'">'+esc(COPY.rvUrlLabel)+'</label>'
      + '<input id="'+idU+'" name="url" type="text" inputmode="url" autocomplete="url" spellcheck="false" autocapitalize="off" maxlength="200" placeholder="'+esc(COPY.rvUrlPh)+'" value="'+esc(d.url)+'"'
      + (x.errField==='url'||x.errField==='both' ? ' aria-invalid="true"' : '') + ' aria-describedby="'+idH+' '+idE+'">'
      + '<p class="help" id="'+idH+'">'+esc(COPY.rvUrlHelp)+'</p></div>'
      + '<p class="err" id="'+idE+'" role="alert">'+esc(x.err)+'</p>'
      + '<div class="acts">'
      + (x.editing
          ? '<button type="submit" class="btn small ink">'+esc(COPY.rvSave)+'</button><button type="button" class="btn small" data-act="cancel">'+esc(COPY.rvCancel)+'</button>'
          : '<button type="submit" class="btn small ink" aria-label="'+esc(COPY.rvAriaAdd)+'">'+esc(COPY.rvAdd)+'</button>')
      + '</div></form>';
  }
  function slotCard(x){
    var c = SLOT_C[x.i], style = ' style="--sc:'+c.sc+';--st:'+c.st+'"';
    var head = '<p class="rv-k">'+esc(slotLabel(x))+'</p>';   /* v4.4 · "1" badge dropped (read like a step number) */
    if (!x.filled || x.editing)
      return '<section class="rv slot'+(x.filled?'':' open')+'" data-slot="'+x.i+'"'+style+' aria-label="'+esc(slotLabel(x))+'">' + head + slotForm(x) + '</section>';
    var st = x.site, k = tally(st);
    return '<section class="rv slot" data-slot="'+x.i+'"'+style+' aria-label="'+esc(slotLabel(x)+': '+st.name)+'">' + head
      + '<p class="rv-nm">'+esc(st.name)+(st.sample ? '<span class="smp">'+esc(COPY.rvSampleBadge)+'</span>' : '')+'</p>'
      + '<p class="dom">'+esc(st.domain)+'</p>'
      + (k.t ? '<p class="score">'+k.p+'<small>'+esc(fill(COPY.cmpOfMeasured,{t:k.t, w:(k.p===1?COPY.cmpPassOne:COPY.cmpPassMany)}))+'</small></p>' : '<p class="score"><span class="tag nm">'+esc(COPY.cmpNM)+'</span></p>')
      + segs(st)
      + (st.sample ? '<p class="ill">'+esc(COPY.rvSampleSlot)+'</p>' : '')
      + '<div class="acts"><button type="button" class="btn small" data-act="edit" aria-label="'+esc(fill(COPY.rvAriaEdit,{name:st.name}))+'">'+esc(COPY.rvEdit)+'</button>'
      + '<button type="button" class="btn small" data-act="clear" aria-label="'+esc(fill(COPY.rvAriaClear,{name:st.name}))+'">'+esc(COPY.rvClear)+'</button></div>'
      + '</section>';
  }

  /* ---------- side by side, row per measure ---------- */
  var maxOf = {};
  function scale(){
    var all = [me].concat(filledSlots().map(function(x){ return x.site; }));
    scored.concat(info).forEach(function(m){ if (m.type === 'num') maxOf[m.id] = Math.max(m.pass, Math.max.apply(null, all.map(function(x){ var v = val(x,m); return measured(v) ? v.v : 0; }))) * 1.08; });
  }
  function rel(m, mv, tv){ var pm = pass(m,mv), pt = pass(m,tv);
    if (pm === null || pt === null) return 'nm'; if (pm === pt) return 'level'; return pm ? 'ahead' : 'behind'; }
  var REL_TXT = function(r){ return {ahead:COPY.rvAhead, behind:COPY.rvBehind, level:COPY.rvLevel}[r] || ''; };
  function barLine(cls, who, whoLabel, m, v, sc, relTag){
    var inner = '', bl = borderline(m, v);
    if (!measured(v)) inner = '<span class="hatch"></span>';
    else if (m.type === 'bool') inner = v.v ? '<span class="fill" data-w="100"></span>' : '<span class="no" aria-hidden="true">✕</span>';
    else if (m.type === 'level'){ var i = LV.indexOf(v.v); inner = (i>0 ? '<span class="fill" data-w="'+(i*50)+'"></span>' : '<span class="no" aria-hidden="true">✕</span>') + '<span class="gl" style="left:50%"></span>'; }
    else { var w = Math.max(2, v.v / maxOf[m.id] * 100);
      inner = '<span class="fill" data-w="'+w.toFixed(1)+'"></span><span class="gl" style="left:'+(m.pass/maxOf[m.id]*100).toFixed(1)+'%"></span>'; }
    var tag = relTag && relTag !== 'nm' ? ' <span class="tag '+relTag+'">'+esc(REL_TXT(relTag))+'</span>' : '';
    return '<div class="bar2 '+cls+'"'+(sc?' style="--sc:'+sc+'"':'')+'><span class="who" title="'+esc(whoLabel)+'"><i aria-hidden="true"></i>'+esc(who)+'</span><span class="track" aria-hidden="true">'+inner+'</span>'
      + '<span class="val"><span class="sr">'+esc(whoLabel)+': </span>'+esc(said(m, v))+(bl ? ' <span class="bord">'+esc(COPY.cmpBorder)+'</span>' : '')+tag+'</span></div>';
  }
  function textLine(cls, who, whoLabel, m, v, sc){
    return '<div class="bar2 txt '+cls+'"'+(sc?' style="--sc:'+sc+'"':'')+'><span class="who" title="'+esc(whoLabel)+'"><i aria-hidden="true"></i>'+esc(who)+'</span><span class="val"><span class="sr">'+esc(whoLabel)+': </span>'+esc(said(m, v))+'</span></div>';
  }
  function renderSBS(){
    var F = filledSlots(); scale();
    /* one summary per named competitor, or an invitation when there are none */
    var vs = '';
    if (!F.length){
      vs = '<div class="sbs-empty"><p>'+esc(COPY.rvEmptySlot)+'</p><button type="button" class="btn small ink" data-act="focus-slot">'+esc(COPY.rvAdd)+'</button></div>';
    } else {
      vs = '<div class="vs">' + F.map(function(x){
        var t = x.site, a = 0, l = 0, b = 0, nmc = 0;
        scored.forEach(function(m){ var r = rel(m, val(me,m), val(t,m)); if (r==='ahead') a++; else if (r==='behind') b++; else if (r==='level') l++; else nmc++; });
        var tot = a + l + b;
        return '<div class="vs-one" style="--sc:'+SLOT_C[x.i].sc+'"><h4>'+esc(fill(COPY.rvCaption,{name:t.name}))+'</h4>'
          + (tot ? '<div class="h2h-sum"><div class="s-b"><b>'+b+'</b>'+esc(COPY.rvBehind)+'</div><div class="s-l"><b>'+l+'</b>'+esc(COPY.rvLevel)+'</div><div class="s-a"><b>'+a+'</b>'+esc(COPY.rvAhead)+'</div>'
               + '<p>'+esc(fill(COPY.rvSummary,{n:a,total:tot}))+(nmc ? ' '+esc(fill(COPY.cmpNMNote,{k:nmc})) : '')+'</p></div>'
               : '<div class="h2h-sum"><p><span class="tag nm">'+esc(COPY.cmpNM)+'</span></p></div>')
          + (t.sample ? '<p class="cmp-foot">'+esc(COPY.rvSampleMark)+'</p>' : '')
          + '</div>';
      }).join('') + '</div>';
    }
    $('cmpVs').innerHTML = vs;
    $('cmpLegend').innerHTML = '<span><i style="background:#0E0F11"></i>'+esc(COPY.cmpYou)+' · '+esc(me.name)+'</span>'
      + F.map(function(x){ return '<span><i style="background:'+SLOT_C[x.i].sc+'"></i>'+esc(initials(x.site))+' · '+esc(x.site.name)+'</span>'; }).join('')
      + '<span><i class="lg-line"></i>'+esc(COPY.cmpLineKey)+'</span>';
    var rows = '';
    scored.forEach(function(m){
      var mv = val(me,m), pm = pass(m,mv), rels = F.map(function(x){ return rel(m, mv, val(x.site,m)); });
      var st = !F.length ? (pm===null?'nm':'solo') : rels.indexOf('behind') > -1 ? 'behind' : rels.every(function(r){ return r==='nm'; }) ? 'nm' : rels.indexOf('ahead') > -1 && rels.every(function(r){ return r==='ahead' || r==='nm'; }) ? 'ahead' : 'level';
      var unitLine = m.type === 'num' ? '<small>'+esc(fill(COPY.cmpPassLine,{v:nfmt(m,m.pass),u:m.unit}))+'</small>' : m.type === 'level' ? '<small>'+esc(COPY.cmpPassFrom)+'</small>' : '';
      var you = pm === null ? '<span class="tag nm">'+esc(COPY.cmpNM)+'</span>' : '<span class="tag '+(pm?'ok':'no')+'">'+esc(COPY.cmpYou+': '+(pm?COPY.cmpPass:COPY.cmpFail))+'</span>';
      rows += '<li data-state="'+st+'"><div class="ml"><b>'+esc(m.label)+'</b>'+unitLine+'<span>'+you+'</span>'+chip(m.check)+'</div>'
        + '<div class="bars">' + barLine('me', COPY.cmpYou, me.name, m, mv)
        + F.map(function(x, j){ return barLine('them', initials(x.site), x.site.name, m, val(x.site,m), SLOT_C[x.i].sc, rels[j]); }).join('') + '</div></li>';
    });
    if (info.length){
      rows += '<li class="info-h"><b>'+esc(COPY.cmpInfoTitle)+'</b></li>';
      info.forEach(function(m){
        var mv = val(me,m);
        rows += '<li data-state="info"><div class="ml"><b>'+esc(m.label)+'</b>' + chip(m.check) + '</div><div class="bars">'
          + (m.type === 'text'
              ? textLine('me', COPY.cmpYou, me.name, m, mv) + F.map(function(x){ return textLine('them', initials(x.site), x.site.name, m, val(x.site,m), SLOT_C[x.i].sc); }).join('')
              : barLine('me', COPY.cmpYou, me.name, m, mv) + F.map(function(x){ return barLine('them', initials(x.site), x.site.name, m, val(x.site,m), SLOT_C[x.i].sc); }).join(''))
          + '</div></li>';
      });
    }
    var ul = $('cmpRows'); ul.innerHTML = rows;
    function grow(){ ul.querySelectorAll('.fill').forEach(function(f){ f.style.width = f.getAttribute('data-w') + '%'; }); }
    if (reduce) grow(); else requestAnimationFrame(function(){ requestAnimationFrame(grow); });
  }

  /* ---------- full table: you + named competitors, every figure dated ---------- */
  function renderTable(){
    var cols = [{s:me, me:true}].concat(filledSlots().map(function(x){ return {s:x.site}; }));
    var all = scored.concat(info);
    var th = '<thead><tr><th scope="col">'+esc(COPY.cmpMeasure)+'</th>' + cols.map(function(c){ return '<th scope="col" class="'+(c.me?'me':'')+'">'+esc(c.s.name)+'<small>'+esc(c.s.domain)+'</small>'+(c.s.sample?'<small>'+esc(COPY.rvSampleMark)+'</small>':'')+'</th>'; }).join('') + '</tr></thead>';
    var tb = '<tbody>' + all.map(function(m){
      return '<tr'+(m.info?' class="inf"':'')+'><th scope="row">'+esc(m.label)+(m.info?' <span class="tag level">'+esc(COPY.cmpInfoShort)+'</span>':'')+'<small>'+esc(m.how||'')+'</small><small>'+esc(m.method||'')+'</small></th>' + cols.map(function(c){
        var v = val(c.s, m), p = m.info ? undefined : pass(m, v), main;
        if (!measured(v)) main = COPY.cmpNM + (v && v.nm ? ': ' + v.nm : '');
        else if (m.type === 'bool') main = v.v ? m.yes : m.no;
        else if (m.type === 'level') main = m.levels[v.v] || v.v;
        else if (m.type === 'text') main = '“' + v.v + '”';
        else main = nfmt(m, v.v) + ' ' + m.unit + (v.alt ? ' · ' + v.alt : '');
        var extra = [];
        if (v && v.runs) extra.push(COPY.cmpRuns + ': ' + v.runs.map(function(x){ return nfmt(m,x); }).join(' / '));
        if (v && v.at) extra.push(sdt(v.at));
        var res = p === undefined ? '' : '<b class="res '+(p===null?'nm':p?'ok':'no')+'">'+esc(p===null?COPY.cmpNM:p?COPY.cmpPass:COPY.cmpFail)+(borderline(m,v)?' · '+esc(COPY.cmpBorder):'')+'</b>';
        return '<td class="'+(c.me?'me':'')+'">'+esc(main)+'<small>'+esc(extra.join(' · '))+'</small>'+res+'</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    $('cmpTable').innerHTML = '<caption class="sr">'+esc(C.label)+'. '+esc(C.sample||'')+'</caption>' + th + tb;
  }

  function render(focusSel){
    $('rivals').innerHTML = youCard() + slots.map(slotCard).join('');
    var anyOpen = slots.some(function(x){ return !x.filled; });
    $('rvNone').classList.toggle('hidden', !anyOpen);
    var anySample = filledSlots().some(function(x){ return x.site.sample; });
    $('cmpFict').classList.toggle('hidden', !C.label || !anySample);   /* "Fictional competitor" label only while the sample firm is shown */
    $('cmpSample').classList.toggle('hidden', !C.sample);
    renderSBS(); renderTable(); renderTalk();   /* v4.4 · talk note says whether a competitor goes with the enquiry */
    if (!reduce) requestAnimationFrame(function(){ setTimeout(function(){ document.querySelectorAll('#rivals .segs').forEach(function(el){ el.classList.add('on'); }); }, 120); });
    if (focusSel){ var f = document.querySelector(focusSel); if (f) f.focus(); }
  }

  /* ---------- interaction ---------- */
  var R = $('rivals');
  R.addEventListener('submit', function(e){
    var f = e.target.closest('form'); if (!f) return; e.preventDefault();
    var x = slots[+f.getAttribute('data-slot')]; if (!x) return;   /* v4.3: only slot 0 exists; ignore anything else */
    var nm = f.elements.name.value.trim(), url = f.elements.url.value.trim();
    x.draft = {name: f.elements.name.value, url: f.elements.url.value};
    if (!nm || !url){ x.err = COPY.rvErrMissing; x.errField = !nm && !url ? 'both' : !nm ? 'name' : 'url';
      render('#rv'+(x.errField==='url'?'Url':'Name')+(x.i+1)); return; }
    if (!okUrl(url)){ x.err = COPY.rvErrUrl; x.errField = 'url'; render('#rvUrl'+(x.i+1)); return; }
    var dom = bareDomain(url).split('/')[0];
    var same = x.site && x.site.name === nm && x.site.domain === dom;
    x.site = same ? x.site : {id:'slot'+(x.i+1), name:nm, domain:dom, url:url, sample:false, values:{}};
    x.filled = true; x.editing = false; x.err = ''; x.errField = ''; x.draft = null;
    render('.rv[data-slot="'+x.i+'"] [data-act="edit"]');
  });
  R.addEventListener('click', function(e){
    var b = e.target.closest('[data-act]'); if (!b) return;
    var card = b.closest('[data-slot]'), x = card && slots[+card.getAttribute('data-slot')], act = b.getAttribute('data-act'); if (!x) return;
    if (act === 'edit'){ x.editing = true; x.err = ''; x.errField = ''; x.draft = null; render('#rvName'+(x.i+1)); }
    else if (act === 'cancel'){ x.editing = false; x.err = ''; x.errField = ''; x.draft = null; render('.rv[data-slot="'+x.i+'"] [data-act="edit"]'); }
    else if (act === 'clear'){ x.filled = false; x.editing = false; x.site = null; x.err = ''; x.errField = ''; x.draft = null; render('#rvName'+(x.i+1)); }
  });
  /* keep what's typed if another slot re-renders the cards */
  R.addEventListener('input', function(e){ var f = e.target.closest('form'); if (!f) return; var x = slots[+f.getAttribute('data-slot')]; if (!x) return;
    x.draft = {name: f.elements.name.value, url: f.elements.url.value}; });
  $('cmpVs').addEventListener('click', function(e){
    if (!e.target.closest('[data-act="focus-slot"]')) return;
    var open = slots.filter(function(x){ return !x.filled || x.editing; })[0]; if (!open) return;
    var inp = $('rvName'+(open.i+1)); if (inp){ inp.scrollIntoView({behavior: reduce?'auto':'smooth', block:'center'}); inp.focus({preventScroll:true}); }
  });
  render();

  /* which of the checks can be measured from outside (Ruby, v4.1: 8 yes / 6 partly / 2 no of the first 16). v4.6: AI checks 17-18 added to "no" (not in the comparison measures), so 8 / 6 / 4 = 18 */
  var cov = C.coverage || {};
  function covList(key){ var o = cov[key] || {};
    return M.filter(function(m){ return o.hasOwnProperty(m.id); }).map(function(m){ return '<li>'+chip(m.id)+(o[m.id] ? '<span class="why2">'+esc(o[m.id])+'</span>' : '')+'</li>'; }).join(''); }
  ['yes','partly','no'].forEach(function(k){
    var n = Object.keys(cov[k] || {}).length;
    $('cmpCov-'+k).innerHTML = covList(k); $('cmpCovN-'+k).textContent = n;
  });

  /* any check chip jumps to its card, like the balloons */
  sec.addEventListener('click', function(e){ var a = e.target.closest('[data-goto]'); if (!a || !a.getAttribute('data-goto')) return; e.preventDefault(); goTo(a.getAttribute('data-goto')); });
})();
/* filter bar: hide once the checks board has scrolled away above (v3) */
(function(){
  var tb = $('toolbar'), bd = document.querySelector('.board');
  if (!tb || !bd || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function(es){ var e = es[es.length-1]; tb.classList.toggle('past', !e.isIntersecting && e.boundingClientRect.top < 0); }).observe(bd);
})();

/* ---------- v4 · Before / After switch (Nova) ----------
   Before = the drawing as it was. After = the same page with the fixes made (#vmAfter).
   Each balloon becomes a tick on the fixed element; ticks jump to their checks with goTo(). */
(function(){
  var svg = $('drawSvg'), before = $('vmBefore'), after = $('vmAfter'), balloons = $('balloons'), ticks = $('ticks');
  var ba = $('ba'), bBefore = $('baBefore'), bAfter = $('baAfter'), note = $('baNote'), live = $('baLive');
  var bkey = $('bkey'), tkey = $('tkey'), tip = $('dtip'), sheet = $('sheet');
  if (!svg || !before || !after || !ba) return;
  var LABEL_BEFORE = svg.getAttribute('aria-label');
  var help = document.querySelector('[data-copy="drawingHelp"]'), HELP_BEFORE = null; /* Quinn: help line follows the mode */
  var HELP_AFTER = 'Each tick marks a check that’s been fixed on the same page. Select a tick to jump to that check.';
  var LABEL_AFTER = "Drawing of Vellmoor’s home page after the fixes: a modern, fast page with a clear headline, real machined parts, a Send a drawing button, tap-to-call, WhatsApp and online booking, case studies and a linked certificate, with 18 tick markers";   /* [Maya] v4.4 */
  /* marker [x,y] and target [x,y] for each check on the After page */
  var A = {
    'hero-photo':     [498,214, 560,252],
    'headline':       [20,248,  58,248],
    'offer-structure':[20,430,  74,423],
    'spec-page':      [20,504,  74,504],
    'machine-list':   [592,470, 478,505],
    'tap-to-call':    [709,104, 709,140],
    'responsive':     [1062,232, 1022,276],
    'image-weight':   [726,195, 690,195],
    'hosting':        [878,103, 834,103],
    'quote-form':     [20,311,  62,311],
    'reply-promise':  [706,642, 662,600],
    'case-studies':   [870,404, 730,402],
    'certs':          [20,363,  64,363],
    'titles-meta':    [620,24,  560,64],
    'local-listing':  [380,642, 358,603],
    'security-https': [20,104,  80,104],
    'platform-ready': [962,612, 906,598],   /* v4.4 · tag "Supported platform" in the footer */
    'tools-in-use':   [622,326, 584,312]    /* v4.4 · WhatsApp us + Book a call next to the phone number */
  };
  var TICK = '<path d="M-6.5 0.5 l4.2 4.2 l8.6 -9" fill="none" stroke="#0E0F11" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>';
  var html = '';
  M.forEach(function(m){
    var p = A[m.id]; if (!p) return;
    var bx=p[0], by=p[1], tx=p[2], ty=p[3], len = Math.ceil(Math.hypot(tx-bx, ty-by));
    html += '<a class="tick-g" href="#m-'+m.id+'" data-id="'+m.id+'" data-x="'+bx+'" aria-label="Fixed: '+esc(m.name)+'">'
      + '<path class="tline" style="--len:'+len+'" d="M'+bx+' '+by+' L'+tx+' '+ty+'" stroke="#0E0F11" stroke-width="1.6" fill="none"/>'
      + '<g class="tpop">'
      + '<circle cx="'+tx+'" cy="'+ty+'" r="3.5" fill="#0E0F11"/>'
      + '<circle class="halo" cx="'+bx+'" cy="'+by+'" r="24" fill="none" stroke="#0E0F11" stroke-width="3"/>'
      + '<circle class="t" cx="'+bx+'" cy="'+by+'" r="17" fill="#1B998B" stroke="#0E0F11" stroke-width="2.5"/>'
      + '<g transform="translate('+bx+' '+by+')">'+TICK+'</g>'
      + '<circle cx="'+(bx+13)+'" cy="'+(by-13)+'" r="8" fill="#0E0F11"/>'
      + '<text x="'+(bx+13)+'" y="'+(by-9.6)+'" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="700" font-size="9.5" fill="#FFFFFF">'+m.n+'</text>'
      + '</g></a>';
  });
  ticks.innerHTML = html;
  var TK = '<svg viewBox="-9 -9 18 18" aria-hidden="true"><path d="M-5.5 0.5 l3.6 3.6 l7.4 -7.8" fill="none" stroke="#0E0F11" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  tkey.innerHTML = M.map(function(m){ return '<li><a href="#m-'+m.id+'" data-id="'+m.id+'"><b>'+TK+'</b><span class="mono" style="font-size:12px;font-weight:700">'+m.n+'</span> '+esc(m.name)+'<span class="sr">, fixed</span></a></li>'; }).join('');
  tkey.addEventListener('click', function(e){ var a = e.target.closest('a'); if(!a) return; e.preventDefault(); goTo(a.getAttribute('data-id')); });

  function show(a){
    var m = byId[a.getAttribute('data-id')];
    tip.innerHTML = '<b>✓ '+m.n+' · '+esc(m.name)+'</b> · Fixed<br>'+esc(m.fix);
    var r = a.querySelector('circle.t').getBoundingClientRect(), sr = sheet.getBoundingClientRect();
    var x = r.left - sr.left + r.width/2, y = r.top - sr.top;
    tip.classList.add('on');
    var w = tip.offsetWidth; x = Math.max(8, Math.min(sr.width - w - 8, x - w/2));
    var top = y - tip.offsetHeight - 10; if (top < 4) top = y + r.height + 10;
    tip.style.left = x+'px'; tip.style.top = top+'px';
  }
  function hide(){ tip.classList.remove('on'); }
  ticks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('mouseenter', function(){show(a);}); a.addEventListener('mouseleave', hide);
    a.addEventListener('focus', function(){show(a);}); a.addEventListener('blur', hide);
    a.addEventListener('click', function(e){ e.preventDefault(); hide(); goTo(a.getAttribute('data-id')); });
  });

  var mode = 'before', raf = 0, scan = $('baScan'), rA = $('baClipAR'), rB = $('baClipBR');
  function setPressed(){
    ba.setAttribute('data-mode', mode);
    bBefore.setAttribute('aria-pressed', String(mode==='before'));
    bAfter.setAttribute('aria-pressed', String(mode==='after'));
  }
  function finish(){
    var isA = mode === 'after';
    before.style.display = isA ? 'none' : '';
    after.style.display = isA ? '' : 'none';
    before.removeAttribute('clip-path'); after.removeAttribute('clip-path');
    scan.style.display = 'none'; ticks.classList.remove('wiping');
    balloons.style.display = isA ? 'none' : ''; balloons.style.opacity = '';
    ticks.style.display = isA ? '' : 'none';
    after.setAttribute('aria-hidden', String(!isA));
    if (isA) before.setAttribute('aria-hidden','true'); else before.removeAttribute('aria-hidden');
  }
  function apply(next, animate){
    if (next === mode) return;
    mode = next; setPressed(); hide();
    var isA = mode === 'after';
    svg.setAttribute('aria-label', isA ? LABEL_AFTER : LABEL_BEFORE);
    if (help){ if (HELP_BEFORE === null) HELP_BEFORE = help.textContent; help.textContent = isA ? HELP_AFTER : HELP_BEFORE; }
    bkey.classList.toggle('hidden', isA); tkey.classList.toggle('hidden', !isA); note.classList.toggle('hidden', !isA);
    live.textContent = isA ? 'Showing after: the home page with the fixes made, '+M.length+' ticks.' : 'Showing before: the current home page, '+M.length+' balloons.';
    cancelAnimationFrame(raf);
    var tg = ticks.querySelectorAll('.tick-g');
    tg.forEach(function(t){ t.classList.remove('pop'); });
    if (!animate || reduce){ finish(); return; }
    /* inspection wipe: a scan line sweeps across; the new page is revealed behind it */
    var W = 1100, dur = 900, t0 = null;
    var inc = isA ? after : before, out = isA ? before : after;
    inc.style.display = ''; out.style.display = '';
    inc.setAttribute('clip-path','url(#baClipA)'); out.setAttribute('clip-path','url(#baClipB)');
    scan.style.display = '';
    if (isA){ balloons.style.opacity = '0'; ticks.style.display = ''; }
    else { ticks.style.display = 'none'; balloons.style.display = ''; balloons.style.opacity = '0'; }
    var popped = {};
    function step(ts){
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0)/dur), e = k<.5 ? 4*k*k*k : 1 - Math.pow(-2*k+2,3)/2, x = e*W;
      rA.setAttribute('x', 0); rA.setAttribute('width', x);
      rB.setAttribute('x', x); rB.setAttribute('width', Math.max(0, W - x));
      scan.setAttribute('transform', 'translate('+x+' 0)');
      if (isA) tg.forEach(function(t,i){ if (!popped[i] && +t.getAttribute('data-x') <= x + 10){ popped[i]=1; t.classList.add('pop'); } });
      if (k < 1) raf = requestAnimationFrame(step);
      else { finish(); if (isA) tg.forEach(function(t){ t.classList.add('pop'); }); }
    }
    if (isA) ticks.classList.add('wiping');
    raf = requestAnimationFrame(step);
  }
  [bBefore, bAfter].forEach(function(b){
    b.addEventListener('click', function(){ apply(b.getAttribute('data-mode'), true); });
    b.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End'){
        e.preventDefault();
        var to = (e.key === 'ArrowRight' || e.key === 'End') ? bAfter : bBefore;
        to.focus(); apply(to.getAttribute('data-mode'), true);
      }
    });
  });
  if (/[?&]view=after\b/.test(location.search)) apply('after', false);
})();

render(); renderFix();
if (location.hash && /^#m-/.test(location.hash)){ var id = location.hash.slice(3); if (byId[id]) setTimeout(function(){goTo(id);}, 50); }
/* v5.2 · naming a competitor is part of the paid full report, so the free page shows the offer in its place */
(function(){
  document.querySelectorAll('#rivals .rv.slot form, #rivals .rv.slot .acts, #rvPrivacy, #rvNone, .sbs-empty').forEach(function(e){ e.remove(); });
  var k = document.querySelector('[data-copy="rvKicker"]'), h = $('rvH'), i = document.querySelector('[data-copy="rvIntro"]');
  if (FULL){
    if (k) k.textContent = 'Your competitor';
    if (h) h.textContent = FULL.competitor ? 'Compared with ' + FULL.competitor.name : 'No competitor named';
    if (i) i.textContent = FULL.competitorNote || (FULL.competitor ? 'Both sites measured the same way, on the same day.' : 'You didn’t name a competitor with your order, so this section shows your site only.');
    var off = document.querySelector('#rivals .rv.slot.open'); if (off) off.remove();
    return;
  }
  if (k) k.textContent = 'In the full report';
  if (h) h.textContent = 'Compared with a competitor';
  if (i) i.textContent = REPORT ? 'The full report puts your site side by side with one competitor you name, across the same checks.' : 'The full report puts your site side by side with one competitor you name. Here it’s a fictional firm.';
  var open = document.querySelector('#rivals .rv.slot.open');
  if (open) open.outerHTML = '<section class="rv pt-slot" aria-label="Competitor"><p class="rv-k">Competitor · Full report</p><p>Name one competitor when you order and we’ll measure them on the same checks, side by side with you.</p><div class="acts"><button type="button" class="btn small gold" data-pt-open>Order the full report · £4.99</button></div></section>';
})();
/* v5 · a live report has no hand-drawn page to balloon, so that section steps aside; the footer says how the report was made */
/* v5.2 · full report: the designer's summary takes the offer's place, and there is nothing to re-run */
if (FULL){
  var hcPt = $('pt'), hcSum = document.createElement('section');
  hcSum.className = 'pt'; hcSum.id = 'designer';
  hcSum.innerHTML = '<div class="wrap"><div class="pt-card"><div class="pt-copy"><p class="pt-kick">Full report · from your marketing specialist</p><h2>What we’d do first</h2>'
    + (FULL.summary ? '<p class="pt-sum">' + esc(FULL.summary).replace(/\n+/g, '</p><p class="pt-sum">') + '</p>' : '')
    + (FULL.priorities.length ? '<ol class="pt-pri">' + FULL.priorities.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '')
    + '</div></div></div>';
  if (hcPt) hcPt.replaceWith(hcSum);
  var hcRf = $('runForm'); if (hcRf) hcRf.classList.add('hidden');
}
if (REPORT){
  $('drawing').classList.add('hidden'); var hcDb = $('drawBtn'); if (hcDb) hcDb.classList.add('hidden');
  /* the decorative hero backdrops were drawn for the sample client: swap its name and address for this site's */
  var hcOrigin = String(REPORT.url || '').replace(/^(https?:\/\/[^\/]+).*$/, '$1') || CLIENT.site;
  var hcTitle = ((REPORT.pages || [])[0] || {}).title || CLIENT.name; if (hcTitle.length > 22) hcTitle = hcTitle.slice(0, 21) + '…';
  var hcSecure = !!((REPORT.values || {}).https || {}).v;
  document.querySelectorAll('.backdrop text, .backdrop tspan').forEach(function(t){
    if (t.children.length) return; var x = t.textContent;
    if (hcSecure && /^\s*Not secure\s*$/.test(x)){ t.textContent = ''; return; }
    if (!/vellmoor/i.test(x)) return;
    t.textContent = x.replace(/https?:\/\/(www\.)?vellmoor\.example/gi, hcOrigin).replace(/(www\.)?vellmoor\.example/gi, CLIENT.site).replace(/Home \| Vellmoor/g, hcTitle).replace(/Vellmoor( Precision)?/g, CLIENT.name);
  });
  var hcA = $('hcAuto'); hcA.textContent = COPY.v5AutoHow; hcA.hidden = false;
  var hcN = $('hcNotes'), hcNotes = REPORT.notes || [];
  if (hcNotes.length){ hcN.innerHTML = hcNotes.map(function(t){ return '<li>'+esc(t)+'</li>'; }).join(''); hcN.hidden = false; }
}
}

/* =====================================================================
   v5 · LIVE REPORTS (controller). The page above is drawn by hcBoot(report).
   With no report it shows the Vellmoor sample. A website address typed into
   the form is sent to the Health Check engine; when the report comes back the
   page is redrawn from it. Two ways to reach the engine:
     - on a normal web page: fetch() to the Supabase Edge Function (API)
     - inside a Claude artifact (no outside network): the viewer's Supabase
       connector, which queues the run in the hc_reports table and reads it back
   Strings marked [v5] are new and have not been through Maya, Edie or Quinn.
   ===================================================================== */
(function(){
  "use strict";
  var ROOT = document.getElementById('hcRoot'); if (!ROOT) return;
  var TEMPLATE = ROOT.innerHTML;
  var API = 'https://faaraefaigsngvuuvsyv.supabase.co/functions/v1/health-check';
  var ORDER_API = 'https://faaraefaigsngvuuvsyv.supabase.co/functions/v1/hc-order';
  /* Paid orders stay OFF until the privacy notice's Health Check section is live (team rule, ticket 23).
     The switch is hc_config.paid_on in Supabase. The page asks it before sending any personal details. */
  var PROJECT = 'faaraefaigsngvuuvsyv', SERVER = 'Supabase';
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var T = {                                                    /* all [v5] */
    sample:  "This is a sample report for a fictional client. Enter a website address to check a real one.",
    running: "Checking {d}… {n} s. Most sites take under a minute.",
    loading: "Loading that report…",
    ready:   "Report for {d}, measured {when}.",
    sampleLink: "Show the sample",
    badUrl:  "That website address doesn’t look right. Try something like www.yourcompany.co.uk",
    failed:  "The check couldn’t be run just now. Try again in a few minutes.",
    offline: "We couldn’t reach the checker. Check your connection and try again.",
    slow:    "That site is taking too long to check. Try again in a few minutes.",
    noLive:  "Live checks aren’t available in this view, so this is the sample report.",
    connect: "Connect Supabase under Settings, Connectors in Claude to run live checks from this page.",
    allow:   "Live checks need your permission to use Supabase from this page. Run it again and choose Allow.",
    notFound:"That report couldn’t be found. Run the check again.",
    btn: "Run health check", btnBusy: "Checking…"
  };
  var inArtifact = !!(window.claude && typeof window.claude.use === 'function');
  var ui = {value:'', text:T.sample, err:false, busy:false, link:false, live:true};
  var tick = null, runSeq = 0;
  function $(id){ return document.getElementById(id); }
  function fill(t, o){ return String(t).replace(/\{(\w+)\}/g, function(_, k){ return o[k] != null ? o[k] : ''; }); }
  function bare(u){ return String(u || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase(); }
  function okUrl(u){
    u = String(u || '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._~:\/?#@!$&()*+,;=%-]{2,300}$/.test(u)) return false;
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(bare(u));
  }

  /* ---------- draw ---------- */
  function paint(){
    var inp = $('runUrl'), btn = $('runBtn'), st = $('runStatus'), bar = $('runBar'); if (!inp || !btn || !st) return;
    if (inp.value !== ui.value) inp.value = ui.value;
    inp.disabled = ui.busy || !ui.live; btn.disabled = ui.busy || !ui.live;
    btn.textContent = ui.busy ? T.btnBusy : T.btn;
    if (ui.err) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
    st.className = 'runstatus' + (ui.err ? ' err' : '');
    st.textContent = ui.text;
    if (ui.link && !ui.busy){ var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-sample', ''); b.textContent = T.sampleLink; st.appendChild(b); }
    if (bar) bar.hidden = !ui.busy;
  }
  function say(text, err, link){ ui.text = text; ui.err = !!err; ui.link = !!link; paint(); }
  function mount(report){
    ROOT.innerHTML = TEMPLATE;
    try { hcBoot(report || null); } catch (e){ if (window.console) console.error(e); }
    var f = $('runForm'), inp = $('runUrl'), st = $('runStatus');
    if (f) f.addEventListener('submit', onSubmit);
    if (inp) inp.addEventListener('input', function(){ ui.value = inp.value; if (ui.err){ ui.err = false; inp.removeAttribute('aria-invalid'); } });
    if (st) st.addEventListener('click', function(e){ if (!e.target.closest('[data-sample]')) return; setRef(null); ui.value = ''; ui.text = T.sample; ui.err = false; ui.link = false; mount(null); });
    wireOrder(report);
    paint();
  }

  /* ---------- full report order form ---------- */
  var O = {                                                    /* all [v5.2] */
    url: 'Add your website address.', name: 'Add your name.', email: 'Add an email address we can send your report to.',
    comp: 'For a competitor, add both their company name and their website, or leave both blank.', compUrl: 'That competitor’s website address doesn’t look right.',
    consent: 'Please tick to agree to the privacy notice.', off: 'We’re not taking full report orders just yet, so nothing has been sent or charged.',
    making: 'Setting up your secure payment…', go: 'Taking you to Stripe to pay…', link: 'Continue to secure payment', failed: 'Your order couldn’t be started. Nothing has been charged. Try again in a few minutes.'
  };
  function wireOrder(report){
    var card = document.querySelector('.pt-card'), f = $('ptForm'); if (!card || !f) return;
    var err = $('ptErr'), st = $('ptStatus'), pay = $('ptPay');
    function open(){ f.hidden = false; card.classList.add('open'); $('ptOpen').hidden = true;
      var u = $('ptUrl'); if (!u.value) u.value = (report && report.domain) || (okUrl(ui.value) ? bare(ui.value) : '');
      try { (u.value ? $('ptName') : u).focus(); } catch (e){} }
    function close(){ f.hidden = true; card.classList.remove('open'); $('ptOpen').hidden = false; err.textContent = ''; st.textContent = ''; }
    $('ptOpen').addEventListener('click', open);
    document.querySelectorAll('[data-pt-open]').forEach(function(b){ b.addEventListener('click', function(){ open(); try { card.scrollIntoView({behavior:'smooth', block:'center'}); } catch (e){} }); });
    $('ptCancel').addEventListener('click', close);
    f.addEventListener('submit', function(e){
      e.preventDefault(); st.textContent = '';
      f.querySelectorAll('[aria-invalid]').forEach(function(x){ x.removeAttribute('aria-invalid'); });
      var v = function(id){ return ($(id).value || '').trim(); };
      var bad = function(id, msg){ $(id).setAttribute('aria-invalid', 'true'); err.textContent = msg; try { $(id).focus(); } catch (x){} };
      var cn = v('ptCompName'), cu = v('ptCompUrl');
      if (!okUrl(v('ptUrl'))) return bad('ptUrl', O.url);
      if (!v('ptName')) return bad('ptName', O.name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('ptEmail'))) return bad('ptEmail', O.email);
      if (!!cn !== !!cu) return bad(cn ? 'ptCompUrl' : 'ptCompName', O.comp);
      if (cu && !okUrl(cu)) return bad('ptCompUrl', O.compUrl);
      if (!$('ptConsent').checked) return bad('ptConsent', O.consent);
      err.textContent = '';
      var order = {url: v('ptUrl'), name: v('ptName'), email: v('ptEmail'), competitor: cn ? {name: cn, url: cu} : null, consent: true};
      pay.disabled = true; st.textContent = O.making;
      var tp0 = null;
      transport().then(function(tp){ if (!tp || !tp.order) throw {hc: T.noLive}; tp0 = tp; return tp.isOpen(); }).then(function(open){
        if (!open) throw {hc: O.off};                 /* nothing personal has left the page */
        return tp0.order(order);
      }).then(function(r){
        if (!r || !r.checkout_url || !/^https:\/\/checkout\.stripe\.com\//.test(r.checkout_url)) throw {hc: (r && r.error) || O.failed};
        if (!inArtifact){ st.textContent = O.go; location.href = r.checkout_url; return; }
        st.textContent = ''; var a = document.createElement('a'); a.href = r.checkout_url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = O.link + ' →'; st.appendChild(a); pay.disabled = false;
      }).catch(function(e2){ pay.disabled = false; st.textContent = (e2 && e2.hc) || O.failed; });
    });
  }

  /* ---------- reaching the engine ---------- */
  var transportP = null;
  function transport(){
    if (!transportP) transportP = inArtifact
      ? window.claude.use('mcp').then(function(mcp){ return mcp ? viaConnector(mcp) : null; }, function(){ return null; })
      : Promise.resolve(viaFetch());
    return transportP;
  }
  function viaFetch(){
    function body(r){ return r.json().catch(function(){ return {}; }).then(function(b){ b = b || {}; if (!r.ok && !b.error) b.error = T.failed; return b; }); }
    return {
      start: function(url){ return fetch(API, {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({url:url, source:'web'})}).then(body); },
      read:  function(id){ return fetch(API + '?id=' + encodeURIComponent(id), {cache:'no-store'}).then(body); },
      order: function(o){ return fetch(ORDER_API, {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(o)}).then(body); },
      isOpen: function(){ return fetch(ORDER_API + '?open', {cache:'no-store'}).then(body).then(function(b){ return !!(b && b.open); }); },
      full:  function(token){ return fetch(ORDER_API + '?token=' + encodeURIComponent(token), {cache:'no-store'}).then(body); },
      paid:  function(id){ return fetch(ORDER_API + '?status=' + encodeURIComponent(id), {cache:'no-store'}).then(body); }
    };
  }
  function viaConnector(mcp){
    var kicked = {};
    function sql(q){
      return mcp.callTool(SERVER, 'execute_sql', {project_id: PROJECT, query: q}, {cache:false}).then(function(res){
        var p = res && res.payload; return typeof p === 'string' ? p : (p && typeof p.result === 'string') ? p.result : JSON.stringify(res || '');
      });
    }
    return {
      start: function(url){
        var q = "insert into public.hc_reports (url, source) values ('" + url.replace(/'/g, "''") + "', 'artifact') returning 'HCID:' || id::text || ':END' as r";
        return sql(q).then(function(txt){ var m = /HCID:([0-9a-f-]{36}):END/i.exec(txt); return m ? {id: m[1]} : {error: T.failed}; });
      },
      read: function(id){
        if (!UUID.test(id)) return Promise.resolve({error: T.notFound});
        var q = "select 'HCB64:' || encode(convert_to(json_build_object('status', status, 'error', error, 'report', report, 'age', extract(epoch from now() - created_at))::text, 'UTF8'), 'base64') || ':END' as r from public.hc_reports where id = '" + id + "'";
        return sql(q).then(function(txt){
          var m = /HCB64:([A-Za-z0-9+\/=\\\s]+?):END/.exec(txt); if (!m) return {error: T.notFound};
          var bin = atob(m[1].replace(/\\[nr]/g, '').replace(/[^A-Za-z0-9+\/=]/g, ''));
          var bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          var row = JSON.parse(new TextDecoder('utf-8').decode(bytes));
          /* a run still waiting after 20 s missed its start signal: send it once more */
          if (row && row.status === 'queued' && row.age > 20 && !kicked[id]){
            kicked[id] = true;
            sql("select net.http_post(url := '" + API + "', body := jsonb_build_object('id', id), headers := '{\"Content-Type\":\"application/json\"}'::jsonb) from public.hc_reports where id = '" + id + "' and status = 'queued'").catch(function(){});
          }
          return row;
        });
      },
      isOpen: function(){ return sql("select 'HCOPEN:' || paid_on::text || ':END' as r from public.hc_config where id = 1").then(function(t){ return /HCOPEN:true:END/.test(t); }); },
      /* the customer's full report, by its private token (same data the web route returns) */
      full: function(token){
        if (!/^[0-9a-f]{48}$/.test(token)) return Promise.resolve({error: T.notFound});
        var q = "select 'HCB64:' || encode(convert_to(json_build_object('order', json_build_object('site', regexp_replace(regexp_replace(o.url, '^https?://', ''), '^www\\.', ''), 'competitor_name', o.competitor_name, 'competitor_url', o.competitor_url, 'review', o.review, 'delivered_at', o.delivered_at), 'report', r.report, 'competitor_report', c.report)::text, 'UTF8'), 'base64') || ':END' as r from public.hc_orders o left join public.hc_reports r on r.id = o.report_id left join public.hc_reports c on c.id = o.competitor_report_id where o.access_token = '" + token + "' and o.status in ('delivered', 'review')";
        return sql(q).then(function(txt){
          var m = /HCB64:([A-Za-z0-9+\/=\\\s]+?):END/.exec(txt); if (!m) return {error: T.notFound};
          var bin = atob(m[1].replace(/\\[nr]/g, '').replace(/[^A-Za-z0-9+\/=]/g, ''));
          var bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return JSON.parse(new TextDecoder('utf-8').decode(bytes));
        });
      },
      /* in a Claude artifact: queue the order in the database; the order function makes the Stripe checkout and stores its link */
      order: function(o){
        var q = function(x){ return x == null ? 'null' : "'" + String(x).replace(/'/g, "''") + "'"; };
        var ins = "insert into public.hc_orders (url, customer_name, customer_email, competitor_name, competitor_url, consent_at, source) values (" + [q(o.url), q(o.name), q(o.email), q(o.competitor && o.competitor.name), q(o.competitor && o.competitor.url)].join(', ') + ", now(), 'artifact') returning 'HCID:' || id::text || ':END' as r";
        return sql(ins).then(function(txt){
          var m = /HCID:([0-9a-f-]{36}):END/i.exec(txt); if (!m) return {error: O.failed};
          var id = m[1], tries = 0;
          return new Promise(function(ok){ (function again(){ setTimeout(function(){
            sql("select 'HCURL:' || coalesce(checkout_url, '') || '|' || coalesce(error, '') || ':END' as r from public.hc_orders where id = '" + id + "'").then(function(t){
              var r = /HCURL:([^|]*)\|([^:]*(?::[^E][^:]*)*):END/.exec(t) || [];
              if (r[1]) return ok({checkout_url: r[1]});
              if (r[2]) return ok({error: r[2]});
              if (++tries > 15) return ok({error: O.failed}); again();
            }, function(){ if (++tries > 15) return ok({error: O.failed}); again(); });
          }, 1500); })(); });
        });
      }
    };
  }
  function msgOf(e){
    if (e && e.hc) return e.hc;
    var c = e && e.code;
    if (c === 'server_not_connected' || c === 'needs_reauth' || c === 'selection_required' || c === 'server_not_found') return T.connect;
    if (c === 'not_in_manifest' || c === 'not_granted' || c === 'approval_required' || c === 'consent_required' || c === 'blocked_by_policy') return T.allow;
    if (c) return T.failed;
    return (e instanceof TypeError) ? T.offline : T.failed;
  }

  /* ---------- where the current report lives in the address ---------- */
  function refFromAddress(){
    try { var q = new URLSearchParams(location.search).get('r'); if (q && UUID.test(q)) return q; } catch (e){}
    var h = /^#r-([0-9a-f-]{36})$/i.exec(location.hash || ''); return h && UUID.test(h[1]) ? h[1] : null;
  }
  function setRef(id){
    try {
      if (inArtifact){ if (id) location.hash = 'r-' + id; else if (/^#r-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); }
      else { var u = new URL(location.href); if (id) u.searchParams.set('r', id); else u.searchParams.delete('r'); u.hash = ''; history.replaceState(null, '', u.toString()); }
    } catch (e){}
  }

  /* ---------- run ---------- */
  function poll(tp, id, seq){
    return new Promise(function(ok, no){
      var tries = 0, misses = 0;
      (function again(){
        setTimeout(function(){
          if (seq !== runSeq) return;
          tp.read(id).then(function(row){
            misses = 0; row = row || {};
            if (row.status === 'done' && row.report) return ok(row.report);
            if (row.status === 'error' || (row.error && !row.status)) return no({hc: row.error || T.failed});
            if (++tries > 60) return no({hc: T.slow});
            again();
          }, function(err){ if (err && err.code && !err.retryable) return no(err); if (++misses > 3 || ++tries > 60) return no(err); again(); });
        }, tries < 2 ? 2500 : 3500);
      })();
    });
  }
  function stopTick(){ if (tick){ clearInterval(tick); tick = null; } }
  function when(iso){ var t = Date.parse(iso); if (!t) return ''; var mins = Math.round((Date.now() - t) / 60000); if (mins < 3) return 'just now';
    try { return 'on ' + new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'Europe/London'}).format(new Date(t)); } catch (e){ return 'on ' + String(iso).slice(0, 10); } }
  function finish(report, id){
    stopTick(); ui.busy = false; setRef(id);
    ui.value = report.domain || ui.value; ui.text = fill(T.ready, {d: report.domain || '', when: when(report.tested)}); ui.err = false; ui.link = true;
    mount(report);
    try { window.scrollTo(0, 0); } catch (e){}
  }
  function fail(e){ stopTick(); ui.busy = false; say(msgOf(e), true, false); }
  function onSubmit(e){
    e.preventDefault(); if (ui.busy || !ui.live) return;
    var raw = ($('runUrl').value || '').trim(); ui.value = raw;
    if (!okUrl(raw)){ say(T.badUrl, true, false); try { $('runUrl').focus(); } catch (x){} return; }
    var seq = ++runSeq, t0 = Date.now(), d = bare(raw);
    ui.busy = true; say(fill(T.running, {d: d, n: 0}), false, false);
    stopTick(); tick = setInterval(function(){ if (seq === runSeq && ui.busy) say(fill(T.running, {d: d, n: Math.round((Date.now() - t0) / 1000)}), false, false); }, 1000);
    var runId = null;
    transport().then(function(tp){
      if (!tp) throw {hc: T.noLive};
      return tp.start(raw).then(function(b){ if (!b || !b.id) throw {hc: (b && b.error) || T.failed}; runId = b.id; return poll(tp, b.id, seq); });
    }).then(function(report){ if (seq === runSeq) finish(report, runId); }, function(err){ if (seq === runSeq) fail(err); });
  }

  /* ---------- the paid full report report: the automatic report with the marketing specialist's review laid over it ---------- */
  function mergeFull(d){
    var rep = JSON.parse(JSON.stringify(d.report || {})), rv = (d.order && d.order.review) || {}, ch = rv.checks || {};
    rep.checks = rep.checks || {};
    Object.keys(ch).forEach(function(k){
      var x = ch[k] || {}, c = rep.checks[k] || (rep.checks[k] = {});
      if (typeof x.score === 'number' && isFinite(x.score)) { c.score = Math.max(0, Math.min(10, Math.round(x.score * 10) / 10)); c.basis = 'designer'; }
      if (x.found) c.flaw = String(x.found);
      c.note = x.note ? 'Specialist’s note: ' + x.note : (c.basis === 'designer' ? 'Checked by a marketing specialist.' : c.note);
    });
    var cr = d.competitor_report, o = d.order || {};
    rep.full = { summary: rv.summary || '', priorities: (rv.priorities || []).filter(Boolean), competitorNote: rv.competitor_note || '', delivered_at: o.delivered_at,
      competitor: cr ? { name: o.competitor_name || cr.name, domain: bare(o.competitor_url || cr.domain), url: 'https://' + bare(o.competitor_url || cr.domain), values: cr.values || {} } : null };
    return rep;
  }
  function fullFromAddress(){
    try { var q = new URLSearchParams(location.search).get('full'); if (q && /^[0-9a-f]{48}$/.test(q)) return q; } catch (e){}
    var h = /^#full-([0-9a-f]{48})$/.exec(location.hash || ''); return h ? h[1] : null;
  }
  var P = {                                                    /* [v5.2] */
    loading: 'Loading your full report…', ready: 'Your full report for {d}, reviewed by a 34 Automation marketing specialist.',
    paid: 'Payment received, thank you. Your full report for {d} will be with you by email by {due}.',
    paidSoon: 'Payment received, thank you. Your full report will be with you by email within 3 working hours.',
    cancelled: 'Payment cancelled. Nothing has been charged.', missing: 'That report link isn’t valid, or the report isn’t ready yet.'
  };

  /* ---------- start ---------- */
  mount(null);
  var ref = refFromAddress(), fullTok = fullFromAddress(), qs = {};
  try { var sp = new URLSearchParams(location.search); qs.paid = sp.get('paid'); qs.cancelled = sp.get('cancelled'); } catch (e){}
  if (fullTok){
    ref = null; var seqF = ++runSeq; ui.busy = true; say(P.loading, false, false);
    transport().then(function(tp){ if (!tp || !tp.full) throw {hc: T.noLive}; return tp.full(fullTok); }).then(function(d){
      if (seqF !== runSeq) return;
      if (!d || !d.report) throw {hc: (d && d.error) || P.missing};
      var rep = mergeFull(d); stopTick(); ui.busy = false; ui.value = rep.domain || ''; ui.err = false; ui.link = false;
      ui.text = fill(P.ready, {d: rep.domain || ''}); mount(rep); try { window.scrollTo(0, 0); } catch (e){}
    }).catch(function(err){ if (seqF === runSeq) fail(err); });
  } else if (qs.paid && UUID.test(qs.paid)){
    say(P.paidSoon, false, false);
    transport().then(function(tp){ return tp && tp.paid ? tp.paid(qs.paid) : null; }).then(function(r){ if (r && r.due_text) say(fill(P.paid, {d: r.site || '', due: r.due_text}), false, false); }).catch(function(){});
  } else if (qs.cancelled){ say(P.cancelled, false, false); }
  if (ref && !fullTok){
    var seq0 = ++runSeq; ui.busy = true; say(T.loading, false, false);
    transport().then(function(tp){ if (!tp) throw {hc: T.noLive}; return tp.read(ref); })
      .then(function(row){ if (seq0 !== runSeq) return; if (row && row.status === 'done' && row.report) finish(row.report, ref); else if (row && (row.status === 'running' || row.status === 'queued')) return transport().then(function(tp){ return poll(tp, ref, seq0); }).then(function(rep){ if (seq0 === runSeq) finish(rep, ref); }); else throw {hc: (row && row.error) || T.notFound}; })
      .catch(function(err){ if (seq0 === runSeq) fail(err); });
  } else if (inArtifact){
    transport().then(function(tp){ if (!tp){ ui.live = false; say(T.noLive, false, false); } });
  }
})();
