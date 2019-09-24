// tab operations
var tabUtils = {
	openResource: async function (url) {
		return new Promise(resolve => {
			chrome.tabs.create({ url: chrome.runtime.getURL(url) }, resolve);
		});
	},
	openResourceInBackground: async function (url) {
		return new Promise(resolve => {
			chrome.tabs.create({ url: chrome.runtime.getURL(url), active: false }, resolve);
		});
	},
	getActive: async function () {
		return new Promise(resolve => {
			chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0]));
		});
	},
	showIcon: async function (tabId, current, changes) {
		if (chrome.webNavigation) {
			if (changes === undefined) {
				chrome.browserAction.setBadgeText({ text: "", tabId: tabId });
			} else if (changes == 0) {
				chrome.browserAction.setBadgeText({ text: " ", tabId: tabId });
				chrome.browserAction.setBadgeBackgroundColor({ color: "#0c0", tabId: tabId });
			} else if (changes > 0) {
				chrome.browserAction.setBadgeText({ text: "" + current, tabId: tabId });
				chrome.browserAction.setBadgeBackgroundColor({ color: "#c00", tabId: tabId });
			} else {
				chrome.browserAction.setBadgeText({ text: "X", tabId: tabId });
				chrome.browserAction.setBadgeBackgroundColor({ color: "#ccc", tabId: tabId });
			}
		}
	},
	getStatus: async function (tabId) {
		return await tabUtils._callContentScript(tabId, { command: "getStatus" });
	},
	getContent: async function (tabId, url) {
		var config = await pageUtils.getEffectiveConfig(url);
		var content = await tabUtils._callContentScript(tabId, { command: "getContent", config: config });
		return content;
	},

	checkChanges: async function(tabId, url) {
		var config = await pageUtils.getEffectiveConfig(url);
		if (config === null) return -1;
		var oldcontent = await pageUtils.getContent(url);
		if (oldcontent === null) return -1;
		var content = await tabUtils._callContentScript(tabId, { command: "getContent", config: config });
		if (content === undefined) return -1;
		if (textUtils.isEqual(oldcontent, content, config)) { 
			// unchanged
			return 0;
		} else {
			return 1;
		}
	},
	highlightChanges: async function (tabId, url) {
		var config = await pageUtils.getEffectiveConfig(url);
		var content = await tabUtils._callContentScript(tabId, { command: "getContent", config: config });
		if (content === undefined) return;
		var oldcontent = await pageUtils.getContent(url);
		if (oldcontent === null) oldcontent = "";
		await pageUtils.setContent(url, content);
		var status = await tabUtils._callContentScript(tabId, { command: "highlightChanges", config: config, content: oldcontent });
		return status; 
	},
	showOutline: async function (tabId, xpath, color) {
		await tabUtils._callContentScript(tabId, { command: "showOutline", xpath: xpath, color: color });
	},
	removeOutline: async function (tabId) {
		await tabUtils._callContentScript(tabId, { command: "removeOutline" });
	},
	selectInclude: async function (tabId, url) {
		return await tabUtils._callBackgroundScript({ command: "addIncludeRegion", tab: tabId, url: url });
	},
	selectExclude: async function (tabId, url) {
		return await tabUtils._callBackgroundScript({ command: "addExcludeRegion", tab: tabId, url: url });
	},
	loadInTab: async function (tabId, url) {
		return await tabUtils._callBackgroundScript({ command: "loadInTab", tab: tabId, url: url });
	},
	selectRegion: async function (tabId) {
		return await tabUtils._callContentScript(tabId, { command: "selectRegion" });
	},

	// internal functions
	_callBackgroundScript: async function (command) {
		return new Promise(resolve => {
			chrome.runtime.sendMessage(command, resolve);
		});
	},
	_callContentScript: async function (tabId, command) {
		var status = await new Promise(resolve => chrome.tabs.sendMessage(tabId, command, resolve));
		if (status === undefined) {
			var ignore = chrome.runtime.lastError;
			var scripts = [
				"/common/scripts/textUtils.js",
				"/common/scripts/regionUtils.js",
				"/common/scripts/highlightUtils.js",
				"/common/scripts/contentScript.js"
			];
			await tabUtils._executeScripts(tabId, scripts);
			var status = await new Promise(resolve => chrome.tabs.sendMessage(tabId, command, resolve));
			if (status === undefined) {
				console.log("Error calling content script '" + command.command + "': " +
					chrome.runtime.lastError);
				return;
			} else {
				return status;
			}
		} else {
			return status;
		}
	},
	_executeScripts: async function (tabId, files) {
		for(var i=0; i<files.length; i++) {
			var results = await new Promise(resolve => chrome.tabs.executeScript(tabId, { file: files[i] }, resolve));
			if (results === undefined) console.log("Error executing script: " + chrome.runtime.lastError);
		}
	}
};