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
		pageList.disableIfEmpty();
	},

	openSelected: function () {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].selected) {
				options[i].selected = false;
				chrome.tabs.create({ url: options[i].value });
			}
		}
		pageList.disableIfEmpty();
	},

	scanNowSelected: function () {
		if (!chrome.webNavigation) return;
		chrome.tabs.create({ url: "about:blank" }, tab => {
			pageList.scanNowNext(tab.id);
		});
	},

	scanNowNext: function (tabId) {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].selected) {
				options[i].selected = false;
				tabUtils.loadInTab(tabId, options[i].value, (url) => {
					pageUtils.getEffectiveConfig(url, function (config) {
						if (config !== null) {
							pageUtils.getContent(url, function (oldcontent) {
								if (oldcontent !== null) {
									tabUtils.getContent(tabId, url, function (content) {
										if (textUtils.clean(content, config) == textUtils.clean(oldcontent, config)) {
											// unchanged
											pageList.scanNowNext(tabId);
										} else {
											if (!config.scanOnLoad) {
												tabUtils.showIcon(tabId, "*", 1);
												pageUtils.setChanges(url, 1);
											}
										}
									});
								}
							});
						}
					});
				});
				return;
			}
		}
		chrome.tabs.remove(tabId);
		pageList.disableIfEmpty();
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
					pageList.pageNodes[url].setAttribute("title", url);
					pageList.pageNodes[url].appendChild(document.createTextNode(title));
					pages.appendChild(pageList.pageNodes[url]);
				}
				pageList.pageNodes[url].firstChild.data = index[url]["title"];
				pageList.pageNodes[url].classList.remove("changed");
				pageList.pageNodes[url].classList.remove("unchanged");
				pageList.pageNodes[url].classList.remove("failed");
				pageList.pageNodes[url].classList.remove("scanning");
				var changes = index[url].changes;
				if (changes > 0) {
					pageList.pageNodes[url].classList.add("changed");
				} else if (index[url]["changes"] == 0) {
					pageList.pageNodes[url].classList.add("unchanged");
				} else if (index[url]["changes"] == -1) {
					pageList.pageNodes[url].classList.add("failed");
				}
			}
		});
	},

	disableIfEmpty: function () {
		var any = false, buttons = ["delete", "open", "scannow"];
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].selected) any = true;
		}
		for (var i = 0; i < buttons.length; i++) {
			if (any) document.querySelector("#" + buttons[i]).removeAttribute("disabled");
			else document.querySelector("#" + buttons[i]).setAttribute("disabled", "disabled"); 
		}
	},

	load: function () {
		document.querySelector("#delete").addEventListener("click", pageList.deleteSelected);
		document.querySelector("#open").addEventListener("click", pageList.openSelected);
		document.querySelector("#scannow").addEventListener("click", pageList.scanNowSelected);
		document.querySelector("#pages").addEventListener("dblclick", pageList.openSelected);
		document.querySelector("#pages").addEventListener("change", pageList.disableIfEmpty);
		pageList.disableIfEmpty();
		pageList.showPages();
	}
}

pageList.load();