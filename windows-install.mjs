import { detectArchitecture, fetchReleases, selectDownload } from './downloads.mjs';

const choice = document.querySelector('#windows-architecture');
const status = document.querySelector('#windows-release-status');
const installer = document.querySelector('#windows-installer-download');
const checksum = document.querySelector('#windows-checksum-download');
let releases = null;
let loadFailed = false;
function refresh() {
  installer.hidden = checksum.hidden = true;
  installer.removeAttribute('href');
  checksum.removeAttribute('href');
  if (!choice.value) { status.textContent = 'Choose your processor to check published Windows releases.'; return; }
  if (choice.value === 'arm64') { status.textContent = 'A native Windows ARM64 package is not available. The x64 installer is not offered for this processor.'; return; }
  if (loadFailed) { status.textContent = 'Release lookup is unavailable. Use View published releases to check manually.'; return; }
  if (!releases) { status.textContent = 'Checking published Windows releases…'; return; }
  const download = selectDownload(releases, 'windows', choice.value);
  if (!download) { status.textContent = 'The Windows installer is being prepared. No compatible published download is available yet.'; return; }
  status.textContent = `LightTable ${download.version} · Windows x64 · experimental support`;
  installer.href = download.asset.browser_download_url;
  installer.hidden = false;
  if (download.checksum) { checksum.href = download.checksum.browser_download_url; checksum.hidden = false; }
}
choice.addEventListener('change', refresh);
detectArchitecture().then(value => { if (!choice.value && value) choice.value = value; refresh(); });
fetchReleases(fetch, { signal: AbortSignal.timeout(12000) }).then(value => { releases = value; refresh(); }).catch(() => { loadFailed = true; refresh(); });
