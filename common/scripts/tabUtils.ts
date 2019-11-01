namespace tabUtils {

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
	
	export async function executeScripts(tabId: number, files: string[]): Promise<void> {
		for(var i=0; i<files.length; i++) {
			var results = await new Promise(resolve => chrome.tabs.executeScript(tabId, { file: files[i] }, resolve));
			if (results === undefined) console.log("Error executing script: " + chrome.runtime.lastError);
		}
	}

	var contentScriptTargets: string[] = [];

	var contentScriptTargetTabListener = function(tabId: number, changeInfo: any, tab: chrome.tabs.Tab): void {
		if(changeInfo.status != "complete") return;
		if(!tab.url) return;
		
		if(contentScriptTargets.indexOf(tab.url) != -1)
			executeScripts(tabId, ['/common/scripts/contentScript.js']);
	}

	export function initContentScriptTargets(urls: string[]): void {
		chrome.tabs.onUpdated.addListener(contentScriptTargetTabListener);
		updateContentScriptTarget(urls);
	}

	export function updateContentScriptTarget(urls: string[]): void {
		if((chrome as any).contentScripts) 
			for(var url in urls) 
				if(contentScriptTargets.indexOf(url) == -1)
					(chrome as any).contentScripts.register({
						js: [{file: '/common/scripts/contentScript.js' }], 
						matches: [ url.replace(/#.*$/, "") ]
					});
		contentScriptTargets = urls;
	}

}
