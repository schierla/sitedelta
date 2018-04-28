// watch operations
var watchUtils = {

	loadPage: function (url, callback, progress) {
		watchUtils._downloadPage(url, "", function (mime, content) {
			watchUtils._parsePage(url, mime, content, callback, progress);
		}, progress);
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

	scanPage: function(url, callback) {
		pageUtils.getEffectiveConfig(url, function (config) {
			if (config === null) return (callback !== undefined) ? callback(-1) : null;
			watchUtils.loadPage(url, function (doc) {
				if (doc === null) return watchUtils.setChanges(url, -1, () => (callback !== undefined) ? callback(-1) : null);
				var newContent = textUtils.getText(doc, config);
				pageUtils.getContent(url, function (oldContent) {
					if(oldContent === null) return watchUtils.setChanges(url, -1, () => (callback !== undefined) ? callback(-1) : null);
					if (textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
						watchUtils.setChanges(url, 1, () => (callback !== undefined) ? callback(1) : null);
					} else {
						watchUtils.setChanges(url, 0, () => (callback !== undefined) ? callback(0) : null);
					}
				});
			});
		});
	},

	markSeen: function(url, callback) {
		pageUtils.getEffectiveConfig(url, function (config) {
			if (config === null) return (callback !== undefined) ? callback() : null;
			watchUtils.loadPage(url, function (doc) {
				if (doc === null) return watchUtils.setChanges(url, -1, callback);
				var newContent = textUtils.getText(doc, config);
				pageUtils.setContent(url, newContent, () => {
					watchUtils.setChanges(url, 0, callback);
				});
			});
		});
	},

	_downloadPage: function (url, mime, callback, progress) {
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

	_parsePage: function (url, mime, content, callback, progress) {
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
							watchUtils._parsePage(url, mime, content, callback, progress);
						}, progress);
						return;
					}
				}
			}
		}
		callback(doc);
	}
};