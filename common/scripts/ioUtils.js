var SCOPE_HIGHLIGHT = "sdHighlight";
var SCOPE_WATCH = "sdWatch";

var ioUtils = {
    clean: function(url) {
        return url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
    },
    findInIndex: function(scope, selector, callback) {
        chrome.storage.local.get(scope, function(existing) {
            var ret = [];
            if(scope in existing) {
                for(var url in existing[scope]) {
                    var result = selector(url, existing[scope][url]);
                    if(result != null) ret.push(result);
                }
            }
            callback(ret);
        });
    },
    setInIndex: function(scope, url, status, callback) {
        chrome.storage.local.get(scope, function(existing) {
            if(!(scope in existing)) existing[scope]={};
            existing[scope][ioUtils.clean(url)] = status;
            chrome.storage.local.set(existing, callback);
        });
    },
    get: function(scope, url, key, callback) {
        var storagekey = scope + ":" + ioUtils.clean(url);
        chrome.storage.local.get(storagekey, function(existing) {
            if(storagekey in existing && key in existing[storagekey]) {
                callback(existing[storagekey][key]);
            } else {
                callback(null);
            }
        });
    },
    put: function(scope, url, key, data, callback) {
        var storagekey = scope + ":" + ioUtils.clean(url);
        chrome.storage.local.get(storagekey, function(existing) {
            if(!(storagekey in existing)) {
                existing = {};
                existing[storagekey]= {};
                ioUtils.setInIndex(scope, ioUtils.clean(url), {}, function() {});
            }
            existing[storagekey][key] = data;
            chrome.storage.local.set(existing, callback);
        });
    }, 
    delete: function(scope, url, callback) {
        url = scope + ":" + ioUtils.clean(url);
        chrome.storage.local.remove(url, function() {
            chrome.storage.local.get(scope, function(existing) {
                existing[scope][ioUtils.clean(url)] = null;
                chrome.storage.local.set(existing, callback);
            });
        });        
    }
};