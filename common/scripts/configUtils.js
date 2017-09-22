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
		configUtils.getDefaultConfig((config) => {
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
			config.configVersion = 0;
			upgraded = true;
		}
		if(config.configVersion == 0) {
			config.addBackground = "#ff8";
			config.addBorder = "#f00";
			config.includeRegion = "#f00";
			config.excludeRegion = "#0f0";
			config.showRegions = true;
			config.removeBackground = "#fee";
			config.removeBorder = "#ff0";
			config.moveBackground = "#efe";
			config.moveBorder = "#0b0";
			config.checkDeleted = true;
			config.scanImages = false;
			config.ignoreCase = false;
			config.ignoreNumbers = false;
			config.includes = ["/html/body[1]"];
			config.excludes = [];
			config.configVersion = 1,
			upgraded = true;
		}
		if(config.configVersion == 1) {
			config.scanOnLoad = false;
			config.highlightOnLoad = false;
			config.enableContextMenu = false;
			config.configVersion = 2,
			upgraded = true;
		}
		if(config.configVersion == 2) {
			config.autoDelayPercent = 150;
			config.autoDelayMin = 10;
			config.autoDelayMax = 10080;
			config.watchDelay = 1440;
			config.configVersion = 3,
			upgraded = true;
		}
		return upgraded;
	},

	_initial: function() {
		return {
		};
	}
};