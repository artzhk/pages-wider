const wider = () => {
        [].forEach.call(document.querySelectorAll("div, main, table"), function (el) {
                const maxWidth = window.getComputedStyle(el).maxWidth;
                const width = window.getComputedStyle(el).width;
		const _float = window.getComputedStyle(el).float;

		const numericWidth = parseFloat(width);
		const inReadFriendlyRange = numericWidth < 1000 && numericWidth > 600;

		if (_float && _float !== "none") {
			el.style.float = "none";
		}
                if (numericWidth != NaN && inReadFriendlyRange) {
                        el.style.width = "auto";
                }
                if (maxWidth && maxWidth != "none") {
                        el.style.maxWidth = "100%";
                }
        });
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

