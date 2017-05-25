var SCOPE_HIGHLIGHT = "highlight";
var SCOPE_WATCH = "watch";

var ioUtils = {
    clean: function(url) {
        return url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
    },
    list: function(scope, callback) {
        chrome.storage.local.get(null, function(existing) {
            var ret = [];
            for(var storagekey in existing) {
                if(storagekey.startsWith(scope + ":")) ret.push(storagekey.substr(scope.length + 1));
            }            
            callback(ret);
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
            }
            existing[storagekey][key] = data;
            chrome.storage.local.set(existing, callback);
        });
    }, 
    delete: function(scope, url, callback) {
        url = scope + ":" + ioUtils.clean(url);
        chrome.storage.local.remove(url, callback);
    }
};