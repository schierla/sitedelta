
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
			tabUtils.openResource("show.htm?" + options[i].value);
		}
	}
}


function markSeenSelected() {
	var options = document.querySelector("#pages").options;
	for (var i = 0; i < options.length; i++) {
		if (options[i].selected) {
			options[i].selected = false;
			markSeen(options[i].value, markSeenSelected);
			return;
		}
	}
}

function markSeen(url, callback) {
	pageUtils.getEffectiveConfig(url, function (config) {
		if (config === null) return (callback !== undefined) ? callback() : null;
		watchUtils.loadPage(url, function (doc) {
			if (doc === null) return pageUtils.setChanges(url, -1, callback);
			var newContent = textUtils.getText(doc, config);
			pageUtils.setContent(url, newContent, () => {
				pageUtils.setChanges(url, 0, callback);
			});
		});
	});
}

function scanNowSelected() {
	var options = document.querySelector("#pages").options;
	for (var i = 0; i < options.length; i++) {
		if (options[i].selected) {
			options[i].selected = false;
			scanNow(options[i].value, scanNowSelected);
			return;
		}
	}
}

function scanNow(url, callback) {
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
				pageNodes[url].appendChild(document.createTextNode(title));
				pages.appendChild(pageNodes[url]);
			}
			pageNodes[url].firstChild.data = index[url]["title"];
			pageNodes[url].classList.remove("changed");
			pageNodes[url].classList.remove("unchanged");
			pageNodes[url].classList.remove("failed");
			pageNodes[url].classList.remove("scanning");
			var changes = index[url].changes;
			var nextScan = index[url].nextScan;
			if (changes > 0) {
				pageNodes[url].classList.add("changed");
				pageNodes[url].setAttribute("title", url);
			} else if (index[url]["changes"] == 0) {
				pageNodes[url].classList.add("unchanged");
				pageNodes[url].setAttribute("title", url + "\n" + chrome.i18n.getMessage("watchNextScan", new Date(nextScan).toLocaleString()));
			} else if (index[url]["changes"] == -1) {
				pageNodes[url].classList.add("failed");
				pageNodes[url].setAttribute("title", url + "\n" + chrome.i18n.getMessage("watchNextScan", new Date(nextScan).toLocaleString()));
			}
		}
	});
}

document.querySelector("#scannow").addEventListener("click", scanNowSelected);
document.querySelector("#markseen").addEventListener("click", markSeenSelected);
document.querySelector("#delete").addEventListener("click", deleteSelected);
document.querySelector("#open").addEventListener("click", openSelected);

document.querySelector("#pages").addEventListener("dblclick", openSelected);

showPages();