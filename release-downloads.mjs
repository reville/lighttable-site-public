import { releaseManifest } from './release-data.mjs?release=c2822d51ef1752bb';

export function manifestReleases(manifest = releaseManifest) {
  return Object.entries(manifest.platforms).filter(([, entry]) => entry.state === 'published').map(([key, entry]) => ({
    tag_name: key === 'macos-arm64' && entry.version.includes('-') ? `macos-v${entry.version}` : `v${entry.version}`,
    draft: false, prerelease: entry.version.includes('-'), published_at: entry.published_at,
    assets: entry.artifacts.map(artifact => ({ name: artifact.name, browser_download_url: artifact.url, size: artifact.bytes, state: 'uploaded' })),
  }));
}
export function manifestDownload(platform, architecture, manifest = releaseManifest) {
  const key = { linux: { x86_64: 'linux-x86_64' }, arch: { x86_64: 'linux-x86_64' }, windows: { x86_64: 'windows-x64' }, macos: { arm64: 'macos-arm64' } }[platform]?.[architecture];
  const entry = key && manifest.platforms[key];
  if (!entry || entry.state !== 'published') return null;
  const endings = { linux: '-linux-x86_64.tar.gz', windows: '-windows-x64-setup.exe', macos: '-macos-arm64.dmg', arch: '-x86_64.pkg.tar.zst' };
  const candidates = entry.artifacts.filter(artifact => artifact.name.endsWith(endings[platform]));
  if (platform === 'arch') candidates.sort((a, b) => Number(b.name.match(/-(\d+)-x86_64/)[1]) - Number(a.name.match(/-(\d+)-x86_64/)[1]));
  const artifact = candidates[0];
  if (!artifact) return null;
  const asAsset = item => item && ({ name: item.name, browser_download_url: item.url, size: item.bytes, state: 'uploaded' });
  return { asset: asAsset(artifact), checksum: asAsset(entry.artifacts.find(item => item.name === `${artifact.name}.sha256`)) || null,
    version: entry.version, architecture, experimental: false };
}
export { releaseManifest };
