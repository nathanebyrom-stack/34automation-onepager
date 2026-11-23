// Section 07 · "Get your free report" opens the choice between the free and the full report.
// Without JavaScript the button is a plain link to the free report. Load with <script src="/js/report-choice.js" defer>.
(function () {
  var btn = document.getElementById('reportOpen'), panel = document.getElementById('reportChoice');
  if (!btn || !panel) return;
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'reportChoice');
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var opening = panel.hidden;
    panel.hidden = !opening;
    btn.setAttribute('aria-expanded', String(opening));
    if (opening) {
      var h = panel.querySelector('.rc-h');
      try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (x) {}
      if (h) h.focus({ preventScroll: true });
    }
  });
})();
