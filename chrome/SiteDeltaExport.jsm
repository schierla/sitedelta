"use strict";

var EXPORTED_SYMBOLS = ["SiteDeltaExport"];

Components.utils.import("resource://gre/modules/Services.jsm");
const Cc = Components.classes;
const Ci = Components.interfaces;

function getPresets(callback) {
	var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
	file.append("sitedelta");
	var presets = [];
	if (file.exists()) {
		var entries = file.directoryEntries;
		while (entries.hasMoreElements()) {
			var entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			if (/\.sitedelta-preset$/.test(entry.leafName))
				presets.push(_loadFile(entry.leafName));
		}
	}
	callback(presets);
}

function getPages(callback) {
	var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
	file.append("sitedelta");
	var ret = [];
	if (file.exists()) {
		var entries = file.directoryEntries;
		while (entries.hasMoreElements()) {
			var entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			if (/\.dat$/.test(entry.leafName)) {
				ret.push(_loadFile(entry.leafName));
			}
		}
	}
	callback(ret);
}

function getSettings(callback) {
	var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.sitedelta@schierla.de.");
	var ret = {};
	ret.openChanged = prefs.getBoolPref("openChanged");
	ret.scanImages = prefs.getBoolPref("scanImages");
	ret.checkDeleted = prefs.getBoolPref("checkDeleted");
	ret.ignoreCase = prefs.getBoolPref("ignoreCase");
	ret.ignoreNumbers = prefs.getBoolPref("ignoreNumbers");
	ret.showRegions = prefs.getBoolPref("showRegions");
	ret.addBorder = prefs.getCharPref("addBorder");
	ret.addBackground = prefs.getCharPref("addBackground");
	ret.moveBorder = prefs.getCharPref("moveBorder");
	ret.moveBackground = prefs.getCharPref("moveBackground");
	ret.removeBorder = prefs.getCharPref("removeBorder");
	ret.removeBackground = prefs.getCharPref("removeBackground");
	ret.includeRegion = prefs.getCharPref("includeRegion");
	ret.excludeRegion = prefs.getCharPref("excludeRegion");
	ret.backupPages = prefs.getBoolPref("backupPages");
	ret.scanOnLoad = prefs.getBoolPref("scanOnLoad");
	ret.highlightOnLoad = prefs.getBoolPref("highlightOnLoad");
	ret.notifySound = prefs.getCharPref("notifySound");
	ret.notifyAlert = prefs.getBoolPref("notifyAlert");
	ret.watchPageDelay = prefs.getIntPref("watchPageDelay");
	ret.watchScanDelay = prefs.getIntPref("watchScanDelay");
	ret.watchPageTimeout = prefs.getIntPref("watchPageTimeout");
	ret.enableWatch = prefs.getBoolPref("enableWatch");
	ret.watchEnableScript = prefs.getBoolPref("watchEnableScript");
	ret.siteSettings = prefs.getBoolPref("siteSettings");
	ret.autoMinDelay = prefs.getIntPref("autoMinDelay");
	ret.autoMaxDelay = prefs.getIntPref("autoMaxDelay");
	ret.autoDelayPercent = prefs.getIntPref("autoDelayPercent");
	callback(ret);
}

function configExport(callback) {
	getSettings(config => {
		config["watchDelay"] = config["watchScanDelay"];
		delete config["watchScanDelay"];
		callback(JSON.stringify(config, null, "  "));
	})
}

function pagesExport(callback) {
	getPages(pages => {
		for (var i = 0; i < pages.length; i++) {
			pages[i].content = pages[i].content.substr(1);
			_cleanPage(pages[i]);
		}
		callback(JSON.stringify(pages, null, "  "));
	});
}

function presetsExport(callback) {
	getPresets(pages => {
		for (var i = 0; i < pages.length; i++) {
			_cleanPage(pages[i]);
		}
		callback(JSON.stringify(pages, null, "  "));
	});
}

function _cleanPage(page) {
	page.title = page.name;
	delete page.name;
	for (var key in page) if (page[key] == null) delete page[key];
	if (page.watchDelay == 0) delete page.watchDelay;
	else if (page.watchDelay == -1) page.watchDelay = 0;
	if(page.user == "") delete page.user;
	if(page.pass == "") delete page.pass;
}

function _loadFile(fn) {
	var result = {
		_svc: this, url: fn, title: "", date: "", content: " \n",
		user: "", pass: "", checkDeleted: null, includes: [], excludes: [],
		scanImages: null, watchDelay: 0, backupPage: null, ignoreCase: null,
		ignoreNumbers: null, name: ""
	};
	var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
	file.append("sitedelta");
	file.append(fn);
	if (file.exists()) {
		var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
		fstream.init(file, -1, 0, 0);
		var bufferedstream = Cc["@mozilla.org/network/buffered-input-stream;1"].createInstance(Ci.nsIBufferedInputStream);
		bufferedstream.init(fstream, 4096);
		fstream = bufferedstream;
		var parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
		var dom = false;
		dom = parser.parseFromStream(fstream, "UTF-8", -1, "text/xml")
		var elem = dom.firstChild.firstChild;
		while (elem) {
			if (elem.firstChild || elem.nodeName == "settings") {
				if (elem.nodeName == "url") {
					result.url = elem.firstChild.data;
					if (elem.hasAttribute("user"))
						result.user = elem.attributes.getNamedItem("user").value;
				} else if (elem.nodeName == "include")
					result.includes.push(elem.firstChild.data);
				else if (elem.nodeName == "exclude")
					result.excludes.push(elem.firstChild.data);
				else if (elem.nodeName == "title")
					result.title = elem.firstChild.data;
				else if (elem.nodeName == "date")
					result.date = elem.firstChild.data;
				else if (elem.nodeName == "name")
					result.name = elem.firstChild.data;
				else if (elem.nodeName == "content")
					for (var n = elem.firstChild; n; n = n.nextSibling)
						result.content += n.data;
				else if (elem.nodeName == "settings") {
					if (elem.hasAttribute("checkDeleted"))
						result.checkDeleted = elem.attributes.getNamedItem("checkDeleted").value == "true";
					if (elem.hasAttribute("scanImages"))
						result.scanImages = elem.attributes.getNamedItem("scanImages").value == "true";
					if (elem.hasAttribute("watchEnableScript"))
						result.backupPage = elem.attributes.getNamedItem("watchEnableScript").value == "true";
					if (elem.hasAttribute("backupPage"))
						result.backupPage = elem.attributes.getNamedItem("backupPage").value == "true";
					if (elem.hasAttribute("watchDelay"))
						result.watchDelay = elem.attributes.getNamedItem("watchDelay").value;
					if (elem.hasAttribute("enableWatch")) {
						if (elem.attributes.getNamedItem("enableWatch").value == "true")
							result.watchDelay = 0;
						else result.watchDelay = - 1;
					}
					if (elem.hasAttribute("ignoreCase"))
						result.ignoreCase = elem.attributes.getNamedItem("ignoreCase").value == "true";
					if (elem.hasAttribute("ignoreNumbers"))
						result.ignoreNumbers = elem.attributes.getNamedItem("ignoreNumbers").value == "true";
				}
			}
			elem = elem.nextSibling;
		}
		fstream.close();
	}
	if (result.includes.length == 0)
		result.includes.push("/html/body[1]");
	result.content = result.content.replace(/\s+/g, " ");
	return result;
}

var SiteDeltaExport = {
	getSettings, getPages, getPresets, pagesExport, configExport, presetsExport
};