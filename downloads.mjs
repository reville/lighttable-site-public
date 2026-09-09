export const RELEASES_URL = 'https://github.com/reville/lighttable-digital-darkroom/releases';
export const RELEASES_API = 'https://api.github.com/repos/reville/lighttable-digital-darkroom/releases';

const formats = {
  arch: /^lighttable-bin-(\d+\.\d+\.\d+)-([1-9]\d*)-(x86_64)\.pkg\.tar\.zst$/,
  linux: /^LightTable-(\d+\.\d+\.\d+)-linux-(x86_64|aarch64)\.tar\.gz$/,
  macos: /^LightTable-(\d+\.\d+\.\d+)-macos-(arm64|x86_64|universal)\.(dmg|pkg|zip)$/,
  windows: /^LightTable-(\d+\.\d+\.\d+)-windows-(x64|arm64)-(setup)\.(exe|msi)$/,
};

export function normalizeArchitecture(architecture, bitness = '') {
  if (/^(arm64|aarch64)$/i.test(architecture) || (/^arm$/i.test(architecture) && bitness === '64')) return 'arm64';
  if (/^(x86_64|amd64|x64)$/i.test(architecture) || (/^x86$/i.test(architecture) && bitness === '64')) return 'x86_64';
  return null;
}

export async function detectArchitecture(device = navigator) {
  try {
    const hints = await device.userAgentData?.getHighEntropyValues?.(['architecture', 'bitness']);
    const architecture = hints && normalizeArchitecture(hints.architecture, hints.bitness);
    if (architecture) return architecture;
  } catch { /* Architecture hints can be unavailable or denied. */ }
  const legacy = `${device.platform || ''} ${device.userAgent || ''}`;
  if (/aarch64|arm64/i.test(legacy)) return 'arm64';
  if (/x86_64|amd64|Win64|WOW64|\bx64\b/i.test(legacy)) return 'x86_64';
  // MacIntel and Win32 do not reliably identify the processor architecture.
  return null;
}

export function validReleaseAsset(asset, tagName = null) {
  if (!asset || typeof asset.name !== 'string' || (asset.state && asset.state !== 'uploaded')
      || (typeof asset.size === 'number' && asset.size <= 0)) return false;
  try {
    const url = new URL(asset.browser_download_url);
    const parts = url.pathname.split('/');
    return url.origin === 'https://github.com' && !url.username && !url.password && !url.search && !url.hash
      && parts.length === 7 && parts.slice(1, 5).join('/') === 'reville/lighttable-digital-darkroom/releases/download'
      && decodeURIComponent(parts[6]) === asset.name && !!parts[5]
      && (tagName === null || decodeURIComponent(parts[5]) === tagName);
  } catch { return false; }
}

export function matchingAsset(assets, platform, architecture, { version = null, tagName = null } = {}) {
  if (!Object.hasOwn(formats, platform) || !['x86_64', 'arm64'].includes(architecture)) return null;
  const candidates = assets.filter(asset => validReleaseAsset(asset, tagName)).map(asset => {
    const match = asset.name.match(formats[platform]);
    if (!match || (version !== null && match[1] !== version)) return null;
    const assetArchitecture = platform === 'arch' ? match[3] : match[2];
    const compatible = assetArchitecture === 'universal' || normalizeArchitecture(assetArchitecture) === architecture;
    if (!compatible) return null;
    if (platform === 'arch' && !Number.isSafeInteger(Number(match[2]))) return null;
    return { asset, version: match[1], priority: platform === 'arch' ? -Number(match[2]) : ({ dmg: 0, pkg: 1, zip: 2 }[match[3]] ?? 0) };
  }).filter(Boolean).sort((a, b) => a.priority - b.priority);
  return candidates[0] || null;
}

export function selectDownload(releases, platform, architecture) {
  const candidates = [];
  for (const release of releases) {
    if (!release || release.draft || release.prerelease || !Number.isFinite(Date.parse(release.published_at))) continue;
    // Canonical stable tags are vMAJOR.MINOR.PATCH (legacy unprefixed tags also
    // work). Do not infer a release version from an arbitrary attached file.
    const tag = typeof release.tag_name === 'string'
      && release.tag_name.match(/^v?((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/);
    if (!tag) continue;
    const versionParts = tag[1].split('.').map(Number);
    if (!versionParts.every(Number.isSafeInteger)) continue;
    const selected = matchingAsset(Array.isArray(release.assets) ? release.assets : [], platform, architecture,
      { version: tag[1], tagName: release.tag_name });
    if (!selected) continue;
    const checksum = release.assets.find(asset => asset.name === `${selected.asset.name}.sha256`
      && validReleaseAsset(asset, release.tag_name));
    candidates.push({ ...selected, release, checksum: checksum || null, architecture, versionParts,
      experimental: platform === 'linux' && architecture === 'arm64' });
  }
  candidates.sort((a, b) => {
    for (let index = 0; index < 3; index++) {
      const difference = b.versionParts[index] - a.versionParts[index];
      if (difference) return difference;
    }
    return (platform === 'arch' ? a.priority - b.priority : 0) || Number(!!b.checksum) - Number(!!a.checksum)
      || Date.parse(b.release.published_at) - Date.parse(a.release.published_at);
  });
  return candidates[0] || null;
}

export async function fetchReleases(fetcher = fetch, { maxPages = 3, signal } = {}) {
  const releases = [];
  // Bounded pagination includes platform-only releases not marked GitHub's latest.
  for (let page = 1; page <= maxPages; page++) {
    const response = await fetcher(`${RELEASES_API}?per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json' }, signal,
    });
    if (!response.ok) throw new Error('Published releases could not be checked');
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Unexpected release response');
    releases.push(...batch);
    if (batch.length < 100) break;
  }
  return releases;
}
