
if("onMessageExternal" in chrome.runtime) {
    document.body.classList.add("direct");
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    url = tabs[0].url;
	if(url == "https://sitedelta.schierla.de/transfer/") {
        chrome.tabs.executeScript(tabs[0].id, { file: "/transferScript.js" }, function (results) {
            window.close();
        });
		return;
    }
});