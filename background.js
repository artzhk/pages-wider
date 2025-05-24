const wider = () => {
  const elements = {};
  [].forEach.call(document.querySelectorAll("div, main"), function (el) {
    const currentWidth = window.getComputedStyle(el).maxWidth;
    if (currentWidth && currentWidth != "100%") {
      elements[el.id] = { initialWidth: currentWidth };
      el.style.maxWidth = "100%";
    }
  });
  return elements;
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "Wide",
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: wider,
  });
});
