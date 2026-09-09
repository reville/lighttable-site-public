import { detectArchitecture, fetchReleases, selectDownload } from './downloads.mjs';
import { detectPlatform } from './platform.mjs';

const listings = {
  flathub: 'https://flathub.org/apps/app.lighttable.LightTable',
  aur: 'https://aur.archlinux.org/packages/lighttable-bin',
  snap: 'https://snapcraft.io/lighttable',
};
const names = { flathub: 'Flathub', aur: 'AUR', snap: 'Snap Store' };
const distributions = {
  omarchy: { label: 'Omarchy', family: 'arch' }, arch: { label: 'Arch Linux', family: 'arch' },
  ubuntu: { label: 'Ubuntu 24.04 or later', family: 'ubuntu' }, other: { label: 'Another distribution', family: 'other' },
};
const dependencies = {
  arch: 'sudo pacman -S --needed gtk3 webkit2gtk-4.1 xdotool openblas gcc-libs openssl \\\n  libglvnd vulkan-icd-loader lcms2 xdg-utils glib2 gvfs zenity desktop-file-utils xdg-desktop-portal',
  ubuntu: 'sudo apt-get install libgtk-3-0t64 libwebkit2gtk-4.1-0 libxdo3 \\\n  libopenblas0 libgomp1 libssl3t64 libgl1 libegl1 libvulkan1 liblcms2-2 \\\n  xdg-utils libglib2.0-bin gvfs zenity desktop-file-utils xdg-desktop-portal xdg-desktop-portal-gtk',
};

export function validateConfig(config) {
  if (config?.schema !== 1 || config.appId !== 'app.lighttable.LightTable'
      || !/^\d+\.\d+\.\d+$/.test(config.packageVersion) || typeof config.displayVersion !== 'string') throw new Error('Invalid Linux installation configuration');
  for (const name of Object.keys(listings)) {
    const channel = config.channels?.[name];
    if (!channel || !['pending', 'available'].includes(channel.status)) throw new Error(`Invalid ${name} status`);
    if (channel.status === 'pending' && channel.url !== null) throw new Error(`Pending ${name} cannot link to a listing`);
    if (channel.status === 'available' && (channel.url !== listings[name] || !channel.verifiedAt || !Number.isFinite(Date.parse(channel.verifiedAt)))) {
      throw new Error(`Verify the published ${name} listing before enabling it`);
    }
  }
  if (config.channels.aur.package !== 'lighttable-bin' || config.channels.snap.package !== 'lighttable') throw new Error('Unexpected Linux package identity');
  return config;
}

export function channelInstructions(config, name) {
  validateConfig(config);
  if (config.channels[name]?.status !== 'available') return null;
  return {
    flathub: { install: `flatpak install flathub ${config.appId}`, update: `flatpak update ${config.appId}`, uninstall: `flatpak uninstall ${config.appId}` },
    aur: { install: 'yay -S lighttable-bin', update: 'yay -Syu', uninstall: 'sudo pacman -R lighttable-bin' },
    snap: { install: 'sudo snap install lighttable', update: 'sudo snap refresh lighttable', uninstall: 'sudo snap remove lighttable' },
  }[name];
}

export function archiveInstructions(download) {
  if (!download?.checksum) return null;
  const name = download.asset.name;
  const directory = `$HOME/Applications/LightTable-${download.version}`;
  const install = [`sha256sum -c ${name}.sha256`,
    `mkdir -p "${directory}"`, `tar -xzf ${name} -C "${directory}"`, `"${directory}/LightTable/install.sh"`].join(' &&\n');
  return { install, uninstall: `"${directory}/LightTable/uninstall.sh"` };
}

export function archInstructions(download) {
  if (!download?.checksum) return null;
  const name = download.asset.name;
  return { install: `sha256sum -c ${name}.sha256 &&\nsudo pacman -U ./${name}`,
    uninstall: 'sudo pacman -R lighttable-bin' };
}

function setCode(page, selector, text) { page.querySelector(selector).textContent = text; }

export async function applyLinuxInstall(page = document, device = navigator, fetcher = fetch) {
  if (!page.querySelector('#linux-install')) return;
  const status = page.querySelector('#linux-release-status');
  status.textContent = 'Checking published Linux builds…';
  let config;
  try {
    const response = await fetcher(new URL('./linux-channels.json', import.meta.url), { cache: 'no-cache' });
    if (!response.ok) throw new Error();
    config = validateConfig(await response.json());
  } catch {
    status.textContent = 'Installation information could not be loaded. Check the published releases or try again.';
    return;
  }
  page.querySelector('[data-planned-version]').textContent = config.displayVersion;
  for (const name of Object.keys(listings)) {
    const card = page.querySelector(`[data-channel="${name}"]`);
    const commands = channelInstructions(config, name);
    card.querySelector('[data-channel-status]').textContent = commands ? 'Available' : name === 'snap' ? 'Planned for later' : 'Not published yet';
    if (!commands) continue;
    card.querySelector('[data-channel-description]').textContent = `Install LightTable from ${names[name]}. Use the same channel for updates and removal.`;
    const link = card.querySelector('[data-channel-link]');
    link.href = config.channels[name].url;
    link.hidden = false;
    const steps = card.querySelector('[data-channel-commands]');
    for (const action of ['install', 'update', 'uninstall']) steps.querySelector(`[data-command="${action}"]`).textContent = commands[action];
    steps.hidden = false;
  }
  const distro = page.querySelector('#linux-distribution');
  const architecture = page.querySelector('#linux-architecture');
  const query = new URLSearchParams(page.location.search);
  if (Object.hasOwn(distributions, query.get('distro'))) distro.value = query.get('distro');
  let releases = [], releaseError = false;
  const [releaseResult, architectureResult] = await Promise.allSettled([
    fetchReleases(fetcher, { signal: AbortSignal.timeout(12000) }),
    detectPlatform(device) === 'linux' ? detectArchitecture(device) : Promise.resolve(null),
  ]);
  if (releaseResult.status === 'fulfilled') releases = releaseResult.value;
  else releaseError = true;
  const detected = architectureResult.status === 'fulfilled' ? architectureResult.value : null;
  const arm = selectDownload(releases, 'linux', 'arm64');
  const intel = selectDownload(releases, 'linux', 'x86_64');
  if (intel) page.querySelector('.linux-version').textContent = `Version ${intel.version.replace(/\.0$/, '')} is available for Intel/AMD 64-bit Linux.`;
  else if (arm) page.querySelector('.linux-version').textContent = `An experimental ARM64 build of version ${arm.version.replace(/\.0$/, '')} is available.`;
  if (arm) {
    const option = page.createElement('option');
    option.value = 'arm64'; option.textContent = 'ARM64 / aarch64 — experimental'; architecture.append(option);
  }
  if (detected === 'x86_64' || (detected === 'arm64' && arm)) architecture.value = detected;
  if (detected === 'arm64' && !arm) page.querySelector('#architecture-help').textContent = 'Your browser reports ARM64. No experimental ARM64 download is published. Intel/AMD builds do not run on ARM64.';
  function update() {
    const selected = distributions[distro.value];
    const download = selectDownload(releases, 'linux', architecture.value);
    const archDownload = selectDownload(releases, 'arch', architecture.value);
    const archCommands = archInstructions(archDownload);
    const archSection = page.querySelector('#linux-arch-package');
    archSection.hidden = selected?.family !== 'arch' || !archCommands;
    if (config.channels.aur.status === 'pending') {
      page.querySelector('[data-channel="aur"] [data-channel-description]').textContent = archCommands
        ? 'The pacman package is available. Choose Arch Linux or Omarchy above for installation instructions. The AUR listing is not published yet.'
        : 'The AUR listing is not published yet. Choose Arch Linux or Omarchy and Intel/AMD 64-bit to check for a downloadable pacman package.';
    }
    if (archCommands) {
      page.querySelector('#arch-package-download').href = archDownload.asset.browser_download_url;
      page.querySelector('#arch-package-checksum').href = archDownload.checksum.browser_download_url;
      setCode(page, '#arch-package-install', archCommands.install);
      setCode(page, '#arch-package-uninstall', archCommands.uninstall);
    }
    const command = selected && dependencies[selected.family];
    page.querySelector('#dependency-command').closest('pre').hidden = !command;
    page.querySelector('#dependency-help').hidden = !!command;
    if (command) setCode(page, '#dependency-command', command);
    const aurAvailable = config.channels.aur.status === 'available';
    const flatpakAvailable = config.channels.flathub.status === 'available';
    page.querySelector('#distribution-help').textContent = selected
      ? selected.family === 'arch' ? aurAvailable
        ? 'Use the AUR package for updates through your package manager, or choose the direct archive below.'
        : archCommands ? 'Install the Arch package below with pacman. The AUR listing is not published yet.'
          : 'The AUR package is being prepared. Use an available direct archive and keep your desktop’s portal backend installed.'
        : selected.family === 'ubuntu' ? flatpakAvailable
          ? 'Use Flathub for updates through Flatpak, or choose the direct archive for Ubuntu 24.04 or later.'
          : 'Use an available direct archive on Ubuntu 24.04 or later while the Flathub listing is being prepared.'
        : flatpakAvailable ? 'Flathub is the package route for other distributions. The direct archive requires compatible GTK 3 and WebKitGTK 4.1 libraries.'
          : 'The direct archive targets Ubuntu 24.04 or later and current Arch Linux. Other distributions need compatible GTK 3 and WebKitGTK 4.1 libraries; Flathub is being prepared.'
      : 'Browsers can identify Linux, but cannot reliably identify your distribution. Choose it here for the right instructions.';
    const link = page.querySelector('#linux-archive-download');
    const checksum = page.querySelector('#linux-checksum-download');
    const instructions = page.querySelector('#linux-archive-instructions');
    link.hidden = !download; checksum.hidden = !download?.checksum; instructions.hidden = !download?.checksum;
    if (!download) {
      link.removeAttribute('href'); checksum.removeAttribute('href');
      setCode(page, '#archive-install-command', '');
      setCode(page, '#archive-uninstall-command', '');
      status.textContent = releaseError ? 'Published downloads could not be checked. You can view the releases on GitHub.'
        : !architecture.value ? 'Choose your processor to check for a compatible download.'
        : 'No compatible Linux release is published yet. Download links will appear here after publication.';
      return;
    }
    link.href = download.asset.browser_download_url;
    link.textContent = `Download ${download.version.replace(/\.0$/, '')} for ${architecture.value === 'arm64' ? 'ARM64 (experimental)' : 'Intel/AMD 64-bit'}`;
    if (!download.checksum) {
      checksum.removeAttribute('href');
      setCode(page, '#archive-install-command', '');
      setCode(page, '#archive-uninstall-command', '');
      status.textContent = `${download.asset.name} — the SHA-256 checksum is not published yet. Installation instructions will appear when the matching checksum is available.`;
      return;
    }
    checksum.href = download.checksum.browser_download_url;
    const commands = archiveInstructions(download);
    setCode(page, '#archive-install-command', commands.install);
    setCode(page, '#archive-uninstall-command', commands.uninstall);
    status.textContent = `${download.asset.name}${download.experimental ? ' — experimental ARM64 build' : ''}`;
  }
  distro.addEventListener('change', update);
  architecture.addEventListener('change', update);
  update();
}

if (typeof document !== 'undefined') void applyLinuxInstall();
