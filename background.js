const wider = () => {
        [].forEach.call(document.querySelectorAll("div, main, table, body"), function (el) {
                const maxWidth = window.getComputedStyle(el).maxWidth;
                const width = window.getComputedStyle(el).width;
// <<<<<<< Updated upstream
// 		const _float = window.getComputedStyle(el).float;
// 
// 		const numericWidth = parseFloat(width);
// 		const inReadFriendlyRange = numericWidth < 1000 && numericWidth > 600;
// 
// 		if (_float && _float !== "none") {
// 			el.style.float = "none";
// 		}
//                 if (numericwidth != nan && inreadfriendlyrange) {
//                         el.style.width = "auto";
//                 }
//                 if (maxwidth && maxwidth != "none") {
// =======
                const floatValue = window.getComputedStyle(el).float;

                const numericWidth = parseFloat(width);
                const inReadFriendlyRange = numericWidth < 1000 && numericWidth > 600;

                if (floatValue && floatValue !== "none") {
                        el.style.float = "none";
                }
                if (!Number.isNaN(numericWidth) && inReadFriendlyRange) {
                        el.style.width = "auto";
                }
                if (maxWidth && maxWidth !== "none") {
                        el.style.maxWidth = "100%";
                }
        });
};

// <<<<<<< Updated upstream
// chrome.runtime.onInstalled.addListener(() => {
//         chrome.action.setBadgeText({
//                 text: "Wide",
//         });
// });
// 
// chrome.action.onClicked.addListener(async (tab) => {
//         await chrome.scripting.executeScript({
//                 target: { tabId: tab.id },
//                 func: wider,
//         });
// });
// 
// =======
const DEFAULT_SETTINGS = {
        alwaysOn: false,
        sites: {},
        activationShortcut: "",
};

const getHostname = (url) => {
        try {
                const { hostname } = new URL(url);
                return hostname;
        } catch (error) {
                return null;
        }
};

const normalizeDomain = (hostname) => {
        if (!hostname) {
                return null;
        }
        return hostname.replace(/^www\./, "");
};

const isHttpUrl = (url) => {
        try {
                const { protocol } = new URL(url);
                return protocol === "http:" || protocol === "https:";
        } catch (error) {
                return false;
        }
};

const loadSettings = async () => {
        const stored = await browser.storage.sync.get(DEFAULT_SETTINGS);
        return {
                ...DEFAULT_SETTINGS,
                ...stored,
                sites: stored.sites || {},
                activationShortcut: stored.activationShortcut || "",
        };
};

const saveSettings = async (settings) => {
        await browser.storage.sync.set(settings);
};

const applyWider = async (tabId) => {
        await browser.scripting.executeScript({
                target: { tabId },
                func: wider,
        });
};

const updateBadgeForTab = async (tabId, url, settings) => {
        const domain = url && isHttpUrl(url) ? normalizeDomain(getHostname(url)) : null;
        let text = "";

        if (settings.alwaysOn) {
                text = "ALL";
        } else if (domain && settings.sites[domain]) {
                text = "ON";
        }

        await browser.action.setBadgeText({ tabId, text });
        if (text) {
                await browser.action.setBadgeBackgroundColor({ tabId, color: "#3b82f6" });
        }
};

const toggleSiteForTab = async (tab, settings) => {
        if (!tab.url || !isHttpUrl(tab.url)) {
                return settings;
        }

        const domain = normalizeDomain(getHostname(tab.url));
        if (!domain) {
                return settings;
        }

        const enabled = Boolean(settings.sites[domain]);
        if (enabled) {
                delete settings.sites[domain];
        } else {
                settings.sites[domain] = true;
                await applyWider(tab.id);
        }

        await saveSettings(settings);
        await updateBadgeForTab(tab.id, tab.url, settings);
        return settings;
};

const toggleAlwaysOn = async (tab, settings) => {
        settings.alwaysOn = !settings.alwaysOn;
        await saveSettings(settings);

        if (settings.alwaysOn && tab?.id && tab.url && isHttpUrl(tab.url)) {
                await applyWider(tab.id);
        }

        if (tab?.id) {
                await updateBadgeForTab(tab.id, tab.url, settings);
        }

        return settings;
};

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        const handleMessage = async () => {
                const { type, tabId } = message;

                if (type === "get-status") {
                        const state = await getStateForTab(tabId);
                        return {
                                siteEnabled: state.siteEnabled,
                                alwaysOn: state.alwaysOn,
                                domain: state.domain,
                                isHttp: state.isHttp,
                                savedSites: state.savedSites,
                                activationShortcut: state.settings.activationShortcut,
                        };
                }

                if (type === "toggle-site") {
                        const state = await getStateForTab(tabId);
                        if (state.tab && state.isHttp) {
                                await toggleSiteForTab(state.tab, state.settings);
                        }
                        const updatedState = await getStateForTab(tabId);
                        return {
                                siteEnabled: updatedState.siteEnabled,
                                alwaysOn: updatedState.alwaysOn,
                                domain: updatedState.domain,
                                isHttp: updatedState.isHttp,
                                savedSites: updatedState.savedSites,
                                activationShortcut: updatedState.settings.activationShortcut,
                        };
                }

                if (type === "toggle-always") {
                        const state = await getStateForTab(tabId);
                        await toggleAlwaysOn(state.tab, state.settings);
                        const updatedState = await getStateForTab(tabId);
                        return {
                                siteEnabled: updatedState.siteEnabled,
                                alwaysOn: updatedState.alwaysOn,
                                domain: updatedState.domain,
                                isHttp: updatedState.isHttp,
                                savedSites: updatedState.savedSites,
                                activationShortcut: updatedState.settings.activationShortcut,
                        };
                }

                if (type === "set-shortcut") {
                        const settings = await loadSettings();
                        settings.activationShortcut = typeof message.shortcut === "string" ? message.shortcut : "";
                        await saveSettings(settings);

                        if (tabId) {
                                const state = await getStateForTab(tabId);
                                await updateBadgeForTab(tabId, state.tab?.url, settings);
                        }

                        return { activationShortcut: settings.activationShortcut };
                }

                if (type === "activate-shortcut") {
                        const state = await getStateForTab(tabId || _sender.tab?.id);
                        if (state.tab && state.isHttp) {
                                await toggleSiteForTab(state.tab, state.settings);
                                const updatedState = await getStateForTab(state.tab.id);
                                return {
                                        siteEnabled: updatedState.siteEnabled,
                                        alwaysOn: updatedState.alwaysOn,
                                        domain: updatedState.domain,
                                        isHttp: updatedState.isHttp,
                                        savedSites: updatedState.savedSites,
                                        activationShortcut: updatedState.settings.activationShortcut,
                                };
                        }
                        return null;
                }

                return null;
        };

        handleMessage()
                .then(sendResponse)
                .catch(() => sendResponse(null));
        return true;
});

const getStateForTab = async (tabId) => {
        if (!tabId) {
                return {
                        alwaysOn: false,
                        siteEnabled: false,
                        domain: null,
                        isHttp: false,
                        savedSites: [],
                        settings: DEFAULT_SETTINGS,
                };
        }

        const tab = await browser.tabs.get(tabId);
        const settings = await loadSettings();
        const domain = tab.url && isHttpUrl(tab.url) ? normalizeDomain(getHostname(tab.url)) : null;
        const siteEnabled = Boolean(domain && settings.sites[domain]);
        const savedSites = Object.keys(settings.sites || {}).sort();

        return {
                tab,
                settings,
                domain,
                siteEnabled,
                alwaysOn: settings.alwaysOn,
                isHttp: Boolean(tab.url && isHttpUrl(tab.url)),
                savedSites,
        };
};

browser.runtime.onInstalled.addListener(async () => {
        const settings = await loadSettings();
        await saveSettings(settings);
});

browser.action.onClicked.addListener(async (tab) => {
        const settings = await loadSettings();
        await toggleSiteForTab(tab, settings);
});

browser.commands.onCommand.addListener(async (command) => {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
                return;
        }

        const settings = await loadSettings();

        if (command === "toggle-site-wide") {
                await toggleSiteForTab(tab, settings);
        }

        if (command === "toggle-always-on") {
                await toggleAlwaysOn(tab, settings);
        }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status !== "complete" || !tab.url || !isHttpUrl(tab.url)) {
                return;
        }

        const settings = await loadSettings();
        const domain = normalizeDomain(getHostname(tab.url));

        if (settings.alwaysOn || (domain && settings.sites[domain])) {
                await applyWider(tabId);
        }

        await updateBadgeForTab(tabId, tab.url, settings);
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
        const tab = await browser.tabs.get(tabId);
        const settings = await loadSettings();
        await updateBadgeForTab(tabId, tab.url, settings);
});

if (typeof module !== "undefined") {
        module.exports = {
                wider,
                DEFAULT_SETTINGS,
                getHostname,
                normalizeDomain,
                isHttpUrl,
                loadSettings,
        };
}
