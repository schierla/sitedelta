// page operations
var pageUtils = {
	list: async function () {
		return await ioUtils.findInIndex((url, status) => url);
	},
	listChanged: async function () {
		return await ioUtils.findInIndex((url, status) => status["changes"] <= 0 ? null : url);
	},
	getStatus: async function (url) {
		var result = await ioUtils.findInIndex((furl, fstatus) => (url == furl ? fstatus : null));
		return result.length > 0 ? result[0] : null;
	},
	getChanges: async function (url) {
		var status = await pageUtils.getStatus(url);
		return status !== null && "changes" in status ? status["changes"] : 0;
	},
	getNextScan: async function (url) {
		var status = pageUtils.getStatus(url);
		return status !== null && "nextScan" in status ? status["nextScan"] : Date.now() + 60000;
	},
	getTitle: async function (url) {
		var status = await pageUtils.getStatus(url);
		if (status === null) return null;
		if ("title" in status)
			return status["title"];
		else {
			var title = await ioUtils.get(url, "title");
			await pageUtils.setTitle(url, title);
			return title;
		}
	},
	getContent: async function (url) {
		return await ioUtils.get(url, "content");
	},
	getConfig: async function (url) {
		return await ioUtils.get(url, "config");
	},
	getEffectiveConfig: async function (url) {
		var config = await pageUtils.getConfig(url);
		if (config === null) return null;
		return await configUtils.getEffectiveConfig(config);
	},
	getEffectiveConfigProperty: async function (url, property) {
		var config = await pageUtils.getEffectiveConfig(url);
		return config[property];
	},
	getOrCreateEffectiveConfig: async function (url, title) {
		var config = await pageUtils.getEffectiveConfig(url);
		if (config === null) {
			await pageUtils.create(url, title);
			return await pageUtils.getEffectiveConfig(url);
		} else {
			return config;
		}
	},
	create: async function (url, title) {
		var pagetitle = title.replace(/[\n\r]/g, ' ');
		var config = await configUtils.getPresetConfig(url);
		await pageUtils.setStatus(url, { "title": title });
		await pageUtils.setTitle(url, pagetitle);
		await pageUtils.setConfig(url, config);
	},
	remove: async function (url) {
		await ioUtils.remove(url);
	},
	setStatus: async function (url, status) {
		await ioUtils.setInIndex(url, status);
	},
	setStatusKey: async function (url, key, value) {
		var status = await pageUtils.getStatus(url);
		if (status === null) status = {};
		if (key in status && status[key] == value) return;
		status[key] = value; 
		await pageUtils.setStatus(url, status);
	},
	setNextScan: async function (url, nextScan) {
		await pageUtils.setStatusKey(url, "nextScan", nextScan);
	},
	setChanges: async function (url, changes) {
		await pageUtils.setStatusKey(url, "changes", changes);
	},
	setTitle: async function (url, title) {
		await ioUtils.put(url, "title", title);
		await pageUtils.setStatusKey(url, "title", title);
	},
	setContent: async function (url, content) {
		await ioUtils.put(url, "content", content);
	},
	setConfig: async function (url, config) {
		await ioUtils.put(url, "config", config);
	},
	setConfigProperty: async function (url, property, value) {
		var config = await pageUtils.getConfig(url);
		config[property] = value; 
		await pageUtils.setConfig(url, config);
	},
	removeInclude: async function (url, region) {
		var includes = await pageUtils.getEffectiveConfigProperty(url, "includes");
		var newlist = [];
		for (var i = 0; i < includes.length; i++) {
			if (includes[i] != region) newlist.push(includes[i]);
		}
		if (newlist.length == 0) newlist.push("/html/body[1]");
		await pageUtils.setConfigProperty(url, "includes", newlist);
	},
	removeExclude: async function (url, region) {
		var excludes = await pageUtils.getEffectiveConfigProperty(url, "excludes");
		var newlist = [];
		for (var i = 0; i < excludes.length; i++) {
			if (excludes[i] != region) newlist.push(excludes[i]);
		}
		await pageUtils.setConfigProperty(url, "excludes", newlist);
	},
	addInclude: async function (url, xpath) {
		if (xpath === null) return;
		var includes = await pageUtils.getEffectiveConfigProperty(url, "includes");
		var newlist = [];
		for (var i = 0; i < includes.length; i++) {
			if (includes[i] != "/html/body[1]") newlist.push(includes[i]);
		}
		newlist.push(xpath);
		await pageUtils.setConfigProperty(url, "includes", newlist);
	},
	addExclude: async function (url, xpath) {
		if (xpath === null) return;
		var excludes = await pageUtils.getEffectiveConfigProperty(url, "excludes");
		var newlist = [];
		for (var i = 0; i < excludes.length; i++) {
			newlist.push(excludes[i]);
		}
		newlist.push(xpath);
		await pageUtils.setConfigProperty(url, "excludes", newlist);
	}
};

