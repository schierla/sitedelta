
var pageNodes = {};

function deleteSelected() {
	var options = document.querySelector("#pages").options;
	for (var i = 0; i < options.length; i++) {
		if (options[i].selected) {
			options[i].selected = false;
			ioUtils.remove(options[i].value, deleteSelected);
			return;
		}
	}
}

function openSelected() {
	var options = document.querySelector("#pages").options;
	for (var i = 0; i < options.length; i++) {
		if (options[i].selected) {
			options[i].selected = false;
			chrome.tabs.create({ url: options[i].value });
		}
	}
}

function scanNowSelected() {
	chrome.tabs.create({ url: "about:blank" }, tab => {
		scanNowNext(tab.id);
	});
}

function scanNowNext(tabId) {
	var options = document.querySelector("#pages").options;
	for (var i = 0; i < options.length; i++) {
		if (options[i].selected) {
			options[i].selected = false;
			tabUtils.loadInTab(tabId, options[i].value, (url) => {
				console.log("loaded " + url);
				pageUtils.getEffectiveConfig(url, function (config) {
					if (config !== null) {
						pageUtils.getContent(url, function (oldcontent) {
							if (oldcontent !== null) {
								tabUtils.getContent(tabId, url, function (content) {
									if (textUtils.clean(content, config) == textUtils.clean(oldcontent, config)) {
										// unchanged
										scanNowNext(tabId);
									} else {
										if(!config.scanOnLoad) {
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
}

function showPages() {
	ioUtils.observeIndex(function (index) {
		var pages = document.querySelector("#pages");
		for (var url in pageNodes) {
			if (url in index) continue;
			pages.removeChild(pageNodes[url]);
			delete pageNodes[url];
		}
		for (var url in index) {
			if (url === null) continue;

			var title = "title" in index[url] ? index[url].title : url;
			if (!(url in pageNodes)) {
				if (!("title" in index[url])) pageUtils.getTitle(url);
				pageNodes[url] = document.createElement("option");
				pageNodes[url].setAttribute("value", url);
				pageNodes[url].setAttribute("title", url);
				pageNodes[url].appendChild(document.createTextNode(title));
				pages.appendChild(pageNodes[url]);
			}
			pageNodes[url].firstChild.data = index[url]["title"];
			pageNodes[url].classList.remove("changed");
			pageNodes[url].classList.remove("unchanged");
			pageNodes[url].classList.remove("failed");
			pageNodes[url].classList.remove("scanning");
			var changes = index[url].changes;
			if (changes > 0) {
				pageNodes[url].classList.add("changed");
			} else if (index[url]["changes"] == 0) {
				pageNodes[url].classList.add("unchanged");
			} else if (index[url]["changes"] == -1) {
				pageNodes[url].classList.add("failed");
			}
		}
	});
}

document.querySelector("#delete").addEventListener("click", deleteSelected);
document.querySelector("#open").addEventListener("click", openSelected);
document.querySelector("#scannow").addEventListener("click", scanNowSelected);
document.querySelector("#pages").addEventListener("dblclick", openSelected);

if (!chrome.webNavigation) document.querySelector("#scannow").style.display = "none";

showPages();