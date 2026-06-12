/* ============================================================
   MUUD Ring — pre-launch landing page
   Voice & tone per Brand Kit §02: grounded, spare, warm, honest.
   No exclamation marks in feedback. No "Oops". No emoji.
   ============================================================ */

(() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Pipedream endpoint receives the lead and writes to Google Sheet + Slack + welcome email
  // Google Apps Script Web App endpoint — MUUD Ring lead capture
  // Deploy via Apps Script: Deploy → New deployment → Web app → Anyone → /exec URL
  // See kickstarter_push/track4/gas_lead_capture/DEPLOY_INSTRUCTIONS.md
  // TODO(armin): replace YOUR_DEPLOYMENT_ID with the /exec URL after deploying GAS.
  const ENDPOINT = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

  const forms = document.querySelectorAll("form.signup");

  forms.forEach((form) => {
    const id = form.id; // signup-hero | signup-final
    const input = form.querySelector("input[type='email']");
    const button = form.querySelector("button[type='submit']");
    const msg = form.querySelector(".signup__msg");
    const source = button?.dataset.source || "unknown";

    const setMsg = (text, state) => {
      if (!msg) return;
      msg.textContent = text;
      msg.dataset.state = state;
      msg.hidden = false;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (input?.value || "").trim();

      if (!EMAIL_RE.test(email)) {
        input?.classList.add("input--error");
        setMsg("That email doesn't look quite right. Please check and try again.", "error");
        input?.focus();
        return;
      }
      input?.classList.remove("input--error");

      button.disabled = true;
      const originalLabel = button.textContent;
      button.textContent = "Saving…";

      try {
        const payload = {
          email,
          source,
          form_id: id,
          page_url: window.location.href,
          referrer: document.referrer || null,
          submitted_at: new Date().toISOString(),
          utm: {
            source: new URLSearchParams(window.location.search).get("utm_source"),
            medium: new URLSearchParams(window.location.search).get("utm_medium"),
            campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
            content: new URLSearchParams(window.location.search).get("utm_content"),
          },
        };

        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("submission failed");

        // Meta Pixel Lead event
        if (typeof fbq === "function") fbq("track", "Lead", { source });
        // GA4 generate_lead
        if (typeof gtag === "function") gtag("event", "generate_lead", { source });

        setMsg("You're on the list. We'll email you the moment the campaign opens.", "success");
        form.reset();
      } catch (err) {
        setMsg("We couldn't save your email. Please try again in a moment.", "error");
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    });

    input?.addEventListener("input", () => {
      input.classList.remove("input--error");
      if (msg) msg.hidden = true;
    });
  });
})();

// ============================================================
// ADA Patch: FAQ <details> ARIA enhancement (WCAG 4.1.2)
// Mirrors open state into aria-expanded for VoiceOver iOS
// ============================================================
(function() {
  'use strict';
  document.querySelectorAll('details.faq').forEach(function(details) {
    var summary = details.querySelector('summary');
    if (!summary) return;
    function syncAria() {
      summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');
    }
    syncAria();
    details.addEventListener('toggle', syncAria);
    summary.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        details.open = !details.open;
      }
    });
  });
})();

// ============================================================
// Hero countdown to Kickstarter launch — June 23, 2026
// ============================================================
(function() {
  'use strict';
  var el = document.getElementById('countdown-days');
  if (!el) return;
  var launch = new Date('2026-06-23T08:00:00-07:00'); // 8am PT
  function update() {
    var now = new Date();
    var ms = launch - now;
    if (ms <= 0) {
      el.textContent = 'Live';
      var label = document.querySelector('.hero__countdown-label');
      if (label) label.textContent = 'Kickstarter is live';
      return;
    }
    var days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    el.textContent = days;
  }
  update();
  setInterval(update, 60 * 60 * 1000); // hourly refresh
})();
