(() => {
  'use strict';
  const measurementId = 'G-3M1WW9FT8P';
  const production = ['lighttable.app', 'www.lighttable.app'].includes(location.hostname);
  if (!production || !/^G-[A-Z0-9]+$/.test(measurementId)) return;

  function cleanUrl(value) {
    try { const url = new URL(value); return url.origin + url.pathname; }
    catch { return ''; }
  }

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

  // DMG and native preset files are not covered by GA enhanced downloads.
  // A separate event also keeps app/preset download intent easy to report.
  document.addEventListener('click', (event) => {
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
})();
