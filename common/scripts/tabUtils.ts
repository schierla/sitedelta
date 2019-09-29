// tab operations
namespace tabUtils {

	export enum PageState {
		ERROR = 0,
		LOADED = 1,
		HIGHLIGHTED = 2,
		SELECTREGION = 3,
	};

	export async function openResource(url: string): Promise<void> {
		return new Promise(resolve => {
			chrome.tabs.create({ url: chrome.runtime.getURL(url) }, () => resolve());
		});
	}

	export async function openResourceInBackground(url: string): Promise<void> {
		return new Promise(resolve => {
			chrome.tabs.create({ url: chrome.runtime.getURL(url), active: false }, () => resolve());
		});
	}

	export async function getActive(): Promise<chrome.tabs.Tab> {
		return new Promise(resolve => {
			chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0]));
		});
	}

	export async function showIcon(tabId: number, current?: any, changes?: number) {
		if (chrome.webNavigation) {
			if (changes === undefined) {
				chrome.browserAction.setBadgeText({ text: "", tabId: tabId });
			} else if (changes == 0) {
				chrome.browserAction.setBadgeText({ text: " ", tabId: tabId });
				chrome.browserAction.setBadgeBackgroundColor({ color: "#0c0", tabId: tabId });
			} else if (changes > 0) {
				chrome.browserAction.setBadgeText({ text: "" + current, tabId: tabId });
				chrome.browserAction.setBadgeBackgroundColor({ color: "#c00", tabId: tabId });
			} else {
				chrome.browserAction.setBadgeText({ text: "X", tabId: tabId });
				chrome.browserAction.setBadgeBackgroundColor({ color: "#ccc", tabId: tabId });
			}
		}
	}
	
	export async function getStatus(tabId: number): Promise<HighlightState> {
		return await _csGetStatus(tabId);
	}

	export async function getContent(tabId: number, url: string): Promise<string | null> {
		var config = await pageUtils.getEffectiveConfig(url);
		if(config === null) return null;
		return await _csGetContent(tabId, config);
	}

	export async function checkChanges(tabId: number, url: string) : Promise<number> {
		var config = await pageUtils.getEffectiveConfig(url);
		if (config === null) return -1;
		var oldcontent = await pageUtils.getContent(url);
		if (oldcontent === null) return -1;
		var content = await _csGetContent(tabId, config);
		if (content === undefined) return -1;
		if (textUtils.isEqual(oldcontent, content, config)) { 
			// unchanged
			return 0;
		} else {
			return 1;
		}
	}

	export async function highlightChanges(tabId: number, url: string): Promise<HighlightState> {
		var config = await pageUtils.getEffectiveConfig(url);
		if(!config) return {state: PageState.ERROR};
		var content = await _csGetContent(tabId, config);
		if (content === undefined) return {state: PageState.ERROR};
		var oldcontent = await pageUtils.getContent(url);
		if (oldcontent === null) oldcontent = "";
		await pageUtils.setContent(url, content);
		var status = await _csHighlightChanges(tabId, config, oldcontent); 
		return status; 
	}

	export async function showOutline(tabId: number, xpath: string, color: string): Promise<void> {
		await _csShowOutline(tabId, xpath, color);
	}

	export async function removeOutline(tabId: number): Promise<void> {
		await _csRemoveOutline(tabId);
	}

	export async function selectInclude(tabId: number, url: string): Promise<string> {
		return await _bsAddIncludeRegion(tabId, url);
	}

	export async function selectExclude(tabId: number, url: string): Promise<string> {
		return await _bsAddExcludeRegion(tabId, url);
	}

	export async function loadInTab(tabId: number, url: string): Promise<void> {
		return await _bsLoadInTab(tabId, url);
	}

	export async function selectRegion(tabId: number) {
		return await _csSelectRegion(tabId);
	}

	// content script functions

	function _csShowOutline(tab: number, xpath: string, color: string) {
		return _callContentScript(tab, { command: "showOutline", xpath: xpath, color: color });
	}
	function _csRemoveOutline(tab: number): Promise<void> {
		return _callContentScript(tab, { command: "removeOutline" });
	}
	function _csSelectRegion(tab: number): Promise<string> {
		return _callContentScript(tab, { command: "selectRegion" });
	}
	function _csGetContent(tab: number, config: Config): Promise<string> {
		return _callContentScript(tab, { command: "getContent", config: config });
	}
	function _csHighlightChanges(tab: number, config: Config, content: string): Promise<HighlightState> {
		return _callContentScript(tab, { command: "highlightChanges", config: config, content: content });
	}
	function _csGetStatus(tab: number): Promise<HighlightState> {
		return _callContentScript(tab, { command: "getStatus" });
	}

	// background script functions

	function _bsLoadInTab(tab: number, url: string): Promise<void> {
		return _callBackgroundScript({ command: "loadInTab", tab: tab, url: url })
	}
	function _bsAddExcludeRegion(tab: number, url: string): Promise<string> {
		return _callBackgroundScript({ command: "addExcludeRegion", tab: tab, url: url });
	}
	function _bsAddIncludeRegion(tab: number, url: string): Promise<string> {
		return _callBackgroundScript({ command: "addIncludeRegion", tab: tab, url: url });
	}

	// internal functions

	async function _callBackgroundScript(command: Record<string,any>): Promise<any> {
		return new Promise(resolve => {
			chrome.runtime.sendMessage(command, resolve);
		});
	}

	async function _callContentScript(tabId: number, command: {command: string, url?: string, config?: Config, content?: string, xpath?: string, color?: string}): Promise<any> {
		var status = await new Promise(resolve => chrome.tabs.sendMessage(tabId, command, ret => {
			ret === undefined && chrome.runtime.lastError;
			resolve(ret);
		}));
		if (status === undefined) {
			var scripts = [
				"/common/scripts/textUtils.js",
				"/common/scripts/regionUtils.js",
				"/common/scripts/highlightUtils.js",
				"/common/scripts/contentScript.js"
			];
			await executeScripts(tabId, scripts);
			var status = await new Promise(resolve => chrome.tabs.sendMessage(tabId, command, resolve));
			if (status === undefined) {
				console.log("Error calling content script '" + command.command + "': " +
					chrome.runtime.lastError);
				return;
			} else {
				return status;
			}
		} else {
			return status;
		}
	}

	export async function executeScripts(tabId: number, files: string[]): Promise<void> {
		for(var i=0; i<files.length; i++) {
			var results = await new Promise(resolve => chrome.tabs.executeScript(tabId, { file: files[i] }, resolve));
			if (results === undefined) console.log("Error executing script: " + chrome.runtime.lastError);
		}
	}
};