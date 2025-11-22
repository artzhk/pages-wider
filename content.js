let activationShortcut = "";

const isTypingField = (element) => {
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  const type = element.getAttribute?.("type")?.toLowerCase();
  const isTextInput =
    tag === "input" &&
    type !== "checkbox" &&
    type !== "radio" &&
    type !== "button" &&
    type !== "submit";

  return element.isContentEditable || tag === "textarea" || isTextInput;
};

const formatShortcut = (event) => {
  const parts = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Meta");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  const key = event.key;
  if (!key) {
    return "";
  }

  const upperKey = key.length === 1 ? key.toUpperCase() : key;
  const ignoredKeys = ["Control", "Shift", "Alt", "Meta"];
  if (!ignoredKeys.includes(key)) {
    parts.push(upperKey);
  }

  return parts.join("+");
};

const updateShortcut = () => {
  browser.storage.sync.get({ activationShortcut: "" }, (result) => {
    activationShortcut = result.activationShortcut || "";
  });
};

updateShortcut();
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.activationShortcut) {
    activationShortcut = changes.activationShortcut.newValue || "";
  }
});

// Detects recorded shortcut
document.addEventListener("keydown", (event) => {
  if (!activationShortcut) {
    return;
  }

  // Escape if typing
  if (isTypingField(event.target)) {
    return;
  }

  const combo = formatShortcut(event);
  if (combo && combo === activationShortcut) {
    browser.runtime.sendMessage({ type: "activate-shortcut" });
  }
});
