interface Config {
	configVersion: number;
	addBackground: string;
	addBorder: string;
	includeRegion: string;
	excludeRegion: string;
	showRegions: boolean;
	removeBackground: string;
	removeBorder: string;
	moveBackground: string;
	moveBorder: string;
	checkDeleted: boolean;
	scanImages: boolean;
	ignoreCase: boolean;
	ignoreNumbers: boolean;
	includes: string[];
	excludes: string[];
	scanOnLoad: boolean;
	highlightOnLoad: boolean;
	enableContextMenu: boolean;
	autoDelayPercent: number;
	autoDelayMin: number;
	autoDelayMax: number;
	watchDelay: number;
	stripStyles: boolean;
	notifyFailed: boolean;
	notifyChanged: boolean;
	isolateRegions: boolean;
	makeVisible: boolean;
}

namespace configUtils {
	export async function getDefaultConfig(): Promise<Config> {
		var partialConfig = await ioUtils.getConfig() as Partial<Config>;
		var [upgraded, config] = _upgrade(partialConfig);
		if(upgraded) {
			ioUtils.setConfig(config);
		}
		return config;
	}

	export async function setDefaultConfigProperties(update: Partial<Config>) {
		var config = await configUtils.getDefaultConfig();
		for (var key in update) config[key] = update[key];
		await ioUtils.setConfig(config);
	}

	export async function getPresetConfig(uri: string): Promise<Partial<Config>> {
		return {};
	}

	export async function getEffectiveConfig(override: Partial<Config>): Promise<Config> {
		var config = await configUtils.getDefaultConfig();
		var ret = {};
		for (var key in config) ret[key] = config[key];
		for (var key in override) ret[key] = override[key];
		return ret as Config;
	}

	function _upgrade(config: Partial<Config>): [boolean, Config] {
		var upgraded = false;
		if (!("configVersion" in config)) {
			config.configVersion = 0, upgraded = true;
		}
		if (config.configVersion == 0) {
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
			config.configVersion = 1, upgraded = true;
		}
		if (config.configVersion == 1) {
			config.scanOnLoad = false;
			config.highlightOnLoad = false;
			config.enableContextMenu = false;
			config.configVersion = 2, upgraded = true;
		}
		if (config.configVersion == 2) {
			config.autoDelayPercent = 150;
			config.autoDelayMin = 10;
			config.autoDelayMax = 10080;
			config.watchDelay = 1440;
			config.configVersion = 3, upgraded = true;
		}
		if (config.configVersion == 3) {
			config.stripStyles = false;
			config.configVersion = 4, upgraded = true;
		}
		if(config.configVersion == 4) {
			config.notifyFailed = false;
			config.notifyChanged = true;
			config.configVersion = 5; upgraded = true;
		}
		if(config.configVersion == 5) {
			config.isolateRegions = false;
			config.configVersion = 6; upgraded = true;
		}
		if(config.configVersion == 6) {
			config.makeVisible = false;
			config.configVersion = 7; upgraded = true;
		}
		return [upgraded, config as Config];
	}
};