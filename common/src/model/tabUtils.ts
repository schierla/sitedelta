declare var USE_SCRIPTING_EXECUTE_SCRIPT: boolean;

export async function openResourceInForeground(url: string): Promise<void> {
	const current = await new Promise<chrome.windows.Window>(resolve => chrome.windows.getCurrent({ windowTypes: ['normal'] }, window => resolve(window)));
	await new Promise(resolve => chrome.tabs.create({ url: chrome.runtime.getURL(url), windowId: current.id }, resolve));
	if(current.id !== undefined) await new Promise(resolve => chrome.windows.update(current.id!, { focused: true }, resolve));
}

export async function openResource(url: string): Promise<void> {
	return new Promise(resolve => chrome.tabs.create({ url: chrome.runtime.getURL(url) }, () => resolve()));
}

export async function openResourceInBackground(url: string): Promise<void> {
	return new Promise(resolve => chrome.tabs.create({ url: chrome.runtime.getURL(url), active: false }, () => resolve()));
}

export async function getActive(): Promise<chrome.tabs.Tab> {
	return new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0])));
}

export function setBadgeText(text: string, tabId?: number) {
	(chrome.action ?? chrome.browserAction).setBadgeText({ text, tabId });
}

export function setBadgeBackgroundColor(color: string, tabId?: number) {
	(chrome.action ?? chrome.browserAction).setBadgeBackgroundColor({ color, tabId });
}

export async function showIcon(tabId: number, current?: any, changes?: number) {
	if (changes === undefined) {
		setBadgeText("", tabId);
	} else if (changes == 0) {
		setBadgeText("\xa0", tabId);
		setBadgeBackgroundColor("#0c0", tabId);
	} else if (changes > 0) {
		setBadgeText("" + current,  tabId );
		setBadgeBackgroundColor("#c00", tabId);
	} else {
		setBadgeText("X", tabId );
		setBadgeBackgroundColor("#ccc", tabId);
	}
}

export async function executeScript(tabId: number, file: string): Promise<void> {
	if(USE_SCRIPTING_EXECUTE_SCRIPT) {
		const results = await chrome.scripting.executeScript({files: [file], target: {tabId: tabId}});
		if(results[0].result === undefined) console.log("Error executing script: " + chrome.runtime.lastError);
	} else {
		const results = await new Promise(resolve => chrome.tabs.executeScript(tabId, { file: file }, resolve));
		if (results === undefined) console.log("Error executing script: " + chrome.runtime.lastError);
	}
}

var contentScriptTargets: string[] = [];

var contentScriptTargetTabListener = function(tabId: number, changeInfo: any, tab: chrome.tabs.Tab): void {
	if(changeInfo.status != "complete") return;
	if(!tab.url) return;
	
	if(contentScriptTargets.indexOf(tab.url) != -1)
		executeScript(tabId, '/contentScript.js');
}

export function initContentScriptTargets(urls: string[]): void {
	chrome.tabs.onUpdated.addListener(contentScriptTargetTabListener);
	updateContentScriptTarget(urls);
}

export async function updateContentScriptTarget(urls: string[]): Promise<void> {
	if((chrome as any).contentScripts) {
		for(var url of urls) {
			if(contentScriptTargets.indexOf(url) == -1) {
				var allowed = await new Promise(resolve => chrome.permissions.contains({origins: [url]}, resolve));
				if(allowed) {
					(chrome as any).contentScripts.register({
						js: [{file: '/contentScript.js' }], 
						matches: [ url.replace(/#.*$/, "") ]
					});
					contentScriptTargets.push(url);
				}
			}
		}
	} else {
		contentScriptTargets = urls;
	}
}
