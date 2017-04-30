var io = {
    clean: function(url) {
        return url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
    },
    get: function(url, callback) {
        url = io.clean(url);
        chrome.storage.local.get(url, function(existing) {
            if(url in existing) {
                callback(existing[url]);
            } else {
                callback(null);
            }
        });
    },
    put: function(url, data, callback) {
        url = io.clean(url);
        io.get(url, function(existing) {
            if(existing == null) existing = {};
            for(var key in data) {
                existing[key] = data[key];
            }
            var set = {}; set[url] = existing;
            chrome.storage.local.set(set, callback);
        });
    }, 
    delete: function(url, callback) {
        url = io.clean(url);
        chrome.storage.local.remove(url, callback);
    }
};