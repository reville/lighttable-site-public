(() => {
  'use strict';
  const measurementId = 'G-3M1WW9FT8P';
  const preferenceKey = 'lighttable-analytics-consent';
  const production = ['lighttable.app', 'www.lighttable.app'].includes(location.hostname);
  let started = false;
  let choice;
  try { choice = localStorage.getItem(preferenceKey); } catch {}

  function start() {
    if (!production || choice !== 'accepted' || !/^G-[A-Z0-9]+$/.test(measurementId)) return;
    window['ga-disable-' + measurementId] = false;
    if (started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
      page_referrer: cleanUrl(document.referrer),
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.append(tag);
  }

  function cleanUrl(value) {
    try { const url = new URL(value); return url.origin + url.pathname; }
    catch { return ''; }
  }

  function clearCookies() {
    // Clear GA cookies set on this host or its parent domain on withdrawal.
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (name !== '_ga' && !name.startsWith('_ga_')) continue;
      for (const domain of ['', location.hostname, '.lighttable.app']) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' +
          (domain ? '; domain=' + domain : '');
      }
    }
  }

  function save(value) {
    choice = value;
    try { localStorage.setItem(preferenceKey, choice); } catch {}
    panel.hidden = true;
    if (choice === 'accepted') start();
    else {
      window['ga-disable-' + measurementId] = true;
      clearCookies();
    }
  }

  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-label', 'Website analytics preferences');
  panel.innerHTML = '<p>Allow website analytics? We use Google Analytics to understand visits and download clicks. <a href="/privacy.html">Privacy details</a></p><div><button type="button" data-analytics-choice="declined">No thanks</button><button type="button" data-analytics-choice="accepted">Allow analytics</button></div>';
  panel.hidden = choice === 'accepted' || choice === 'declined';
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-analytics-choice]');
    if (button) save(button.dataset.analyticsChoice);
  });
  document.body.append(panel);
  document.querySelectorAll('[data-analytics-settings]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      panel.hidden = false;
      panel.querySelector('button').focus();
    });
  });

  // DMG and native preset files are not covered by GA enhanced downloads.
  // A separate event also keeps app/preset download intent easy to report.
  document.addEventListener('click', (event) => {
    if (choice !== 'accepted' || !started) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (!['https:', 'http:'].includes(url.protocol)) return;
    const match = url.pathname.match(/\.(dmg|exe|msi|pkg|zip|gz|zst|AppImage|ltpreset)$/i);
    if (!match) return;
    window.gtag('event', 'download_click', {
      link_url: url.origin + url.pathname,
      file_name: url.pathname.split('/').pop(),
      file_extension: match[1].toLowerCase(),
      download_type: match[1].toLowerCase() === 'ltpreset' ? 'preset' : 'app',
    });
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== preferenceKey && event.key !== null) return;
    choice = event.newValue;
    panel.hidden = choice === 'accepted' || choice === 'declined';
    if (choice === 'accepted') start();
    else {
      window['ga-disable-' + measurementId] = true;
      clearCookies();
    }
  });
  start();
})();
