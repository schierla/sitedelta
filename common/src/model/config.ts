export interface Config {
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
