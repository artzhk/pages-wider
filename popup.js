const siteToggle = document.getElementById("site-toggle");
const alwaysToggle = document.getElementById("always-toggle");
const siteLabel = document.getElementById("site-label");
const siteHint = document.getElementById("site-hint");
const shortcutDisplay = document.getElementById("shortcut-display");
const shortcutRecord = document.getElementById("shortcut-record");
const savedSitesContainer = document.getElementById("saved-sites");

let isRecordingShortcut = false;

const setButtonState = (button, enabled, label) => {
  button.textContent = label;
  button.disabled = !enabled;
  button.classList.toggle("primary", enabled);
};

const render = (state) => {
  const { siteEnabled, alwaysOn, domain, isHttp, savedSites, activationShortcut } = state;

  if (!isHttp) {
    siteLabel.textContent = "Unavailable";
    setButtonState(siteToggle, false, "Not supported");
    siteHint.textContent = "Full width can only be toggled on http/https pages.";
  } else {
    siteLabel.textContent = domain || "Unknown";
    setButtonState(siteToggle, true, siteEnabled ? "Disable" : "Enable");
    siteHint.textContent = siteEnabled
      ? "Widening will be applied when you visit this site."
      : "Enable to apply full width on this site.";
  }

  setButtonState(alwaysToggle, true, alwaysOn ? "Turn off" : "Turn on");

  shortcutDisplay.textContent = activationShortcut || "Not set";
  renderSavedSites(savedSites || []);
};

const renderSavedSites = (sites) => {
  savedSitesContainer.innerHTML = "";

  if (!sites.length) {
    savedSitesContainer.textContent = "No sites saved yet.";
    savedSitesContainer.className = "muted";
    return;
  }

  savedSitesContainer.className = "list";

  sites.forEach((site) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = site;
    savedSitesContainer.appendChild(pill);
  });
};

const getStatus = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return browser.runtime.sendMessage({ type: "get-status", tabId: tab?.id });
};

const toggleSite = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const state = await browser.runtime.sendMessage({ type: "toggle-site", tabId: tab?.id });
  render(state);
};

const toggleAlwaysOn = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const state = await browser.runtime.sendMessage({ type: "toggle-always", tabId: tab?.id });
  render(state);
};

const formatShortcut = (event) => {
  const parts = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Meta");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  const key = event.key;
  const ignored = ["Control", "Shift", "Alt", "Meta"];
  if (key && !ignored.includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key);
  }

  return parts.join("+");
};

const stopRecordingShortcut = () => {
  isRecordingShortcut = false;
  shortcutRecord.textContent = "Record key";
  shortcutRecord.disabled = false;
  shortcutRecord.classList.remove("primary");
};

const startRecordingShortcut = () => {
  if (isRecordingShortcut) {
    return;
  }

  isRecordingShortcut = true;
  shortcutRecord.textContent = "Press keys...";
  shortcutRecord.disabled = true;
  shortcutRecord.classList.add("primary");
};

const handleShortcutCapture = async (event) => {
  if (!isRecordingShortcut) {
    return;
  }

  event.preventDefault();
  const combo = formatShortcut(event);

  stopRecordingShortcut();

  if (!combo) {
    return;
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const result = await browser.runtime.sendMessage({
    type: "set-shortcut",
    shortcut: combo,
    tabId: tab?.id,
  });

  shortcutDisplay.textContent = result.activationShortcut || "Not set";
};

const init = async () => {
  const state = await getStatus();
  render(state);

  siteToggle.addEventListener("click", toggleSite);
  alwaysToggle.addEventListener("click", toggleAlwaysOn);
  shortcutRecord.addEventListener("click", startRecordingShortcut);
  document.addEventListener("keyup", handleShortcutCapture);
};

document.addEventListener("DOMContentLoaded", init);
