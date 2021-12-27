export const runContentScript = () => {
    chrome.runtime.sendMessage({command: "notifyLoaded"});
    window.addEventListener("unload", () => chrome.runtime.sendMessage({command: "notifyUnloaded"}));
}