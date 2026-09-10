import { releaseManifest } from './release-data.mjs?release=c2822d51ef1752bb';
import { selectedPlatform, requestedPlatform, platformLabels, platformLink } from './platform.mjs?v=20260908-text';

// Trusted site copy only. Markup is limited to existing links and inline code.
const platformCopy = {
  "hero-renderer": {
    "macos": "Rust core with GPU-driven rendering on Metal.",
    "windows": "Rust core with GPU-driven rendering on DirectX 12.",
    "linux": "Rust core with GPU-driven rendering on Vulkan."
  },
  "hero-app": {
    "macos": "Beautiful native macOS app.",
    "windows": "Beautiful native Windows app.",
    "linux": "Beautiful native Linux app."
  },
  "install-guide": {
    "macos": "<a href=\"https://github.com/reville/homebrew-lighttable#readme\">Homebrew setup and first-launch instructions</a>",
    "windows": "<a href=\"windows.html\">Windows installation instructions</a>",
    "linux": "<a href=\"linux.html\">Linux installation instructions</a>"
  },
  "footer": {
    "macos": "Local, non-destructive digital darkroom for macOS.",
    "windows": "Local, non-destructive digital darkroom for Windows.",
    "linux": "Local, non-destructive digital darkroom for Linux."
  },
  "export-formats": {
    "macos": "Export 16-bit TIFFs, or 8-bit JPEG, HEIF, and PNG files.",
    "windows": "Export 16-bit TIFFs, or 8-bit JPEG and PNG files.",
    "linux": "Export 16-bit TIFFs, or 8-bit JPEG and PNG files."
  },
  "overview-app": {
    "macos": "A local, non-destructive RAW editor built as a native Mac app.",
    "windows": "A local, non-destructive RAW editor built as a native Windows app.",
    "linux": "A local, non-destructive RAW editor built as a native Linux app."
  },
  "overview-import": {
    "macos": "Verified card ingest, watched folders, and Apple Photos import.",
    "windows": "Verified card ingest and watched folders.",
    "linux": "Verified card ingest and watched folders."
  },
  "overview-export": {
    "macos": "Color-managed JPEG, HEIF, PNG, and true 16-bit TIFF export.",
    "windows": "Color-managed JPEG, PNG, and true 16-bit TIFF export.",
    "linux": "Color-managed JPEG, PNG, and true 16-bit TIFF export."
  },
  "overview-ai": {
    "macos": "Optional local AI, plus command-line and agent control you can undo.",
    "windows": "Command-line and agent control you can undo.",
    "linux": "Command-line and agent control you can undo."
  },
  "architecture-question": {
    "macos": "Intel or Apple silicon?",
    "windows": "Which Windows processors are supported?",
    "linux": "Which Linux processors are supported?"
  },
  "architecture-answer": {
    "macos": "The current Mac release is Apple silicon only. The app and its helper programs are built for <code>arm64</code>, so they do not launch on an Intel Mac.",
    "windows": "Windows packages target 64-bit Intel and AMD processors (<code>x64</code>). There is no native Windows ARM64 package.",
    "linux": "The initial Linux packages target 64-bit Intel and AMD processors (<code>x86-64</code>). ARM64 builds are experimental."
  },
  "requirements-question": {
    "macos": "What macOS version and hardware?",
    "windows": "What Windows version and hardware?",
    "linux": "Which Linux distributions and hardware?"
  },
  "requirements-answer": {
    "macos": `LightTable requires ${releaseManifest.platforms['macos-arm64'].minimum_os} on an Apple silicon Mac. The main editor does not require Apple Intelligence. Optional image descriptions require macOS 27 or later, Apple Intelligence, and the optional bridge. LightTable has not published a minimum RAM figure yet.`,
    "windows": `LightTable targets ${releaseManifest.platforms['windows-x64'].minimum_os} and uses the Microsoft Edge WebView2 Runtime. The installer sets up WebView2 if it is missing; portable ZIP users install it separately. GPU rendering uses DirectX 12, with a CPU fallback. LightTable has not published a minimum RAM figure yet.`,
    "linux": `The initial target is x86-64 ${releaseManifest.platforms['linux-x86_64'].minimum_os} and current Arch Linux, including Omarchy. Install the GTK 3, WebKitGTK, and desktop libraries listed in the Linux instructions. GPU rendering uses Vulkan, with a CPU fallback. Linux support is experimental. LightTable has not published a minimum RAM figure yet.`
  },
  "storage": {
    "macos": "The catalog and edits live in <code>~/Library/Application Support/LightTable/Catalog/library.sqlite3</code>. Presets, preferences, and the optional AI index also live under <code>~/Library/Application Support/LightTable</code>. Generated thumbnails, previews, renders, and compiled caches live under <code>~/Library/Caches/LightTable</code>. Originals stay where you put them. Apple Photos imports are copies in <code>~/Pictures/LightTable Imports/Apple Photos</code>. LightTable also writes <code>.lighttable-state.json</code> to writable source folders as a portable edit mirror; XMP sidecar write-back is opt-in.",
    "windows": "The catalog and edits live in <code>%LOCALAPPDATA%\\LightTable\\Catalog\\library.sqlite3</code>. Preferences, presets, logs, caches, and the WebView2 profile also live under <code>%LOCALAPPDATA%\\LightTable</code>. Originals stay where you put them. LightTable also writes <code>.lighttable-state.json</code> to writable source folders as a portable edit mirror; XMP sidecar write-back is opt-in.",
    "linux": "The catalog and edits live in <code>~/.local/share/lighttable/Catalog/library.sqlite3</code>, with presets under <code>~/.local/share/lighttable</code>. Preferences live under <code>~/.config/lighttable</code>, caches under <code>~/.cache/lighttable</code>, and logs and installer records under <code>~/.local/state/lighttable</code>. Absolute XDG directory overrides are respected. Originals stay where you put them. LightTable also writes <code>.lighttable-state.json</code> to writable source folders as a portable edit mirror; XMP sidecar write-back is opt-in."
  },
  "uninstall": {
    "macos": "Dragging <code>LightTable.app</code> to the Trash removes the app, not its data. Originals, ingested copies, Apple Photos imports, exports, Application Support data, caches, <code>.lighttable-state.json</code> files, and any XMP sidecars remain. For a complete removal, quit LightTable and delete <code>~/Library/Application Support/LightTable</code> and <code>~/Library/Caches/LightTable</code>. Remove imported or exported photographs and sidecars separately only if you no longer want them.",
    "windows": "Uninstalling removes the app, shortcuts, and its CLI PATH entry. Your photographs, catalog, preferences, caches, exports, and sidecars remain, as does the shared WebView2 Runtime. For a portable ZIP, close the app and remove its extracted folder. To remove LightTable data as well, quit the app and delete <code>%LOCALAPPDATA%\\LightTable</code>. Remove photographs and sidecars separately only if you no longer want them.",
    "linux": "For a portable bundle, run its <code>uninstall.sh</code> to remove desktop and CLI launchers, then delete the extracted bundle separately. For a pacman installation, use <code>sudo pacman -R lighttable-bin</code>. Photographs, catalog, preferences, caches, exports, and sidecars remain. To remove application data as well, quit LightTable and remove its data, config, cache, and state directories, using your XDG overrides if set. Remove photographs and sidecars separately only if you no longer want them."
  },
  "import-intro": {
    "macos": "Cards, folders, Apple Photos, and live capture folders.",
    "windows": "Cards, folders, and live capture folders.",
    "linux": "Cards, folders, and live capture folders."
  },
  "relink": {
    "macos": "A file moved or renamed in Finder reconnects to its edits by content rather than path.",
    "windows": "A file moved or renamed in File Explorer reconnects to its edits by content rather than path.",
    "linux": "A file moved or renamed in your file manager reconnects to its edits by content rather than path."
  },
  "processed-input": {
    "macos": "Use HIF, JPEG, and HEIC photographs; ColorSync converts them to ProPhoto RGB before the film model.",
    "windows": "Use HIF, JPEG, and HEIC photographs with portable color conversion before the film model.",
    "linux": "Use HIF, JPEG, and HEIC photographs with portable color conversion before the film model."
  },
  "selection": {
    "macos": "Use Shift or Command to build a selection directly in the library.",
    "windows": "Use Shift or Ctrl to build a selection directly in the library.",
    "linux": "Use Shift or Ctrl to build a selection directly in the library."
  },
  "export-heading": {
    "macos": "JPEG, HEIF, PNG, and TIFF",
    "windows": "JPEG, PNG, and TIFF",
    "linux": "JPEG, PNG, and TIFF"
  },
  "renderer": {
    "macos": "Use a resident WGPU renderer backed by Metal for warm previews and full-resolution export work.",
    "windows": "Use a resident WGPU renderer backed by DirectX 12 for warm previews and full-resolution export work, with a CPU fallback.",
    "linux": "Use a resident WGPU renderer backed by Vulkan for warm previews and full-resolution export work, with a CPU fallback."
  },
  "preview-math": {
    "macos": "The native Metal preview, WebGL fallback, and exporter keep curves and grading operations in the same order.",
    "windows": "The WebGL preview and exporter keep curves and grading operations in the same order.",
    "linux": "The WebGL preview and exporter keep curves and grading operations in the same order."
  }
};

export function applyPlatformContent(page = document, device = navigator) {
  const search = page.location?.search || '';
  const platform = selectedPlatform(device, search);
  page.documentElement.dataset.platform = platform || 'other';
  for (const element of page.querySelectorAll('[data-platform-copy]')) {
    const variants = platformCopy[element.dataset.platformCopy];
    if (!platform || !Object.hasOwn(variants || {}, platform)) continue;
    element.innerHTML = variants[platform];
    element.hidden = !variants[platform];
  }
  for (const element of page.querySelectorAll('[data-platform-only]')) {
    element.hidden = element.dataset.platformOnly !== platform;
  }
  const override = requestedPlatform(search);
  if (override) {
    for (const link of page.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      const selected = platformLink(href, override);
      if (href !== selected) link.setAttribute('href', selected);
    }
  }
  return platform;
}

export function matchingAsset(assets, platform) {
  // Prefer installers. Shared archive extensions must also identify their OS.
  const patterns = {
    macos: [/\.dmg$/i, /\.pkg$/i, /(?:macos|darwin|mac)[-_].*\.zip$/i],
    windows: [/\.exe$/i, /\.msi$/i, /windows[-_].*\.zip$/i],
    linux: [/\.appimage$/i, /\.deb$/i, /\.rpm$/i, /linux[-_].*\.tar\.gz$/i],
  };
  if (!Object.hasOwn(platformLabels, platform) || !Array.isArray(assets)) return undefined;
  for (const pattern of patterns[platform]) {
    const asset = assets.find(asset => typeof asset?.name === 'string'
      && typeof asset.browser_download_url === 'string' && pattern.test(asset.name));
    if (asset) return asset;
  }
  return undefined;
}
