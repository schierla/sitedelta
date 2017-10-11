var pageList = {
	pageNodes: {},

	deleteSelected: function () {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].selected) {
				options[i].selected = false;
				ioUtils.remove(options[i].value, pageList.deleteSelected);
				return;
			}
		}
	},

	openSelected: function () {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].selected) {
				options[i].selected = false;
				tabUtils.openResource("show.htm?" + options[i].value);
			}
		}
	},


	markSeenSelected: function () {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].selected) {
				options[i].selected = false;
				markSeen(options[i].value, pageList.markSeenSelected);
				return;
			}
		}
	},

	markSeen: function (url, callback) {
		pageUtils.getEffectiveConfig(url, function (config) {
			if (config === null) return (callback !== undefined) ? callback() : null;
			watchUtils.loadPage(url, function (doc) {
				if (doc === null) return pageUtils.setChanges(url, -1, callback);
				var newContent = textUtils.getText(doc, config);
				pageUtils.setContent(url, newContent, () => {
					watchUtils.setChanges(url, 0, callback);
				});
			});
		});
	},

	scanNowSelected: function () {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].selected) {
				options[i].selected = false;
				pageList.scanNow(options[i].value, pageList.scanNowSelected);
				return;
			}
		}
	},

	scanNow: function (url, callback) {
		pageUtils.getEffectiveConfig(url, function (config) {
			if (config === null) return;
			watchUtils.loadPage(url, function (doc) {
				if (doc === null) return pageUtils.setChanges(url, -1, callback);
				var newContent = textUtils.getText(doc, config);
				pageUtils.getContent(url, function (oldContent) {
					if (textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
						watchUtils.setChanges(url, 1, callback);
					} else {
						watchUtils.setChanges(url, 0, callback);
					}
				});
			});
		});
	},

	showPages: function () {
		ioUtils.observeIndex(function (index) {
			var pages = document.querySelector("#pages");
			for (var url in pageList.pageNodes) {
				if (url in index) continue;
				pages.removeChild(pageList.pageNodes[url]);
				delete pageList.pageNodes[url];
			}
			for (var url in index) {
				if (url === null) continue;

				var title = "title" in index[url] ? index[url].title : url;
				if (!(url in pageList.pageNodes)) {
					if (!("title" in index[url])) pageUtils.getTitle(url);
					pageList.pageNodes[url] = document.createElement("option");
					pageList.pageNodes[url].setAttribute("value", url);
					pageList.pageNodes[url].appendChild(document.createTextNode(title));
					pages.appendChild(pageList.pageNodes[url]);
				}
				pageList.pageNodes[url].firstChild.data = index[url]["title"];
				pageList.pageNodes[url].classList.remove("changed");
				pageList.pageNodes[url].classList.remove("unchanged");
				pageList.pageNodes[url].classList.remove("failed");
				pageList.pageNodes[url].classList.remove("scanning");
				var changes = index[url].changes;
				var nextScan = index[url].nextScan;
				if (changes > 0) {
					pageList.pageNodes[url].classList.add("changed");
					pageList.pageNodes[url].setAttribute("title", url);
				} else if (index[url]["changes"] == 0) {
					pageList.pageNodes[url].classList.add("unchanged");
					pageList.pageNodes[url].setAttribute("title", url + (nextScan == 0 ? "" : "\n" + chrome.i18n.getMessage("watchNextScan", new Date(nextScan).toLocaleString())));
				} else if (index[url]["changes"] == -1) {
					pageList.pageNodes[url].classList.add("failed");
					pageList.pageNodes[url].setAttribute("title", url + (nextScan == 0 ? "" : "\n" + chrome.i18n.getMessage("watchNextScan", new Date(nextScan).toLocaleString())));
				}
			}
		});
	},

	load: function () {
		document.querySelector("#scannow").addEventListener("click", pageList.scanNowSelected);
		document.querySelector("#markseen").addEventListener("click", pageList.markSeenSelected);
		document.querySelector("#delete").addEventListener("click", pageList.deleteSelected);
		document.querySelector("#open").addEventListener("click", pageList.openSelected);
		document.querySelector("#pages").addEventListener("dblclick", pageList.openSelected);

		pageList.showPages();
	}
}

pageList.load();