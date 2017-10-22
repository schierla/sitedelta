var pageList = {

	deletePage: function (key, data, callback) {
		ioUtils.remove(key, callback);
	},

	openPage: function (key, data, callback) {
		tabUtils.openResource("show.htm?" + key); callback();
	},

	scanPage: function (key, data, callback) {
		watchUtils.scanPage(key, callback);
	},

	markSeen: function (key, data, callback) {
		watchUtils.markSeen(key, callback);
	},

	selectAllIfNone: function () {
		var options = document.querySelector("#pages").options;
		for (var i = 0; i < options.length; i++)
			if (options[i].selected) return;
		for (var i = 0; i < options.length; i++)
			options[i].selected = true;
	},

	createItem: function (key, data) {
		var title = "title" in data ? data.title : key;
		if (!("title" in data)) pageUtils.getTitle(key);
		var ret = document.createElement("option");
		ret.setAttribute("value", key);
		ret.appendChild(document.createTextNode(title));
		return ret;
	},


	updateItem: function (element, data) {
		element.firstChild.data = data["title"];
		element.classList.remove("changed", "unchanged", "failed", "scanning");
		var title = element.getAttribute("value");
		if (data.nextScan != 0)
			title += "\n" + chrome.i18n.getMessage("watchNextScan", new Date(data.nextScan).toLocaleString());
		element.setAttribute("title", title);

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
		list.isBefore = (keya, a, keyb, b) => a.title && b.title && a.title.toLowerCase() < b.title.toLowerCase();
		document.querySelector("#delete").addEventListener("click", () => list.foreachSelected(this.deletePage));
		document.querySelector("#open").addEventListener("click", () => list.foreachSelected(this.openPage));
		document.querySelector("#scannow").addEventListener("click", () => { pageList.selectAllIfNone(); list.foreachSelected(this.scanPage) });
		document.querySelector("#markseen").addEventListener("click", () => { pageList.selectAllIfNone(); list.foreachSelected(this.markSeen) });
		document.querySelector("#pages").addEventListener("dblclick", () => list.foreachSelected(this.openPage));
		ioUtils.observeIndex(index => list.updateAll(index));
	}
};

pageList.load();