// tab operations
var tabUtils = {
	openResource: function(url) {
		chrome.tabs.create({url: chrome.runtime.getURL(url)});
	},
	getActive: function(callback) {
		chrome.tabs.query({active:true, currentWindow: true}, function(tabs) {
			callback(tabs[0]);
		});
	},
	showIcon: function(tabId, name, callback) {
		if(chrome.webNavigation) {
			chrome.browserAction.setIcon({
				path: {
					"16": "/common/icons/" + name + "-16.png", 
					"24": "/common/icons/" + name + "-24.png", 
					"32": "/common/icons/" + name + "-32.png", 
					"48": "/common/icons/" + name + "-48.png", 
					"64": "/common/icons/" + name + "-64.png"
				}, tabId: tabId}, 
			callback);
		} else {
			callback();
		}
	},
	getStatus: function(tabId, callback) {
		tabUtils._callContentScript(tabId, {command: "getStatus"}, callback);
	},
	getContent: function(tabId, url, callback) {
		pageUtils.getEffectiveConfig(url, function(config) {
			tabUtils._callContentScript(tabId, {command: "getContent", config: config}, function(content) {
				callback(content);
			});
		});
	},
	highlightChanges: function(tabId, url, callback) {
		pageUtils.getEffectiveConfig(url, function(config) {
			tabUtils._callContentScript(tabId, {command: "getContent", config: config}, function(content) {
				pageUtils.getContent(url, function(oldcontent) {
					if(oldcontent == null) oldcontent = "";
					pageUtils.setContent(url, content, function() {
						tabUtils._callContentScript(tabId, {command: "highlightChanges", config: config, content: oldcontent}, function(status) {
							callback(status);
						});
					});
				});
			});
		});
	},
	showOutline: function(tabId, xpath, color, callback) {
		tabUtils._callContentScript(tabId, {command: "showOutline", xpath: xpath, color: color}, callback);
	},
	removeOutline: function(tabId, callback) {
		tabUtils._callContentScript(tabId, {command: "removeOutline"}, callback);
	},
	selectInclude: function(tabId, url, callback) {
		tabUtils._callBackgroundScript({command: "addIncludeRegion", tab: tabId, url: url}, callback);
	}, 
	selectExclude: function(tabId, url, callback) {
		tabUtils._callBackgroundScript({command: "addExcludeRegion", tab: tabId, url: url}, callback);
	},
	selectRegion: function(tabId, callback) {
		tabUtils._callContentScript(tabId, {command: "selectRegion"}, callback);
	},

	// internal functions
	_callBackgroundScript: function(command, callback) {
		chrome.runtime.sendMessage(command, callback);
	},
	_callContentScript: function(tabId, command, callback) {
		chrome.tabs.sendMessage(tabId, command, function(status) {
			if(status == null) {
				var ignore = chrome.runtime.lastError;
				var scripts = [
					"/common/scripts/textUtils.js", 
					"/common/scripts/regionUtils.js", 
					"/common/scripts/highlightUtils.js", 
					"/common/scripts/contentScript.js"
				];
				tabUtils._executeScripts(tabId, scripts, function() {
					chrome.tabs.sendMessage(tabId, command, function(status) {
						if(status == null) {
							console.log("Error calling content script: " + chrome.runtime.lastError);
							callback();
						} else {
							callback(status);
						}
					});
				});
			} else {
				callback(status);
			}
		});
	},
	_executeScripts: function(tabId, files, callback) {
		if(files.length == 0) {
			callback();
		} else {
			var file = files.splice(0, 1);
			chrome.tabs.executeScript(tabId, {file: file[0]}, function() {
				tabUtils._executeScripts(tabId, files, callback);
			});
		}
	}
};