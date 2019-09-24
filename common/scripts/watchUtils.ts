// watch operations
var watchUtils = {

	loadPage: async function (url, progress) {
		var page = await watchUtils._downloadPage(url, "");
		return await watchUtils._parsePage(url, page.mime, page.content, progress);
	},

	adaptDelay: async function (url, changes) {
		var config = await pageUtils.getEffectiveConfig(url);
		if (config.watchDelay < 0) {
			if (changes == 0)
				config.watchDelay = Math.round(config.watchDelay * config.autoDelayPercent / 100);
			else
				config.watchDelay = Math.round(config.watchDelay / config.autoDelayPercent * 100);

			if (config.watchDelay < -config.autoDelayMax) config.watchDelay = -config.autoDelayMax;
			if (config.watchDelay > -config.autoDelayMin) config.watchDelay = -config.autoDelayMin;
			await pageUtils.setConfigProperty(url, "watchDelay", config.watchDelay);
		}
	},

	setChanges: async function (url, changes) {
		await pageUtils.setChanges(url, changes);
		var config = await pageUtils.getEffectiveConfig(url);
		
		if (changes <= 0) {
			var next = Date.now() + Math.abs(config.watchDelay) * 60 * 1000;
			if (config.watchDelay == 0) next = 0;
			await pageUtils.setNextScan(url, next);
		} else {
			await pageUtils.setNextScan(url, 0);
		}
	},

	scanPage: async function(url) {
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
	},

	markSeen: async function(url) {
		var config = await pageUtils.getEffectiveConfig(url);
		if (config === null) return;
		var doc = await watchUtils.loadPage(url);
		if (doc === null) {
			await watchUtils.setChanges(url, -1);
			return; 
		}
		var newContent = textUtils.getText(doc, config);
		await pageUtils.setContent(url, newContent);
		await watchUtils.setChanges(url, 0);
	},

	_downloadPage: async function (url, mime, progress) {
		return new Promise(resolve => {
			var xhr = new XMLHttpRequest();
			xhr.timeout = 60000;
			if (mime != "") xhr.overrideMimeType(mime);
			xhr.onprogress = function(e) {
				if(progress !== undefined && e.lengthComputable) progress(e.loaded, e.total);
			}
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (mime == "" && xhr.getResponseHeader("content-type"))
						mime = xhr.getResponseHeader("content-type");
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
	},

	_parsePage: async function (url, mime, content, progress) {
		var parser = new DOMParser();
		if (content === null) {
			console.log("Error loading " + url + ": " + mime);
			return null;
		}
		var doc = parser.parseFromString(content, "text/html");
		if (mime.toLowerCase().indexOf("charset") < 0) {
			var metas = doc.getElementsByTagName("meta");
			for (var i = 0; i < metas.length; i++) {
				if (metas.item(i).getAttribute("http-equiv") && metas.item(i).getAttribute("http-equiv").toLowerCase() == "content-type") {
					mime = metas.item(i).getAttribute("content");
					if (mime.toLowerCase().indexOf("charset") > 0) {
						var page = await watchUtils._downloadPage(url, mime, progress);
						return await watchUtils._parsePage(url, page.mime, page.content, progress);
					}
				}
			}
		}
		return doc;
	}
};