var ioUtils = {
	clean: function (url) {
		return url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
	},
	getConfig: async function () {
		var config = await ioUtils._get("config");
		if(config) return config; else return {};
	},
	setConfig: async function (config) {
		await ioUtils._set("config", config);
	},
	listIndex: async function () {
		var index = await ioUtils._get("index");
		if(index) return index; else return {};
	},
	observeIndex: async function (observer) {
		chrome.storage.onChanged.addListener((changes, scope) => {
			if (scope == "local" && "index" in changes) {
				observer(changes["index"].newValue);
			}
		});
		observer(await ioUtils.listIndex());
	},
	findInIndex: async function (selector) {
		var index = await ioUtils._get("index");
		var ret = [];
		if (index) {
			for (var url in index) {
				var result = selector(url, index[url]);
				if (result !== null) ret.push(result);
			}
		}
		return ret;
	},
	setInIndex: async function (url, status) {
		var index = await ioUtils._get("index");
		if (!index) index = {};
		index[ioUtils.clean(url)] = status;
		await ioUtils._set("index", index);
	},
	get: async function (url, key) {
		var storagekey = ioUtils.clean(url);
		var data = await ioUtils._get(storagekey);
		if (data && key in data) {
			return data[key];
		} else {
			return null; 
		}
	},
	put: async function (url, key, data) {
		var storagekey = ioUtils.clean(url);
		var olddata = await ioUtils._get(storagekey);
		if (!olddata) {
			olddata = {};
			await ioUtils.setInIndex(url, {});
		}
		olddata[key] = data;
		await ioUtils._set(storagekey, olddata);
	},
	remove: async function (url) {
		var storagekey = ioUtils.clean(url);
		await ioUtils._remove(storagekey);
		var index = await ioUtils._get("index");
		delete index[url];
		await ioUtils._set("index", index);
	}, 
	_get: async function(key) {
		return new Promise(resolve => {
			chrome.storage.local.get(key, data => {
				if(key in data) 
					resolve(data[key]); 
				else 
					resolve(null); 
			});
		});
	}, 
	_set: async function(key, value) {
		var data = {}; 
		data[key] = value;
		return new Promise(resolve => {
			chrome.storage.local.set(data, resolve);
		});
	}, 
	_remove: async function(key) {
		return new Promise(resolve => {
			chrome.storage.local.remove(key, resolve);
		});
	}
};