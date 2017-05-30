// tab operations
var tabController = {
    tabOpenResource: function(url) {
        chrome.tabs.create({url: chrome.runtime.getURL(url)});
    },
    tabGetActive: function(callback) {
        chrome.tabs.query({active:true, currentWindow: true}, function(tabs) {
            callback(tabs[0]);
        });
    },
    tabShowIcon: function(tabId, url, callback) {
        chrome.browserAction.setIcon({path: url, tabId: tabId}, callback);
    },
    tabGetStatus: function(tabId, callback) {
        tabController._callContentScript(tabId, {command: "getStatus"}, callback);
    },
    tabGetContent: function(scope, tabId, url, callback) {
        pageController.pageGetConfig(scope, url, function(config) {
            tabController._callContentScript(tabId, {command: "getContent", config: config}, function(content) {
                callback(content);
            });
        });
    },
    tabHighlightChanges: function(scope, tabId, url, callback) {
        pageController.pageGetConfig(scope, url, function(config) {
            tabController._callContentScript(tabId, {command: "getContent", config: config}, function(content) {
                pageController.pageGetContent(scope, url, function(oldcontent) {
                    if(oldcontent == null) oldcontent = "";
                    pageController.pageSetContent(scope, url, content, function() {
                        tabController._callContentScript(tabId, {command: "highlightChanges", config: config, content: oldcontent}, function(status) {
                            callback(status);
                        });
                    });
                });
            });
        });
    },
    tabShowOutline: function(tabId, xpath, color, callback) {
        tabController._callContentScript(tabId, {command: "showOutline", xpath: xpath, color: color}, callback);
    },
    tabRemoveOutline: function(tabId, callback) {
        tabController._callContentScript(tabId, {command: "removeOutline"}, callback);
    },
    tabSelectInclude: function(tabId, url, callback) {
        tabController._callBackgroundScript({command: "addIncludeRegion", tab: tabId, url: url}, callback);
    }, 
    tabSelectExclude: function(tabId, url, callback) {
        tabController._callBackgroundScript({command: "addExcludeRegion", tab: tabId, url: url}, callback);
    },
    tabSelectRegion: function(tabId, callback) {
        tabController._callContentScript(tabId, {command: "selectRegion"}, callback);
    },

    // internal functions
    _callBackgroundScript: function(command, callback) {
        chrome.runtime.sendMessage(command, callback);
    },
    _callContentScript: function(tabId, command, callback) {
        chrome.tabs.sendMessage(tabId, command, function(status) {
            if(chrome.runtime.lastError) {
                var scripts = [
                    "/common/scripts/textUtils.js", 
                    "/common/scripts/regionUtils.js", 
                    "/common/scripts/highlightUtils.js", 
                    "/common/scripts/contentScript.js"
                ];
                tabController._executeScripts(tabId, scripts, function() {
                    chrome.tabs.sendMessage(tabId, command, function(status) {
                        if(chrome.runtime.lastError) {
                            console.log(chrome.runtime.lastError);
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
                tabController._executeScripts(tabId, files, callback);
            });
        }
    }
};