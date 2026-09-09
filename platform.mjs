// Keep text, screenshot, and download selection consistent. Detection is only a hint;
// mobile/unknown devices use the default screenshot set.
export const platformLabels = { macos: 'macOS', windows: 'Windows', linux: 'Linux' };

export function detectPlatform(device = navigator) {
  const hints = device.userAgentData;
  const platform = hints?.platform || device.platform || '';
  const agent = device.userAgent || '';
  if (hints?.mobile || /Android|iPhone|iPad|iPod|CrOS|Windows Phone/i.test(`${platform} ${agent}`)
      || (/Mac/i.test(platform) && device.maxTouchPoints > 1)) return null;
  if (/^mac/i.test(platform)) return 'macos';
  if (/^win/i.test(platform)) return 'windows';
  if (/^linux/i.test(platform)) return 'linux';
  if (/Windows NT/i.test(agent)) return 'windows';
  if (/Macintosh/i.test(agent)) return 'macos';
  if (/Linux|X11.*Ubuntu/i.test(agent)) return 'linux';
  return null;
}

export function requestedPlatform(search = '') {
  const platform = new URLSearchParams(search).get('platform');
  return Object.hasOwn(platformLabels, platform) ? platform : null;
}

export function selectedPlatform(device = navigator, search = '') {
  return requestedPlatform(search) || detectPlatform(device);
}

export function platformLink(href, platform) {
  if (!Object.hasOwn(platformLabels, platform)
    || !/^(?:\.\/|(?:index|screenshots|features)\.html)(?:[?#].*)?$/.test(href)) return href;
  const target = new URL(href, 'https://lighttable.invalid/');
  target.searchParams.set('platform', platform);
  return `${href.split(/[?#]/)[0]}${target.search}${target.hash}`;
}
