import { platformLabels } from "./platform.mjs?v=20260908-text";
import { applyPlatformContent } from "./platform-content.mjs?v=20260910-homebrew-beta";
import { detectArchitecture, fetchReleases, selectDownload } from "./downloads.mjs";

const platform = applyPlatformContent();

// Keep the extra Linux guide as a fallback only for unrecognized/mobile devices.
document.querySelector('[data-linux-install-link]')?.toggleAttribute('hidden', Boolean(platform));

const releaseButton = document.querySelector("#release-download");
const installCommand = document.querySelector("#install-command");
const copyCommandButton = document.querySelector(".copy-command");
const installStatus = document.querySelector("#install-status");

if (installCommand && copyCommandButton && installStatus) {
  const defaultStatus = installStatus.textContent;
  let resetCopyState;
  copyCommandButton.hidden = false;

  copyCommandButton.addEventListener("click", async () => {
    clearTimeout(resetCopyState);
    copyCommandButton.classList.remove("is-copied");

    try {
      await navigator.clipboard.writeText(installCommand.textContent.trim());
      copyCommandButton.classList.add("is-copied");
      installStatus.textContent = "Copied";
      resetCopyState = setTimeout(() => {
        copyCommandButton.classList.remove("is-copied");
        installStatus.textContent = defaultStatus;
      }, 2500);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(installCommand);
      selection?.removeAllRanges();
      selection?.addRange(range);
      installStatus.textContent = "Select and copy the command";
    }
  });
}

if (releaseButton) {
  releaseButton.textContent = platform ? `View ${platformLabels[platform]} releases` : "View releases";
  if (platform === 'linux') {
    releaseButton.href = 'linux.html';
    releaseButton.textContent = 'Install on Linux';
  } else if (platform) {
    if (platform === 'macos') {
      releaseButton.href = 'https://github.com/reville/lighttable-digital-darkroom/releases/tag/macos-v0.6.0-beta.1';
      releaseButton.textContent = 'Download macOS beta';
    }
    const architectureResult = detectArchitecture().then(architecture => {
      const compatibilityNote = document.querySelector('#mac-compatibility-note');
      if (platform === 'macos' && compatibilityNote) {
        // Keep the requirement visible when the browser cannot identify the chip.
        // Resolve this separately so a failed release lookup cannot hide the note.
        compatibilityNote.hidden = architecture === 'arm64';
      }
      return architecture;
    });
    Promise.all([architectureResult, fetchReleases(fetch, { signal: AbortSignal.timeout(12000) })])
      .then(([architecture, releases]) => {
        const download = selectDownload(releases, platform, architecture);
        if (!download) return;
        releaseButton.href = download.asset.browser_download_url;
        releaseButton.textContent = `Download for ${platformLabels[platform]}`;
      })
      .catch(() => { /* The releases link stays available when discovery fails. */ });
  }
}

const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add("is-visible"));
}

const featureSearch = document.querySelector("#feature-search");

if (featureSearch) {
  const searchForm = featureSearch.closest("form");
  const clearButton = document.querySelector("#feature-search-clear");
  const emptyClearButton = document.querySelector("#feature-empty-clear");
  const resultText = document.querySelector("#feature-results");
  const emptyState = document.querySelector("#feature-empty");
  const featureGroups = [...document.querySelectorAll("[data-feature-group]")];
  const featureItems = [...document.querySelectorAll("[data-feature]")];
  const total = featureItems.length;
  const normalize = (value) => value.toLocaleLowerCase().normalize("NFKD");

  featureItems.forEach((item) => {
    const group = item.closest("[data-feature-group]");
    const groupHeader = group?.querySelector(".feature-group-header");
    item.searchText = normalize(`${groupHeader?.textContent || ""} ${item.textContent || ""}`);
  });

  function updateFeatureResults() {
    const rawQuery = featureSearch.value.trim();
    const query = normalize(rawQuery);
    let visibleCount = 0;

    featureItems.forEach((item) => {
      const matches = !query || item.searchText.includes(query);
      item.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    featureGroups.forEach((group) => {
      group.hidden = !group.querySelector("[data-feature]:not([hidden])");
    });

    clearButton.hidden = !rawQuery;
    emptyState.hidden = visibleCount !== 0;
    resultText.textContent = rawQuery
      ? `${visibleCount} ${visibleCount === 1 ? "match" : "matches"} for “${rawQuery}”`
      : `${total} features, organized by workflow`;
  }

  function clearFeatureSearch() {
    featureSearch.value = "";
    updateFeatureResults();
    featureSearch.focus();
  }

  searchForm.addEventListener("submit", (event) => event.preventDefault());
  featureSearch.addEventListener("input", updateFeatureResults);
  featureSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && featureSearch.value) clearFeatureSearch();
  });
  clearButton.addEventListener("click", clearFeatureSearch);
  emptyClearButton.addEventListener("click", clearFeatureSearch);
  updateFeatureResults();
}
