var pageList = {

	deletePage: function (key, data, callback) {
		ioUtils.remove(key, callback);
	},

	openPage: function (key, data, callback) {
		tabUtils.openResource("show.htm?" + key); 
		setTimeout(callback, 500);
	},

	previewPage: function(list) {
		var preview = document.querySelector("#preview"); 
		if(!preview || window.getComputedStyle(preview).display == "none") return;
		var options = document.querySelector("#pages").options;
		var selectCount = 0, selected = ""; for (var i = 0; i < options.length; i++) if (options[i].selected) { selectCount++; selected = options[i].value; }
		if(selectCount == 1 && preview.src != chrome.runtime.getURL("show.htm?" + selected)) {
			preview.src = chrome.runtime.getURL("show.htm?" + selected);
		} else if(selectCount == 0) {
			preview.src = "about:blank";
		}
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
		list.isBefore = (keya, a, keyb, b) => a.title!==undefined && b.title!==undefined && a.title.toLowerCase() < b.title.toLowerCase();
		document.querySelector("#delete").addEventListener("click", () => list.foreachSelected(this.deletePage));
		document.querySelector("#open").addEventListener("click", () => { pageList.selectChangedIfNone(); list.foreachSelected(this.openPage) });
		document.querySelector("#scannow").addEventListener("click", () => { pageList.selectAllIfNone(); list.foreachSelected(this.scanPage) });
		document.querySelector("#markseen").addEventListener("click", () => { pageList.selectAllIfNone(); list.foreachSelected(this.markSeen) });
		document.querySelector("#pages").addEventListener("dblclick", () => list.foreachSelected(this.openPage));
		document.querySelector("#pages").addEventListener("change", () => this.previewPage(list));
		document.querySelector("#watchdelay").addEventListener("click", () => configUtils.getDefaultConfig(config => {
			var delay = prompt(chrome.i18n.getMessage("configWatchDelay"), config.watchDelay);
			if(delay !== null) list.foreachSelected((key,data,callback) => pageUtils.setConfigProperty(key, "watchDelay", parseInt(delay), () => this.scanPage(key, data, callback)));
		}));
		ioUtils.observeIndex(index => list.updateAll(index));
	}
};

pageList.load();