
var pageList = {

	deletePage: function (key, data, callback) {
		ioUtils.remove(key, callback);
	},

	openPage: function (key, data, callback) {
		chrome.tabs.create({ url: key }); 
		setTimeout(callback, 500);
	},

	scanPage: function (key, data, callback, tabId) {
		tabUtils.loadInTab(tabId, key, (url) => {
			tabUtils.checkChanges(tabId, url, (changes) => {
				if (changes == 0) { // unchanged
					callback();
				} else if (changes > 0) {
					configUtils.getDefaultConfig(config => {
						if (config.scanOnLoad) return;
						tabUtils.showIcon(tabId, "*", 1);
						pageUtils.setChanges(url, 1);
					});
				}
			});
		});
	},

	selectAllIfNone: function() {
		var options = document.querySelector("#pages").options;
		for(var i = 0; i < options.length; i++)
			if(options[i].selected) return;
		for(var i = 0; i < options.length; i++)
			options[i].selected = true;
	},

	selectChangedIfNone: function () {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++)
			if (options[i].selected) return;
		for (var i = 0; i < options.length; i++)
			if(options[i].classList.contains("changed")) 
				options[i].selected = true;
	},

	createItem: function (key, data) {
		var title = "title" in data ? data.title : key;
		if (!("title" in data)) pageUtils.getTitle(key);
		var ret = document.createElement("option");
		ret.setAttribute("value", key);
		ret.setAttribute("title", key);
		ret.appendChild(document.createTextNode(title));
		return ret;
	},

	updateItem: function (element, data) {
		element.firstChild.data = data["title"];
		element.classList.remove("changed", "unchanged", "failed", "scanning");
		if (data.changes === undefined) {
		} else if (data.changes > 0) {
			element.classList.add("changed");
		} else if (data.changes == 0) {
			element.classList.add("unchanged");
		} else if (data.changes == -1) {
			element.classList.add("failed");
		}
	},

	load: function () {
		var list = uiUtils.sortedList("pages", this.createItem, this.updateItem);
		list.isBefore = (keya, a, keyb, b) => a.title!==undefined && b.title!==undefined && a.title.toLowerCase() < b.title.toLowerCase();
		document.querySelector("#delete").addEventListener("click", () => list.foreachSelected(this.deletePage));
		document.querySelector("#open").addEventListener("click", () => { pageList.selectChangedIfNone(); list.foreachSelected(this.openPage) });
		document.querySelector("#scannow").addEventListener("click",
			() => chrome.tabs.create({ url: "about:blank" }, tab => {
				pageList.selectAllIfNone();
				list.foreachSelected(
					(key, data, callback) => this.scanPage(key, data, callback, tab.id),
					() => { chrome.tabs.remove(tab.id) }
				)
			}));
		document.querySelector("#pages").addEventListener("dblclick", () => list.foreachSelected(this.openPage));
		ioUtils.observeIndex(index => list.updateAll(index));
	}
}

pageList.load();