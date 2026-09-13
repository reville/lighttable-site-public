import { manifestReleases } from "./release-downloads.mjs?release=66ab6c923d9e4133";
import { detectArchitecture, selectDownload } from './downloads.mjs?release=66ab6c923d9e4133';

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
  if (loadFailed) { status.textContent = 'Release lookup is unavailable. Use View published releases to check manually.'; return; }
  if (!releases) { status.textContent = 'Checking published Windows releases…'; return; }
  const emulated = choice.value === 'arm64';
  const download = selectDownload(releases, 'windows', emulated ? 'x86_64' : choice.value);
  if (!download) { status.textContent = 'The Windows installer is being prepared. No compatible published download is available yet.'; return; }
  status.textContent = emulated
    ? `LightTable ${download.version} · Windows 11 ARM · x64 emulation · experimental support`
    : `LightTable ${download.version} · Windows x64 · experimental support`;
  installer.textContent = emulated ? 'Download Windows x64 for emulation' : 'Download for Windows';
  installer.href = download.asset.browser_download_url;
  installer.hidden = false;
  if (download.checksum) { checksum.href = download.checksum.browser_download_url; checksum.hidden = false; }
}
choice.addEventListener('change', refresh);
detectArchitecture().then(value => { if (!choice.value && value) choice.value = value; refresh(); });
Promise.resolve(manifestReleases()).then(value => { releases = value; refresh(); }).catch(() => { loadFailed = true; refresh(); });
