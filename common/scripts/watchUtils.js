// watch operations
var watchUtils = {

	loadPage: function (url, callback) {
		watchUtils._downloadPage(url, "", function (mime, content) {
			watchUtils._parsePage(url, mime, content, callback);
		});
	},

	adaptDelay: function (url, changes) {
		pageUtils.getEffectiveConfig(url, config => {
			if (config.watchDelay < 0) {
				if (changes == 0)
					config.watchDelay = Math.round(config.watchDelay * config.autoDelayPercent / 100);
				else
					config.watchDelay = Math.round(config.watchDelay / config.autoDelayPercent * 100);

				if (config.watchDelay < -config.autoDelayMax) config.watchDelay = -config.autoDelayMax;
				if (config.watchDelay > -config.autoDelayMin) config.watchDelay = -config.autoDelayMin;
				pageUtils.setConfigProperty(url, "watchDelay", config.watchDelay);
			}
		});
	},

	setChanges: function (url, changes, callback) {
		pageUtils.setChanges(url, changes, function () {
			watchUtils.showChanges();
			pageUtils.getEffectiveConfig(url, config => {
				if (changes <= 0) {
					var next = Date.now() + Math.abs(config.watchDelay) * 60 * 1000;
					if (config.watchDelay == 0) next = 0;
					pageUtils.setNextScan(url, next, callback);
				} else {
					pageUtils.setNextScan(url, 0, callback);
				}
			});
		});
	},

	showChanges: function () {
		pageUtils.listChanged(function (changed) {
			if (changed.length > 0)
				chrome.browserAction.setBadgeText({ text: "" + changed.length });
			else
				chrome.browserAction.setBadgeText({ text: "" });
		});
	},

	_downloadPage: function (url, mime, callback) {
		var xhr = new XMLHttpRequest();
		xhr.timeout = 60000;
		if (mime != "") xhr.overrideMimeType(mime);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (mime == "" && xhr.getResponseHeader("content-type"))
					mime = xhr.getResponseHeader("content-type");
				if (callback === undefined) return;
				if (xhr.status >= 200 && xhr.status < 300)
					callback(mime, xhr.responseText);
				else
					callback("error/" + xhr.status, null);
			}
		};
		xhr.open("GET", url, true);
		if (mime == "") xhr.setRequestHeader("Cache-Control", "max-age=0");
		xhr.send();
	},

	_parsePage: function (url, mime, content, callback) {
		var parser = new DOMParser();
		if (content === null) {
			console.log("Error loading " + url + ": " + mime);
			return (callback !== undefined) ? callback(null) : null;
		}
		var doc = parser.parseFromString(content, "text/html");
		if (mime.toLowerCase().indexOf("charset") < 0) {
			var metas = doc.getElementsByTagName("meta");
			for (var i = 0; i < metas.length; i++) {
				if (metas.item(i).getAttribute("http-equiv") && metas.item(i).getAttribute("http-equiv").toLowerCase() == "content-type") {
					mime = metas.item(i).getAttribute("content");
					if (mime.toLowerCase().indexOf("charset") > 0) {
						watchUtils._downloadPage(url, mime, function (mime, content) {
							watchUtils._parsePage(url, mime, content, callback);
						});
						return;
					}
				}
			}
		}
		callback(doc);
	}
};