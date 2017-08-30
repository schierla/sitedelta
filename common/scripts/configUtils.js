var configUtils = {
	getDefaultConfig: function(callback) {
		ioUtils.getConfig((config) => {
			if(configUtils._upgrade(config)) {
				ioUtils.setConfig(config, function() {});
			}
			callback(config);
		});
	},
	setDefaultConfigProperties: function(update, callback) {
		getDefaultConfig((config) => {
			for(var key in update) config[key] = update[key];
			ioUtils.setConfig(config, callback);
		});
	},
	
	getPresetConfig: function(uri, callback) {
		callback({});
	},

	getEffectiveConfig: function(override, callback) {
		configUtils.getDefaultConfig((config) => {
			var ret = {};
			for(var key in config) ret[key] = config[key];
			for(var key in override) ret[key] = override[key];
			callback(ret);
		});
	}, 

	_upgrade: function(config) {
		var upgraded = false;
		if(!("configVersion" in config)) {
			var initial = configUtils._initial();
			for(var key in initial) config[key] = initial[key];
			upgraded = true;
		}
		if(config.configVersion == 0) {
			// upgrade to config version 1
		}
		return upgraded;
	},

	_initial: function() {
		return {
			configVersion: 1,
			addBackground: "#ff8",
			addBorder: "#f00",
			includeRegion: "#f00",
			excludeRegion: "#0f0",
			showRegions: true,
			removeBackground: "#fee",
			removeBorder: "#ff0",
			moveBackground: "#efe",
			moveBorder: "#0b0",
			checkDeleted: true,
			scanImages: false,
			ignoreCase: false,
			ignoreNumbers: false,
			includes: ["/html/body[1]"],
			excludes: []
		};
	}
};