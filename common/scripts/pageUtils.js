// page operations
var pageUtils = {
	list: function(callback) {
		ioUtils.findInIndex((url, status) => url, callback);
	}, 
	listChanged: function(callback) {
		ioUtils.findInIndex((url, status) => status["changes"]==0?null:url, callback);
	}, 
	getStatus: function(url, callback) {
		ioUtils.findInIndex((furl, fstatus) => (url == furl ? fstatus : null), 
				(result) => result.length > 0 ? callback(result[0]) : callback({}));
	},
	getChanges: function(url, callback) {
		pageUtils.getStatus(url, 
			(status) => callback("changes" in status ? status["changes"] : 0));
	},
	getNextScan: function(url, callback) {
		pageUtils.getStatus(url, 
			(status) => callback("nextScan" in status ? status["nextScan"] : Date.now() + 60000));
	},
	getTitle: function(url, callback) {
		pageUtils.getStatus(url, status => {
			if("title" in status) 
				callback(status["title"]);
			else 
				ioUtils.get(url, "title", title => {
					pageUtils.setTitle(url, title, () => {
						callback(title);
					}); 
				}); 
		});
	},    
	getContent: function(url, callback) {
		ioUtils.get(url, "content", callback);
	},
	getConfig: function(url, callback) {
		ioUtils.get(url, "config", callback);
	},
	getEffectiveConfig: function(url, callback) {
		pageUtils.getConfig(url, (config) => {
			if(config == null) callback(null);
			else configUtils.getEffectiveConfig(config, callback);   
		});
	},
	getEffectiveConfigProperty: function(url, property, callback) {
		pageUtils.getEffectiveConfig(url, (config) => callback(config[property]));
	},
	getOrCreateEffectiveConfig: function(url, title, callback) {
		pageUtils.getEffectiveConfig(url, function(config) {
			if(config == null) {
				pageUtils.create(url, title, 
					() => pageUtils.getEffectiveConfig(url, callback));
			} else {
				callback(config);
			}
		});
	},
	create: function(url, title, callback) {
		var pagetitle = title.replace(/[\n\r]/g, ' ');
		configUtils.getPresetConfig(url, (config) => {
			pageUtils.setStatus(url, {"title": title}, 
				() => pageUtils.setTitle(url, pagetitle, 
					() => pageUtils.setConfig(url, config, 
						() => callback())));
		});
	},
	remove: function(url, callback) {
		ioUtils.remove(url, callback);
	},
	setStatus: function(url, status, callback) {
		ioUtils.setInIndex(url, status, callback);
	},
	setStatusKey: function(url, key, value, callback) {
		pageUtils.getStatus(url, (status) => {
			if(key in status && status[key]==value) return callback(); 
			status[key] = value; pageUtils.setStatus(url, status, callback);
		});
	},
	setNextScan: function(url, nextScan, callback) {
		pageUtils.setStatusKey(url, "nextScan", nextScan, callback);
	},
	setChanges: function(url, changes, callback) {
		pageUtils.setStatusKey(url, "changes", nextScan, callback);
	},
	setTitle: function(url, title, callback) {
		ioUtils.put(url, "title", title, () => {
			pageUtils.setStatusKey(url, "title", title, callback);
		}); 
	},
	setContent: function(url, content, callback) {
		ioUtils.put(url, "content", content, callback);
	},
	setConfig: function(url, config, callback) {
		ioUtils.put(url, "config", config, callback);
	},
	setConfigProperty: function(url, property, value, callback) {
		pageUtils.getConfig(url, 
			(config) => { config[property] = value; pageUtils.setConfig(url, config, callback); });
	},
	removeInclude: function(url, region, callback) {
		pageUtils.getEffectiveConfigProperty(url, "includes", function(includes) {
			var newlist = [];
			for(var i=0; i<includes.length; i++) {
				if(includes[i] != region) newlist.push(includes[i]);
			}
			if(newlist.length == 0) newlist.push("/html/body[1]");
			pageUtils.setConfigProperty(url, "includes", newlist, callback);
		});
	},
	removeExclude: function(url, region, callback) {
		pageUtils.getEffectiveConfigProperty(url, "excludes", function(excludes) {
			var newlist = [];
			for(var i=0; i<excludes.length; i++) {
				if(excludes[i] != region) newlist.push(excludes[i]);
			}
			pageUtils.setConfigProperty(url, "excludes", newlist, callback);
		});
	},
	addInclude: function(url, xpath, callback) {
		if(xpath == null) return;
		pageUtils.getEffectiveConfigProperty(url, "includes", function(includes) {
			var newlist = [];
			for(var i=0; i<includes.length; i++) {
				if(includes[i] != "/html/body[1]") newlist.push(includes[i]);
			}
			newlist.push(xpath);
			pageUtils.setConfigProperty(url, "includes", newlist, callback);
		});
	},
	addExclude: function(url, xpath, callback) {
		if(xpath == null) return;
		pageUtils.getEffectiveConfigProperty(url, "excludes", function(excludes) {
			var newlist = [];
			for(var i=0; i<excludes.length; i++) {
				newlist.push(excludes[i]);
			}
			newlist.push(xpath);
			pageUtils.setConfigProperty(url, "excludes", newlist, callback);
		});
	}
};

