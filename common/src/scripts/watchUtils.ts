import * as pageUtils from "./pageUtils";
import * as watchUtils from "./watchUtils";
import * as textUtils from "./textUtils";

// watch operations
export async function loadPage(url: string, progress?: (loaded: number, total: number) => void): Promise<Document | null> {
	var page = await _downloadPage(url, "", progress);
	return await _parsePage(url, page.mime, page.content, progress);
}

export async function adaptDelay(url: string, changes: number): Promise<void> {
	var config = await pageUtils.getEffectiveConfig(url);
	if (config === null) return;
	if (config.watchDelay < 0) {
		if (changes == 0)
			config.watchDelay = Math.round(config.watchDelay * config.autoDelayPercent / 100);
		else
			config.watchDelay = Math.round(config.watchDelay / config.autoDelayPercent * 100);

		if (config.watchDelay < -config.autoDelayMax) config.watchDelay = -config.autoDelayMax;
		if (config.watchDelay > -config.autoDelayMin) config.watchDelay = -config.autoDelayMin;
		await pageUtils.setConfigProperty(url, "watchDelay", config.watchDelay);
	}
}

export async function setChanges(url: string, changes: number): Promise<void> {
	await pageUtils.setChanges(url, changes);
	var config = await pageUtils.getEffectiveConfig(url);
	if (config === null) return;
	
	if (changes <= 0) {
		var next = Date.now() + Math.abs(config.watchDelay) * 60 * 1000;
		if (config.watchDelay == 0) next = 0;
		await pageUtils.setNextScan(url, next);
	} else {
		await pageUtils.setNextScan(url, 0);
	}
}

export async function scanPage(url: string): Promise<number> {
	var config = await pageUtils.getEffectiveConfig(url);
	if (config === null) return -1;
	var doc = await watchUtils.loadPage(url);
	if (doc === null) {
		await watchUtils.setChanges(url, -1);
		return -1; 
	}
	var newContent = textUtils.getText(doc, config);
	if (newContent === null) {
		await watchUtils.setChanges(url, -1);
		return -1;
	}
	var oldContent = await pageUtils.getContent(url);
	if(oldContent === null) {
		await watchUtils.setChanges(url, -1);
		return -1;
	} 
	if(!textUtils.isEqual(oldContent, newContent, config)) {
		await watchUtils.setChanges(url, 1);
		return 1;
	} else {
		await watchUtils.setChanges(url, 0);
		return 0;
	}
}

export async function markSeen(url: string): Promise<void> {
	var config = await pageUtils.getEffectiveConfig(url);
	if (config === null) return;
	var doc = await watchUtils.loadPage(url);
	if (doc === null) {
		await watchUtils.setChanges(url, -1);
		return; 
	}
	var newContent = textUtils.getText(doc, config);
	if(newContent !== null) 
		await pageUtils.setContent(url, newContent);
	await watchUtils.setChanges(url, 0);
}

async function _downloadPage(url: string, mime: string, progress?: (loaded: number, total: number) => void): Promise<{mime: string, content: string | null}> {
	return new Promise(resolve => {
		var xhr = new XMLHttpRequest();
		xhr.timeout = 60000;
		if (mime != "") xhr.overrideMimeType(mime);
		xhr.onprogress = function(e) {
			if(progress !== undefined && e.lengthComputable) progress(e.loaded, e.total);
		}
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				var contentType = xhr.getResponseHeader("content-type");
				if (mime == "" && contentType)
					mime = contentType;
				if (xhr.status >= 200 && xhr.status < 300)
					resolve({mime: mime, content: xhr.responseText});
				else
					resolve({mime: "error/" + xhr.status, content: null});
			}
		};
		xhr.open("GET", url, true);
		if (mime == "") xhr.setRequestHeader("Cache-Control", "max-age=0");
		xhr.send();
	});
}

async function _parsePage(url: string, mime: string, content: string | null, progress?: (loaded: number, total: number) => void): Promise<Document | null> {
	var parser = new DOMParser();
	if (content === null) {
		console.log("Error loading " + url + ": " + mime);
		return null;
	}
	var doc = parser.parseFromString(content, "text/html");
	if (mime.toLowerCase().indexOf("charset") < 0) {
		var metas = doc.getElementsByTagName("meta");
		for (var meta of metas) {
			var httpEquiv = meta.getAttribute("http-equiv");
			var metaContent = meta.getAttribute("content");
			if (httpEquiv && httpEquiv.toLowerCase() == "content-type" && metaContent) {
				mime = metaContent;
				if (mime.toLowerCase().indexOf("charset") > 0) {
					var page = await _downloadPage(url, mime, progress);
					return await _parsePage(url, page.mime, page.content, progress);
				}
			}
		}
	}
	return doc;
}
