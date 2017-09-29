
var ioUtils = {
	clean: function(url) {
		return url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
	},
	getConfig: function(callback) {
		chrome.storage.local.get("config", function(existing) {
			if("config" in existing) {
				callback(existing["config"]);
			} else {
				callback({});
			}
		});
	},
	setConfig: function(config, callback) {
		chrome.storage.local.set({"config": config}, callback);
	},
	listIndex: function(callback) {
		chrome.storage.local.get("index", function(existing) {
			if("index" in existing) {
				callback(existing["index"]);
			} else {
				callback({});
			}
		});
	},
	observeIndex: function(callback) {
		chrome.storage.onChanged.addListener((changes, scope) => {
			if(scope == "local" && "index" in changes) {
				callback(changes["index"].newValue);
			}
		});
		ioUtils.listIndex(callback);
	},
	findInIndex: function(selector, callback) {
		chrome.storage.local.get("index", function(existing) {
			var ret = [];
			if("index" in existing) {
				for(var url in existing["index"]) {
					var result = selector(url, existing["index"][url]);
					if(result != null) ret.push(result);
				}
			}
			callback(ret);
		});
	},
	setInIndex: function(url, status, callback) {
		chrome.storage.local.get("index", function(existing) {
			if(!("index" in existing)) existing["index"]={};
			existing["index"][ioUtils.clean(url)] = status;
			chrome.storage.local.set(existing, callback);
		});
	},
	get: function(url, key, callback) {
		var storagekey = ioUtils.clean(url);
		chrome.storage.local.get(storagekey, function(existing) {
			if(storagekey in existing && key in existing[storagekey]) {
				callback(existing[storagekey][key]);
			} else {
				callback(null);
			}
		});
	},
	put: function(url, key, data, callback) {
		var storagekey = ioUtils.clean(url);
		chrome.storage.local.get(storagekey, function(existing) {
			if(!(storagekey in existing)) {
				existing = {};
				existing[storagekey]= {};
				ioUtils.setInIndex(url, {}, function() {});
			}
			existing[storagekey][key] = data;
			chrome.storage.local.set(existing, callback);
		});
	}, 
	remove: function(url, callback) {
		url = ioUtils.clean(url);
		chrome.storage.local.remove(url, function() {
			chrome.storage.local.get("index", function(existing) {
				delete existing["index"][ioUtils.clean(url)];
				chrome.storage.local.set(existing, callback);
			});
		});        
	}
};