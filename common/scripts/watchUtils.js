// watch operations
var watchUtils = {
	initAlarms: function() {
		pageUtils.list(function(pages) {
			for(var i=0; i<pages.length; i++) {
				watchUtils.updateAlarm(pages[i]);
			}
		});
	},
	updateAlarm(url) {
		pageUtils.getNextScan(url,
			(nextScan) => chrome.alarms.create(url, {when: nextScan}));
	},

	loadPage: function(url, callback) {
		watchUtils._downloadPage(url, "", function(mime, content) {
			watchUtils._parsePage(url, mime, content, callback);
		});
	},

	setChanges: function(url, changes) {
		pageUtils.setChanges(url, changes, function() {
			pageUtils.listChanged(function(changed) {
				if(changed > 0) 
					chrome.browserAction.setBadgeText({text:changed.length});
				else 
					chrome.browserAction.setBadgeText({text:""});
			});
		});
	},

	_downloadPage: function(url, mime, contentCallback) {
		var xhr = new XMLHttpRequest();
		if(mime != "") xhr.overrideMimeType(mime);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if(mime == "" && xhr.getResponseHeader("content-type"))
					mime = xhr.getResponseHeader("content-type");
				contentCallback(mime, xhr.responseText);
			}
		};
		xhr.open("GET", url, true);
		xhr.send();
	},
	_parsePage: function(url, mime, content, documentCallback) {
		var parser = new DOMParser();
		var doc = parser.parseFromString(content, "text/html");
		if(mime.toLowerCase().indexOf("charset")<0) {
			var metas = doc.getElementsByTagName("meta");
			for(var i=0; i<metas.length; i++) {
				if(metas.item(i).getAttribute("http-equiv").toLowerCase()=="content-type") {
					mime = metas.item(i).getAttribute("content");
					if(mime.toLowerCase().indexOf("charset") > 0) {
						watchUtils._downloadPage(url, mime, function(mime, content) {
							watchUtils._parsePage(url, mime, content, documentCallback);
						});
						return;
					}
				}
			}
		}
		documentCallback(doc);
	}

};