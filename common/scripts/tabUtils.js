// tab operations
var tabUtils = {
	openResource: function (url) {
		chrome.tabs.create({ url: chrome.runtime.getURL(url) });
	},
	getActive: function (callback) {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			return (callback !== undefined) ? callback(tabs[0]) : null;
		});
	},
	showIcon: function (tabId, current, changes) {
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
	getStatus: function (tabId, callback) {
		tabUtils._callContentScript(tabId, { command: "getStatus" }, callback);
	},
	getContent: function (tabId, url, callback) {
		pageUtils.getEffectiveConfig(url, function (config) {
			tabUtils._callContentScript(tabId, { command: "getContent", config: config }, function (content) {
				return (callback !== undefined) ? callback(content) : null;
			});
		});
	},

	checkChanges: function(tabId, url, callback) {
		pageUtils.getEffectiveConfig(url, function (config) {
			if (config === null) return (callback !== undefined) ? callback(-1) : null;
			pageUtils.getContent(url, function (oldcontent) {
				if (oldcontent === null) return (callback !== undefined) ? callback(-1) : null;
				tabUtils._callContentScript(tabId, { command: "getContent", config: config }, function (content) {
					if (content === undefined) return (callback !== undefined) ? callback(-1) : null;
					if (textUtils.isEqual(oldcontent, content, config)) { 
						// unchanged
						return (callback !== undefined) ? callback(0) : null;
					} else {
						return (callback !== undefined) ? callback(1) : null
					}
				});
			});
		});
	},
	highlightChanges: function (tabId, url, callback) {
		pageUtils.getEffectiveConfig(url, function (config) {
			tabUtils._callContentScript(tabId, { command: "getContent", config: config }, function (content) {
				if (content === undefined) return (callback !== undefined) ? callback() : null;
				pageUtils.getContent(url, function (oldcontent) {
					if (oldcontent === null) oldcontent = "";
					pageUtils.setContent(url, content, function () {
						tabUtils._callContentScript(tabId, { command: "highlightChanges", config: config, content: oldcontent }, function (status) {
							return (callback !== undefined) ? callback(status) : null;
						});
					});
				});
			});
		});
	},
	showOutline: function (tabId, xpath, color, callback) {
		tabUtils._callContentScript(tabId, { command: "showOutline", xpath: xpath, color: color }, callback);
	},
	removeOutline: function (tabId, callback) {
		tabUtils._callContentScript(tabId, { command: "removeOutline" }, callback);
	},
	selectInclude: function (tabId, url, callback) {
		tabUtils._callBackgroundScript({ command: "addIncludeRegion", tab: tabId, url: url }, callback);
	},
	selectExclude: function (tabId, url, callback) {
		tabUtils._callBackgroundScript({ command: "addExcludeRegion", tab: tabId, url: url }, callback);
	},
	loadInTab: function (tabId, url, callback) {
		tabUtils._callBackgroundScript({ command: "loadInTab", tab: tabId, url: url }, callback);
	},
	selectRegion: function (tabId, callback) {
		tabUtils._callContentScript(tabId, { command: "selectRegion" }, callback);
	},

	// internal functions
	_callBackgroundScript: function (command, callback) {
		chrome.runtime.sendMessage(command, callback);
	},
	_callContentScript: function (tabId, command, callback) {
		chrome.tabs.sendMessage(tabId, command, function (status) {
			if (status === undefined) {
				var ignore = chrome.runtime.lastError;
				var scripts = [
					"/common/scripts/textUtils.js",
					"/common/scripts/regionUtils.js",
					"/common/scripts/highlightUtils.js",
					"/common/scripts/contentScript.js"
				];
				tabUtils._executeScripts(tabId, scripts, function () {
					chrome.tabs.sendMessage(tabId, command, function (status) {
						if (status === undefined) {
							console.log("Error calling content script '" + command.command + "': " +
								chrome.runtime.lastError);
							return (callback !== undefined) ? callback() : null;
						} else {
							return (callback !== undefined) ? callback(status) : null;
						}
					});
				});
			} else {
				return (callback !== undefined) ? callback(status) : null;
			}
		});
	},
	_executeScripts: function (tabId, files, callback) {
		if (files.length == 0) {
			return (callback !== undefined) ? callback() : null;
		} else {
			var file = files.splice(0, 1);
			chrome.tabs.executeScript(tabId, { file: file[0] }, function (results) {
				if (results === undefined) console.log("Error executing script: " + chrome.runtime.lastError);
				tabUtils._executeScripts(tabId, files, callback);
			});
		}
	}
};