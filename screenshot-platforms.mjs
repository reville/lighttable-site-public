import { platformLabels, requestedPlatform, selectedPlatform as screenshotPlatform, platformLink } from './platform.mjs?v=20260908-text';
export { requestedPlatform, screenshotPlatform, platformLink };

export function selectSet(catalog, platform, ids) {
  if (!Object.hasOwn(platformLabels, platform)) return null;
  const images = catalog?.schema === 1 && catalog.platforms?.[platform]?.images;
  if (!images || !ids.every(id => {
    const entry = images[id];
    const validFile = file => typeof file === 'string'
      && new RegExp(`^screenshots/${platform === 'macos' ? '' : `${platform}/`}[a-z0-9-]+\\.webp$`).test(file);
    return entry && validFile(entry.src) && Number.isInteger(entry.width) && entry.width > 0
      && Number.isInteger(entry.height) && entry.height > 0 && Array.isArray(entry.variants)
      && entry.variants.every(variant => validFile(variant.src)
        && Number.isInteger(variant.width) && variant.width > 0 && variant.width < entry.width);
  })) return null;
  return images;
}

export async function applyScreenshots(page = document, device = navigator, fetcher = fetch) {
  const images = [...page.querySelectorAll('img[data-screenshot]')];
  const search = page.location?.search || '';
  const platform = screenshotPlatform(device, search);
  const override = requestedPlatform(search);
  if (!images.length) return;
  if (override) {
    for (const link of page.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      const selected = platformLink(href, override);
      if (href !== selected) link.setAttribute('href', selected);
    }
  }
  const notices = page.querySelectorAll('[data-screenshot-notice]');
  const announce = available => notices.forEach(notice => {
    notice.textContent = available ? `${platformLabels[platform]} screenshots`
      : `Showing macOS screenshots. ${platformLabels[platform]} screenshots are not available yet.`;
    notice.hidden = false;
  });
  if (platform && platform !== 'macos') announce(false);
  let selected;
  try {
    const response = await fetcher(new URL('./screenshots/platforms.json', import.meta.url), { cache: 'no-cache' });
    if (!response.ok) return;
    const catalog = await response.json();
    const ids = images.map(image => image.dataset.screenshot);
    selected = selectSet(catalog, platform, ids);
    for (const picker of page.querySelectorAll('[data-screenshot-picker]')) {
      const choices = Object.keys(platformLabels).filter(key => selectSet(catalog, key, ids));
      picker.replaceChildren();
      for (const key of choices) {
        if (picker.childNodes.length) picker.append(' · ');
        const link = page.createElement('a');
        const target = new URL(page.location.href);
        target.searchParams.set('platform', key);
        link.href = `${target.search}${target.hash}`;
        link.textContent = platformLabels[key];
        link.dataset.screenshotChoice = key;
        link.setAttribute('aria-current', key === (selected ? platform : 'macos') ? 'true' : 'false');
        picker.append(link);
      }
      picker.hidden = choices.length < 2;
    }
  } catch { return; }
  if (!platform || platform === 'macos' || !selected) return;

  const attributes = ['src', 'srcset', 'width', 'height', 'alt'];
  const originals = images.map(image => ({ image,
    values: attributes.map(name => [name, image.getAttribute(name)]),
    link: image.closest('a'), href: image.closest('a')?.getAttribute('href'),
  }));
  let failed = false;
  const restore = () => {
    if (failed) return;
    failed = true;
    for (const { image, values, link, href } of originals) {
      // Set srcset before src to keep the browser's responsive candidate in sync.
      for (const [name, value] of values.filter(([name]) => name !== 'src')) {
        if (value === null) image.removeAttribute(name); else image.setAttribute(name, value);
      }
      image.setAttribute('src', values[0][1]);
      image.dataset.screenshotPlatform = 'macos';
      if (link && href) link.setAttribute('href', href);
    }
    for (const link of page.querySelectorAll('[data-screenshot-choice]')) {
      link.setAttribute('aria-current', link.dataset.screenshotChoice === 'macos' ? 'true' : 'false');
    }
    announce(false);
  };
  for (const { image, link, href } of originals) {
    const entry = selected[image.dataset.screenshot];
    image.addEventListener('error', restore, { once: true });
    image.setAttribute('width', entry.width);
    image.setAttribute('height', entry.height);
    if (entry.alt) image.alt = entry.alt;
    if (entry.variants.length) {
      image.srcset = [...entry.variants, { src: entry.src, width: entry.width }]
        .map(variant => `${variant.src} ${variant.width}w`).join(', ');
    } else image.removeAttribute('srcset');
    image.src = entry.src;
    image.dataset.screenshotPlatform = platform;
    if (link && href?.startsWith('screenshots/')) link.setAttribute('href', entry.src);
  }
  announce(true);
}

if (typeof document !== 'undefined') void applyScreenshots();
