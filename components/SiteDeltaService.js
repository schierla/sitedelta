const CLASS_ID = Components.ID("{df5f1305-f0f5-415c-b71e-118e779e0590}");
const CLASS_NAME = "SiteDelta XPCOM Component";
const CONTRACT_ID = "@sitedelta.schierla.de/sitedelta;1";
const Cc = Components.classes;
const Ci = Components.interfaces;
const SD_RDF = "http://sitedelta.schierla.de/SD-rdf#";
const NS_RDF = "http://home.netscape.com/NC-rdf#";

function SiteDelta() {
    this._load();
};
SiteDelta.prototype = {
    wrappedJSObject: this,
//    _spaceRegex: /[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u01ba\u01bc-\u01bf\u01c4-\u0241\u0250-\u02af\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03ce\u03d0-\u03f5\u03f7-\u0481\u048a-\u04ce\u04d0-\u04f9\u0500-\u050f\u0531-\u0556\u0561-\u0587\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\u09e6-\u09ef\u0a66-\u0a6f\u0ae6-\u0aef\u0b66-\u0b6f\u0be6-\u0bef\u0c66-\u0c6f\u0ce6-\u0cef\u0d66-\u0d6f\u0e50-\u0e59\u0ed0-\u0ed9\u0f20-\u0f29\u1040-\u1049\u10a0-\u10c5\u17e0-\u17e9\u1810-\u1819\u1946-\u194f\u19d0-\u19d9\u1d00-\u1d2b\u1d62-\u1d77\u1d79-\u1d9a\u1e00-\u1e9b\u1ea0-\u1ef9\u1f00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2131\u2133\u2134\u2139\u213c-\u213f\u2145-\u2149\u2c00-\u2c2e\u2c30-\u2c5e\u2c80-\u2ce4\u2d00-\u2d25\ufb00-\ufb06\ufb13-\ufb17\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]+| +|[^ \[[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u01ba\u01bc-\u01bf\u01c4-\u0241\u0250-\u02af\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03ce\u03d0-\u03f5\u03f7-\u0481\u048a-\u04ce\u04d0-\u04f9\u0500-\u050f\u0531-\u0556\u0561-\u0587\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\u09e6-\u09ef\u0a66-\u0a6f\u0ae6-\u0aef\u0b66-\u0b6f\u0be6-\u0bef\u0c66-\u0c6f\u0ce6-\u0cef\u0d66-\u0d6f\u0e50-\u0e59\u0ed0-\u0ed9\u0f20-\u0f29\u1040-\u1049\u10a0-\u10c5\u17e0-\u17e9\u1810-\u1819\u1946-\u194f\u19d0-\u19d9\u1d00-\u1d2b\u1d62-\u1d77\u1d79-\u1d9a\u1e00-\u1e9b\u1ea0-\u1ef9\u1f00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2131\u2133\u2134\u2139\u213c-\u213f\u2145-\u2149\u2c00-\u2c2e\u2c30-\u2c5e\u2c80-\u2ce4\u2d00-\u2d25\ufb00-\ufb06\ufb13-\ufb17\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]+|\[ |\[[^ ]+?\]/g,
    _spaceRegex: /[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+| +|[^ \[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+|\[ |\[[^ ]+?\]/g,
    _observerService: null,
    _parseHandler: null,
    _iframe: null,
    _timer: null,
    _loadtimer: null,
    _prefs: null,
    _prefManager: null,
    _dir: null,
    _excludes: [],
    _presetNames: null,
    _presets: {},
    _watchUrl: null,
    scanImages: null,
    checkDeleted: null,
    _scanImages: null,
    _checkDeleted: null,
    showRegions: null,
    openChanged: null,
    ignoreNumbers: null,
    _ignoreNumbers: null,
    ignoreCase: null,
    _ignoreCase: null,
    addBorder: null,
    addBackground: null,
    moveBorder: null,
    moveBackground: null,
    removeBorder: null,
    removeBackground: null,
    excludeRegion: null,
    includeRegion: null,
    backupPages: null,
    scanOnLoad: null,
    highlightOnLoad: null,
    siteSettings: null,
    enableWatch: false,
    watchEnableScript: false,
    watchPageDelay: null,
    watchScanDelay: null,
    watchPageTimeout: null,
    notifySound: null,
    notifyAlert: null,
    autoMinDelay: null,
    autoMaxDelay: null,
    autoDelayPercent: null,
    RDF: null,
    rdfService: null,
    _strings: null,
    RESULT_UNCHANGED: 0,
    RESULT_NEW: -1,
    RESULT_ERROR: -2,
    RESULT_CHECKING: -3,
    RESULT_UNCHECKED: -4,
    
    // nsIDOMNodeFilter method
    acceptNode: function(cur) {
        for (var i = 0; i < this._excludes.length; i ++ )
            if (this._excludes[i] == cur)
            return Ci.nsIDOMNodeFilter.FILTER_REJECT;
        if (cur.nodeName == 'SCRIPT' || cur.nodeName == 'NOSCRIPT' || cur.nodeName == 'STYLE')
            return Ci.nsIDOMNodeFilter.FILTER_REJECT;
        if (cur.nodeType == 3 || (this._scanImages && cur.nodeName == 'IMG' && cur.getAttribute("src").indexOf("chrome:") != 0))
            return Ci.nsIDOMNodeFilter.FILTER_ACCEPT;
        return Ci.nsIDOMNodeFilter.FILTER_SKIP;
    },
    
    // nsIObserver methods
    addObserver: function(object) {
        this._observerService.addObserver(object, "sitedelta", false);
    },
    removeObserver: function(object) {
        this._observerService.removeObserver(object, "sitedelta");
    },
    observe: function(aSubject, aTopic, aData) {
        if (aTopic == "app-startup") {} else if (aTopic == "nsPref:changed") {
            this._loadPrefs();
        } else if (aTopic == "xpcom-shutdown") {
            this._unload();
        } else if(aTopic == "alertclickcallback") {
			var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
			var wnd = wm.getMostRecentWindow("navigator:browser"); 
			if(wnd) wnd.getBrowser().selectedTab=wnd.getBrowser().addTab(aData); else window.open(aData);  
        }
    },
    notify: function() {
        this._timer.cancel();
        if (this._watchUrl != null) this._watchEndCheck();
        else if(this.enableWatch) this._watchScanNext();
    },
    
    // public methods
    
    // managing presets
    deletePreset: function(fn) {
        delete(this._presets[fn]);
        if (this._presetNames)
            this._presetNames.splice(this._presetNames.indexOf(fn), 1);
        var file = this._sitedeltaDir();
        file.append(fn);
        file.remove(false);
    },
    listPresets: function() {
        if (this._presetNames)
            return this._presetNames;
        var file = this._sitedeltaDir();
        var entries = file.directoryEntries;
        var presets = [];
        while (entries.hasMoreElements()) {
            var entry = entries.getNext();
            entry.QueryInterface(Ci.nsIFile);
            if (/\.sitedelta-preset$/.test(entry.leafName))
                presets.push(entry.leafName);
        }
        this._presetNames = presets;
        return presets;
    },
    getPreset: function(fn) {
        if (this._presets[fn])
            return this._presets[fn];
        this._presets[fn] = this._loadFile(fn);
        return this._presets[fn];
    },
    putPreset: function(p, fn) {
        delete(this._presets[fn]);
        this._saveFile(fn, p);
    },
    newPreset: function(p) {
        var nr = 0;
        var names = this.listPresets();
        while (true) {
            if (names.indexOf(nr + ".sitedelta-preset") ==- 1)
                break;
            nr ++ ;
        }
        this._presetNames.push(nr + ".sitedelta-preset");
        this.putPreset(p, nr + ".sitedelta-preset");
        return nr + ".sitedelta-preset";
    },
    isPresetPreferred: function(preset, url) {
        return new RegExp("^" + preset.url.replace(/([\{\\\^\$\.\|\?\*\+\(\)])/g, "\\$&").replace(/\\\*/g, ".*").replace(/\\\?/g, ".") + "$").test(url);
    },
    
    // managing pages
    deletePage: function(url) {
        url = url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
        var result=this.getPage(url);
        var file = this._sitedeltaDir();
        file.append(this._getFilename(url) + ".dat");
        this._rdfDel(result);
        if (file.exists()) {
            file.remove(false);
        }
        this._observerService.notifyObservers(null, "sitedelta", url);
    },
    getPage: function(url) {
        url = url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
        var ret = this._loadFile(this._getFilename(url) + ".dat");
        
        if (ret.status ==- 1) {
            ret.url = url;
            var presets = this.listPresets();
            for (var i = 0; i < presets.length; i ++ ) {
                var preset = this.getPreset(presets[i]);
                if (this.isPresetPreferred(preset, url)) {
                    ret.includes = preset.includes;
                    ret.excludes = preset.excludes;
                    ret.scanImages = preset.scanImages;
                    ret.checkDeleted = preset.checkDeleted;
                    ret.ignoreCase = preset.ignoreCase;
                    ret.ignoreNumbers = preset.ignoreNumbers;
                    break;
                }
            }
        }
        return ret;
    },
    putPage: function(page) {
    	if(page.url.search(/^about:/)!=-1) return;
        this._saveFile(this._getFilename(page.url) + ".dat", page);
        this._rdfAdd(page);
        this._observerService.notifyObservers(null, "sitedelta", page.url);
    },
    scanPage: function(doc) {
        var url = doc.URL,
        changes = this.RESULT_UNCHANGED;
        url = url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
        if(url.search(/^about:/)!=-1) return 0;
        var result = this.getPage(doc.URL);
        if (result.scanImages != null)
            this._scanImages = result.scanImages;
        else this._scanImages = this.scanImages;
        if (result.ignoreCase != null)
            this._ignoreCase = result.ignoreCase;
        else this._ignoreCase = this.ignoreCase;
        if (result.ignoreNumbers != null)
            this._ignoreNumbers = result.ignoreNumbers;
        else this._ignoreNumbers = this.ignoreNumbers;

        this._scheduleNextScan(result);
        
        this._excludes = [];
        for (var i = 0; i < result.excludes.length; i ++ ) {
            this._excludes.push(doc.evaluate(result.excludes[i], doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext());
        }
        var regions = [];
        for (var i = 0; i < result.includes.length; i ++ ) {
            var xpath = result.includes[i];
            var startElement = doc.evaluate(xpath, doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext();
            if ( ! startElement) {
                result.status=1;
                this._observerService.notifyObservers(null, "sitedelta", result.url);
                return 1;
            }
            regions.push(startElement);
        }
        var pos = 0,
        text = "";
        for (var i = 0; i < regions.length; i ++ ) {
            text += this._getText(regions[i]);
        }
        
        if (result.date == "") {
        	result.current = text;
        	result.url = url.replace(/#.*$/, '');
        	result.title = doc.title.replace(/[\n\r]/g, ' ');
        	if (result.name == "") result.name = result.title;
        	var date = new Date();
        	result.date = date.toLocaleString();
        	result.content = text;
        	this.putPage(result);
        	var result = this.getPage(doc.URL);
        	result.status = 0;
            return 0;
        }
        
        if (this._clean(text) != this._clean(result.content.substr(1)))
            changes = 1;
        result.status=changes;
        return changes;
    },
    listBackups: function(url) {
        url = url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
        var fph = Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler);
        var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("Home", Ci.nsIFile);
        file.append("SiteDelta");
        file.append(this._getFilename(url));
        if ( ! file.exists())
            return[];
        var entries = file.directoryEntries;
        var backups = [];
        while (entries.hasMoreElements()) {
            var entry = entries.getNext();
            entry.QueryInterface(Ci.nsIFile);
            if (/\.htm$/.test(entry.leafName))
                backups.push( {
                name: entry.leafName.replace(/\.htm$/, ""),
                url: fph.getURLSpecFromFile(entry)
                });
        }
        return backups;
    },
    backupPage: function(doc) {
        var url = doc.URL;
        var date = new Date();
        url = url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
        var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("Home", Ci.nsIFile);
        file.append("SiteDelta");
        if ( ! file.exists())
            file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
        file.append(this._getFilename(url));
        if ( ! file.exists())
            file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
        date = date.getFullYear() + "-" + ("00" + (date.getMonth() + 1)).substr( - 2) + "-" + ("00" + date.getDate()).substr( - 2) + " " + ("00" + date.getHours()).substr( - 2) + "-" + ("00" + date.getMinutes()).substr( - 2) + "-" + ("00" + date.getSeconds()).substr( - 2);
        var dir = file.clone();
        dir.append(date);
        dir.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
        file.append(date + ".htm");
        var wbp = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Ci.nsIWebBrowserPersist);
        wbp.saveDocument(doc, file, dir, null, null, null);
    },
    buildXPath: function(t, allowId) {
        var path = "";
        if(allowId && t.id != "" && t.id.indexOf('sitedelta')==-1) return 'id("' + t.id + '")';
        while (t.nodeName != "HTML") {
            c = t.parentNode.firstChild;
            num = 1;
            while (c != t) {
                if (c.nodeName == t.nodeName)
                    num ++ ;
                c = c.nextSibling;
            }
            path = "/" + t.nodeName.toLowerCase() + "[" + num + "]" + path;
            t = t.parentNode;
            if(allowId && t.id != "" && t.id.indexOf('sitedelta')==-1) return 'id("' + t.id + '")' + path;
        }
        path = "/" + t.nodeName.toLowerCase() + path;
        return path;
    },
    highlightPageOld: function(doc) {
        var url = doc.URL,
        changes = this.RESULT_UNCHANGED;
        url = url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
        var result = this.getPage(doc.URL);
        var text = "";

        this._excludes = [];
        for (var i = 0; i < result.excludes.length; i++) {
            this._excludes.push(doc.evaluate(result.excludes[i], doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext());
            if (this._excludes[i] && this.showRegions) this._excludes[i].style.MozOutline = this.excludeRegion + " dotted 2px";
        }
        var regions = [];
        for (var i = 0; i < result.includes.length; i++) {
            var xpath = result.includes[i];
            var startElement = doc.evaluate(xpath, doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext();
            if (!startElement) return this.RESULT_NOTFOUND;
            if (this.showRegions) startElement.style.MozOutline = this.includeRegion + " dotted 2px";
            regions.push(startElement);
        }
        var pos = 0;
        for (var i = 0; i < regions.length; i++) {
            var r = this._walkTree(regions[i], false, null, pos);
            text += r.text;
            pos = r.pos;
        }
        if (result.date == "") {
            changes = this.RESULT_NEW;
            this._observerService.notifyObservers(null, "sitedelta", result.url);
        } else {
            var current = text;
            pos = 0;
            for (var i = 0; i < regions.length; i++) {
                var r = this._walkTree(regions[i], true, current, pos);
                current = r.current;
                changes += r.changes;
                pos = r.pos;
            }
        }
        result.url = url.replace(/#.*$/, '');
        result.title = doc.title.replace(/[\n\r]/g, ' ');
        if (result.name == "") result.name = result.title;
        var date = new Date();
        result.date = date.toLocaleString();
        result.content = text;
        this.putPage(result);
        var result = this.getPage(doc.URL);
        result.status = 0;
        if (changes > 0 && (result.backupPage == true || (result.backupPage == null && this.backupPages))) this.backupPage(doc);
        return changes;
    },
    highlightPage: function(doc) {
        var url = doc.URL,
        changes = this.RESULT_UNCHANGED;
        url = url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
        var result = this.getPage(doc.URL);
        if (result.scanImages != null)
            this._scanImages = result.scanImages;
        else this._scanImages = this.scanImages;
        if (result.checkDeleted != null)
            this._checkDeleted = result.checkDeleted;
        else this._checkDeleted = this.checkDeleted;
        if (result.ignoreCase != null)
            this._ignoreCase = result.ignoreCase;
        else this._ignoreCase = this.ignoreCase;
        if (result.ignoreNumbers != null)
            this._ignoreNumbers = result.ignoreNumbers;
        else this._ignoreNumbers = this.ignoreNumbers;
        
        var text = "";
        
        this._excludes = [];
        for (var i = 0; i < result.excludes.length; i ++ ) {
            this._excludes.push(doc.evaluate(result.excludes[i], doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext());
            if (this._excludes[i] && this.showRegions)
                this._excludes[i].style.outline = this.excludeRegion + " dotted 2px";
        }
        var regions = [];
        for (var i = 0; i < result.includes.length; i ++ ) {
            var xpath = result.includes[i];
            var startElement = doc.evaluate(xpath, doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext();
            if ( ! startElement)
                return this.RESULT_ERROR;
            if (this.showRegions)
                startElement.style.outline = this.includeRegion + " dotted 2px";
            regions.push(startElement);
        }
        for (var i = 0; i < regions.length; i ++ ) {
            text += this._getText(regions[i])
        }
        current = text;
        if (result.date == "") {
            changes = this.RESULT_NEW;
            this._observerService.notifyObservers(null, "sitedelta", result.url);
        } else {
            var oldt = this._split(this._clean(result.content.substring(1))),
            newt = this._split(this._clean(text)),
            old2 = this._split(result.content.substring(1));
            var diff = {
                oldWords: oldt,
                newWords: newt,
                newToOld: [],
                oldToNew: []
                };
            this._diff(diff);
           	if(this._checkDeleted) {    
	            for(opos=0, npos=0; opos<=oldt.length && npos<=newt.length; ) {
	                if(opos == diff.oldWords.length) 
	                	diff.newToOld[npos++]=null;
	                else if(npos == diff.newWords.length)
	                	diff.oldToNew[opos++]=null;
	                else if (diff.newToOld[npos] == null)
	                	npos++;
	                else if (diff.oldToNew[opos] == null)
	                	opos++;
	                else if (diff.oldToNew[opos] == npos) {
	                    opos++; npos++; 
	                } else if (diff.oldToNew[opos] - npos < 0) 
	                	diff.oldToNew[opos++]=null;
	                else if (diff.newToOld[npos] - opos < 0) 
	                	diff.newToOld[npos++]=null;
	                else {
	                	for(var i = 1; opos + i < oldt.length && npos + i < newt.length; i++) {
	                		if(diff.oldToNew[opos + i] != diff.oldToNew[opos] + i) {
	                			for(var j = opos; j < opos+i; j++) 
	                				diff.oldToNew[j] = null;
	                			opos = opos + i - 1;
	                			break;
	                		} 
	                		if(diff.newToOld[npos + i] != diff.newToOld[npos] + i) {
	                			for(var j = npos; j < npos+i; j++) 
	                				diff.newToOld[j] = null;
	                			npos = npos + i - 1;
	                			break;
	                		}
	                	}
//	                else if (diff.oldToNew[opos] - npos <= diff.newToOld[npos] - opos) 
//	                    diff.oldToNew[opos++]=null; 
//	                else 
//	                	diff.newToOld[npos++]=null;
	                }
	            }
           	}
            pos = 0,
            wpos = 0,
            npos = 0,
            opos = 0;
            opos = 0;
            npos = 0;
            var ret = "";
            for (var i = 0; i < regions.length; i ++ ) {
                
                var changes = 0,
                ot = "",
                nt = "",
                wc = 0;
                var doc = regions[i].ownerDocument;

                var domactions = [],
                last = "",
                action = "";
                count = true;
                var tw = doc.createTreeWalker(regions[i], Ci.nsIDOMNodeFilter.SHOW_ALL, this, true);
                while (cur = tw.nextNode()) {
                    drop = [];
                    while (cur) {
                        if (cur.nodeType == 3 || (this._scanImages && cur.nodeName == 'IMG')) {
                            if (cur.nodeName == 'IMG')
                                text = "[" + cur.getAttribute("src") + "] ";
                            else text = cur.data.replace(/\[/, "[ ") + " ";
                            text = text.replace(/\s+/g, ' ').replace(/^ +/, '').replace(/ +$/, ' ');
                            if (text != "" && text != " ")
                                ret += text;
                            if (newt[npos] && ret.length >= newt[npos].length)
                                break;
                            drop.push(cur);
                        }
                        cur = tw.nextNode();
                    }
                    text = ret;
                    ret = "";
                    var words = this._split(text),
                    txt = "",
                    replace = null,
                    wpos = 0;
                    wc += words.length;
                    while (true) {
                    	if(this._checkDeleted) {
	                        if (npos == diff.newWords.length && opos == diff.oldWords.length)
	                            action = "";
	                        else if(opos == diff.oldWords.length)
	                        	action = "I";
	                        else if(npos == diff.newWords.length)
	                        	action = "D";
	                        else if (diff.newToOld[npos] == null)
	                            action = "I";
	                        else if (diff.oldToNew[opos] == null)
	                            action = "D";
	                        else if (diff.oldToNew[opos] == npos)
	                            action = "K";
	                        else if (diff.oldToNew[opos] - npos < 0) 
	                        	action="I";
	                        else if (diff.newToOld[npos] - opos < 0)
	                        	action="D";
	                        else if (diff.oldToNew[opos] - npos <= diff.newToOld[npos] - opos) 
	                            action = "I";
	                        else 
	                        	action = "D";
                    	} else {
                    		if(npos==diff.newWords.length) action="";
							else if(diff.newToOld[npos]==null) action="I";
							else action="K";
                    	}
                        
                        if ((last != action && txt != "") || 
                        		((replace != null || last != "K") && wpos >= words.length && action != "D") || 
                        		((replace != null || last != "K") && wpos < words.length && npos < newt.length && this._clean(words[wpos]).length < newt[npos].length)) {
                            if (replace == null)
                                replace = doc.createElement("SPAN");
                            if (last == "K") {
                                replace.appendChild(this._DOMChanged(doc, txt, -1, last));
                                if (txt.match(/\[[^ ]+\] /))
                                    replace = null;
                            } else if (last == "D" || last=="m") {
                                if (txt.replace(/\s+/, "") != "") {
                                    replace.appendChild(this._DOMChanged(doc, txt, (count ? changes ++:- 1), last));
                                }
                            } else if (last == "I" || last == "M") {
                                replace.appendChild(this._DOMChanged(doc, txt, (count ? changes ++:- 1), last));
                            }
                            if (last == "K")
                                count = true;
                            else count = false;
                            txt = "";
                        }
                        if (wpos >= words.length && action != "D" && action != "m")
                            break;
                        if (wpos < words.length && this._clean(words[wpos]).length < newt[npos].length) {
                            ret = words[wpos];
                            break;
                        }
                        last = action;
                        if (action == "K") {
                            txt += words[wpos ++ ];
                            pos ++ ;
                            opos ++ ;
                            npos ++ ;
                        } else if (action == "I" || action == "M") {
                            txt += words[wpos ++ ];
                            pos ++ ;
                            npos ++ ;
                        } else if (action == "D" || action == "m") {
                            txt += old2[opos ++ ];
                            pos ++ ;
                        }
                    }
                    if (replace != null && cur != null) {
                        domactions.push( {
                            elem: cur,
                            repl: replace,
                            drop: drop
                        });
                    }
                }
                for (var ii = 0; ii < domactions.length; ii ++ ) {
                    for (var j = 0; j < domactions[ii].drop.length; j ++ )
                        domactions[ii].drop[j].parentNode.removeChild(domactions[ii].drop[j]);
                    domactions[ii].elem.parentNode.replaceChild(domactions[ii].repl, domactions[ii].elem);
                }
            }
        }
        result.url = url.replace(/#.*$/, '');
        result.title = doc.title.replace(/[\n\r]/g, ' ');
        if (result.name == "")
            result.name = result.title;
        var date = new Date();
        result.date = date.toLocaleString();
        result.content = current;
        result.status=0; 
        this._scheduleNextScan(result);
        this.putPage(result);
        if (changes > 0 && (result.backupPage == true || (result.backupPage == null && this.backupPages)))
            this.backupPage(doc);
        result.status=0; 
        return changes;
    },
    getURI: function(result) {
        var url = result.url;
        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var uri = ioService.newURI(url, null, null);
        if (result.user != "") {
        	var pass=this.getPass(result.url); 
        	if(pass != null) {
        		uri.username=pass.user;
        		uri.password=pass.password;
        	}
        }
        return uri;
    },
    hasPass: function(url) {
        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var uri = ioService.newURI(url, null, null);

        if (Cc["@mozilla.org/passwordmanager;1"]) {
			var passwordManager = Cc["@mozilla.org/passwordmanager;1"].getService(Ci.nsIPasswordManager);
			var e = passwordManager.enumerator;
			while (e.hasMoreElements()) {
	    		try {
	        		var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
	        		if(uri.hostPort.length<=pass.host.length && pass.host.substr(0,uri.hostPort.length)==uri.hostPort) return true;
	    		} catch (ex) {}
	 		}
        } else if (Cc["@mozilla.org/login-manager;1"]) {
        	var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
        	if(loginManager.countLogins(uri.prePath, null, "")>0) return true;
		}
		return false;
    },
    getPass: function(url) {
    	var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var uri = ioService.newURI(url, null, null);

        if (Cc["@mozilla.org/passwordmanager;1"]) {
			var passwordManager = Cc["@mozilla.org/passwordmanager;1"].getService(Ci.nsIPasswordManager);
			var e = passwordManager.enumerator;
			while (e.hasMoreElements()) {
	    		try {
	        		var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
	        		if(uri.hostPort.length<=pass.host.length && pass.host.substr(0,uri.hostPort.length)==uri.hostPort) return {user: pass.user, password: pass.password};
	    		} catch (ex) {}
	 		}
        } else if (Cc["@mozilla.org/login-manager;1"]) {
        	var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
        	var logins = loginManager.getAllLogins({});
        	for(var i=0; i<logins.length; i++) {
        		var login = logins[i];
        		if(uri.prePath == login.hostname && login.formSubmitURL==null) return {user: login.username, password: login.password}
        	}
		}
		return null;	
    },
    markSeen: function(url) {
    	var result=this.getPage(url); 
        if (this.RDF.GetTarget(this._rr(result.url), this._rr(NS_RDF + "name"), true)) {
	    	result.status=this.RESULT_UNCHECKED;
			result.date = "";
			this.putPage(result);
			
	        var time = Date.now();
	        if (this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "nextScan"), true))
	            this.RDF.Change(this._rr(result.url), this._rr(SD_RDF + "nextScan"), this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "nextScan"), true).QueryInterface(Ci.nsIRDFLiteral), this._rl(time));
	        else this.RDF.Assert(this._rr(result.url), this._rr(SD_RDF + "nextScan"), this._rl(time), true);
	        
	        if(this._watchUrl == null) {
	        	this._timer.cancel();
            	this._timer.initWithCallback(this, 1000, this._timer.TYPE_ONE_SHOT);
			}
        }    	
    },
    updateAll: function() {
    	var rootbag = this._rr("urn:root:bag");
        var bag = Cc["@mozilla.org/rdf/container;1"].createInstance(Ci.nsIRDFContainer);
        bag.Init(this.RDF, rootbag);
        var pages = bag.GetElements();
        while(pages.hasMoreElements()) {
        	var page = pages.getNext();
        	this.updatePage(page.QueryInterface(Ci.nsIRDFResource).Value);
        }
    },
    updatePage: function(url) {
    	if(!url) return;
    	var result=this.getPage(url); 
        if (this.RDF.GetTarget(this._rr(result.url), this._rr(NS_RDF + "name"), true)) {
	    	result.status=this.RESULT_UNCHECKED;
	        var time = Date.now();
	        if (this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "nextScan"), true))
	            this.RDF.Change(this._rr(result.url), this._rr(SD_RDF + "nextScan"), this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "nextScan"), true).QueryInterface(Ci.nsIRDFLiteral), this._rl(time));
	        else this.RDF.Assert(this._rr(result.url), this._rr(SD_RDF + "nextScan"), this._rl(time), true);
        }
		if(this._watchUrl == null) {
			this._watchUrl = "starting...";
	        this._timer.cancel();
            this._timer.initWithCallback(this, 10, this._timer.TYPE_ONE_SHOT);
		}
    },
    // private methods
    _listPages: function() {
        var file = this._sitedeltaDir(),
        ret = [];
        var entries = file.directoryEntries;
        while (entries.hasMoreElements()) {
            var entry = entries.getNext();
            entry.QueryInterface(Ci.nsIFile);
            if (/\.dat$/.test(entry.leafName)) {
                var page = this._loadFile(entry.leafName);
                ret.push(page.url);
            }
        }
        return ret;
    },
    _split: function(text) {
    	if(text=="") return [];
        return text.match(this._spaceRegex);
    },
    _clean: function(text) {
        if (this._ignoreCase)
            text = text.toLowerCase();
        if (this._ignoreNumbers)
            text = text.replace(/[0-9]+/g, "xxx");
        return text;
    },
    savePrefs: function() { 
    	this._prefs.setBoolPref("openChanged",this.openChanged);
        this._prefs.setBoolPref("scanImages",this.scanImages);
        this._prefs.setBoolPref("checkDeleted",this.checkDeleted);
        this._prefs.setBoolPref("ignoreCase",this.ignoreCase);
        this._prefs.setBoolPref("ignoreNumbers",this.ignoreNumbers);
        this._prefs.setBoolPref("showRegions",this.showRegions);
        this._prefs.setBoolPref("backupPages",this.backupPages);
        this._prefs.setBoolPref("scanOnLoad",this.scanOnLoad);
        this._prefs.setBoolPref("highlightOnLoad",this.highlightOnLoad);
        this._prefs.setCharPref("notifySound",this.notifySound);
        this._prefs.setBoolPref("notifyAlert",this.notifyAlert);
        this._prefs.setIntPref("watchPageDelay",this.watchPageDelay/1000);
        this._prefs.setIntPref("watchScanDelay",this.watchScanDelay);
        this._prefs.setIntPref("watchPageTimeout",this.watchPageTimeout/1000);
        this._prefs.setBoolPref("watchEnableScript",this.watchEnableScript);
        this._prefs.setBoolPref("enableWatch",this.enableWatch);
        this._prefs.setBoolPref("siteSettings",this.siteSettings);
        if(this._watchUrl == null) {
	        this._timer.cancel();
            this._timer.initWithCallback(this, 100, this._timer.TYPE_ONE_SHOT);
		}
    },
    _loadPrefs: function() {
        this.openChanged = this._prefs.getBoolPref("openChanged");
        this.scanImages = this._prefs.getBoolPref("scanImages");
        this.checkDeleted = this._prefs.getBoolPref("checkDeleted");
        this.ignoreCase = this._prefs.getBoolPref("ignoreCase");
        this.ignoreNumbers = this._prefs.getBoolPref("ignoreNumbers");
        this.showRegions = this._prefs.getBoolPref("showRegions");
        this.addBorder = this._prefs.getCharPref("addBorder");
        this.addBackground = this._prefs.getCharPref("addBackground");
        this.moveBorder = this._prefs.getCharPref("moveBorder");
        this.moveBackground = this._prefs.getCharPref("moveBackground");
        this.removeBorder = this._prefs.getCharPref("removeBorder");
        this.removeBackground = this._prefs.getCharPref("removeBackground");
        this.includeRegion = this._prefs.getCharPref("includeRegion");
        this.excludeRegion = this._prefs.getCharPref("excludeRegion");
        this.backupPages = this._prefs.getBoolPref("backupPages");
        this.scanOnLoad = this._prefs.getBoolPref("scanOnLoad");
        this.highlightOnLoad = this._prefs.getBoolPref("highlightOnLoad");
        this.notifySound = this._prefs.getCharPref("notifySound");
        this.notifyAlert = this._prefs.getBoolPref("notifyAlert");
        this.watchPageDelay = this._prefs.getIntPref("watchPageDelay") * 1000 + 1;
        this.watchScanDelay = this._prefs.getIntPref("watchScanDelay");
        this.watchPageTimeout = this._prefs.getIntPref("watchPageTimeout") * 1000 + 1;
        this.enableWatch = this._prefs.getBoolPref("enableWatch");
        this.watchEnableScript = this._prefs.getBoolPref("watchEnableScript");
        this.siteSettings = this._prefs.getBoolPref("siteSettings");
        this.autoMinDelay = this._prefs.getIntPref("autoMinDelay");
        this.autoMaxDelay = this._prefs.getIntPref("autoMaxDelay");
        this.autoDelayPercent = this._prefs.getIntPref("autoDelayPercent");
		if(this._watchUrl == null) {
	        this._timer.cancel();
            this._timer.initWithCallback(this, 5000, this._timer.TYPE_ONE_SHOT);
		}        
    },
    _load: function() {
        this._prefManager = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
        this._prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.sitedelta@schierla.de.");
        this._prefs.QueryInterface(Ci.nsIPrefBranch2);
        this._prefs.addObserver("", this, false);
        this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this._loadPrefs();
        var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        file.append("sitedelta");
        this._dir = file;
        if ( ! file.exists() || !file.isDirectory()) {
            file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
        }
        
        this.rdfService = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
        var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        file.append("sitedelta.rdf");
        
        this.wrappedJSObject = this;
        this._observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
        this._observerService.addObserver(this, "xpcom-shutdown", false);
        
		var sbs = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
		this._strings = sbs.createBundle("chrome://sitedelta/locale/sitedelta.properties");        

        var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        if (file.exists()) {
            this.RDF = this.rdfService.GetDataSourceBlocking(ios.newFileURI(file).spec);
        } else {
            this._buildRDF();
        }
    },
    _unload: function() {
    	if(this._iframe) this._watchEndCheck();
    	if(this._parseHandler) this._parseHandler._self=null;
		this._parseHandler=null;    	
        this._prefs.removeObserver("", this);
        this._observerService.removeObserver(this, "xpcom-shutdown");
        if (this.enableWatch) {
            this._watchEndCheck();
            this._timer.cancel();
        }
        this.RDF.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();   
    },
        
    // RDF access
    _rr: function(url) {
        return this.rdfService.GetResource(url);
    },
    _rl: function(literal) {
        return this.rdfService.GetLiteral(literal);
    },
    _scheduleNextScan: function(result) {
        if (this.RDF.GetTarget(this._rr(result.url), this._rr(NS_RDF + "name"), true)) {
			var delay= (result.watchDelay==0?this.watchScanDelay:result.watchDelay);
	        var time = Date.now();
	        var nextScan = this._getNextScan(result.url);
	        if (delay == -1 || delay == 0) {
	            time = 0;
	        } else if (result.status == 1) {
	            time = 0;
	        } else if (delay < -1) {
	            time -= delay*60000;
	        } else if (delay > 0)
	            time += delay*60000+1;
	        if(time > nextScan && nextScan > Date.now()) time = nextScan;
	        if (this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "nextScan"), true))
	            this.RDF.Change(this._rr(result.url), this._rr(SD_RDF + "nextScan"), this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "nextScan"), true).QueryInterface(Ci.nsIRDFLiteral), this._rl(time));
	        else this.RDF.Assert(this._rr(result.url), this._rr(SD_RDF + "nextScan"), this._rl(time), true);
	        
	        if(delay < -1 && time != nextScan) {
	        	if(result.status == 1) {
	        		// will be increased twice afterwards
	        		delay = delay * 100 / this.autoDelayPercent; 
	        		delay = delay * 100 / this.autoDelayPercent; 
	        		delay = delay * 100 / this.autoDelayPercent; 
	        	} else {
	        		delay = delay * this.autoDelayPercent / 100;
	        	}
		        if(delay < -this.autoMaxDelay) delay=-this.autoMaxDelay; 
		        if(delay > -this.autoMinDelay) delay=-this.autoMinDelay; 
		        result.watchDelay=delay; this.putPage(result);
	        }
        }
		if(this._watchUrl == null) {
	        this._timer.cancel();
            this._timer.initWithCallback(this, this.watchPageDelay, this._timer.TYPE_ONE_SHOT);
		}
    },
    _getNextScan: function(url) {
    	var nextScan = this.RDF.GetTarget(this._rr(url), this._rr(SD_RDF + "nextScan"), true);
    	if(nextScan == null) return 0; else return nextScan.QueryInterface(Ci.nsIRDFLiteral).Value;
    },
    _rdfDel: function(result) {
    	if(!this.RDF.GetTarget(this._rr(result.url), this._rr(NS_RDF + "name"), true)) return;
    	var rootbag = this._rr("urn:root:bag"), page=this._rr(result.url);
        var bag = Cc["@mozilla.org/rdf/container;1"].createInstance(Ci.nsIRDFContainer);
        bag.Init(this.RDF, rootbag);
        bag.RemoveElement(page, true);
		this.RDF.Unassert(this._rr(result.url), this._rr(NS_RDF + "name"), this.RDF.GetTarget(this._rr(result.url), this._rr(NS_RDF + "name"), true), true);
		this.RDF.Unassert(this._rr(result.url), this._rr(SD_RDF + "status"), this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "status"), true), true);
		this.RDF.Unassert(this._rr(result.url), this._rr(SD_RDF + "nextScan"), this.RDF.GetTarget(this._rr(result.url), this._rr(SD_RDF + "nextScan"), true), true);
        this.RDF.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();        
    },
    _rdfAdd: function(result) {
    	if(this.RDF.GetTarget(this._rr(result.url), this._rr(NS_RDF + "name"), true)) {
	        this.RDF.Change(this._rr(result.url), this._rr(NS_RDF + "name"), this.RDF.GetTarget(this._rr(result.url), this._rr(NS_RDF + "name"), true), this._rl(result.name));
	        this._scheduleNextScan(result);	        
	        return;
    	} 
    	var rootbag = this._rr("urn:root:bag");
        var bag = Cc["@mozilla.org/rdf/container;1"].createInstance(Ci.nsIRDFContainer);
        bag.Init(this.RDF, rootbag);
        bag.AppendElement(this._rr(result.url));
        this.RDF.Assert(this._rr(result.url), this._rr(NS_RDF + "name"), this._rl(result.name), true);
        this.RDF.Assert(this._rr(result.url), this._rr(SD_RDF + "status"), this._rl(this.RESULT_UNCHECKED), true);
        this._scheduleNextScan(result);    	
        this.RDF.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();        
    },
    _buildRDF: function() {
        var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        file.append("sitedelta.rdf");
        var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var files = this._listPages();
        this.RDF = this.rdfService.GetDataSourceBlocking(ios.newFileURI(file).spec);
        var ds = this.RDF;
        var RDFCU = Cc["@mozilla.org/rdf/container-utils;1"].getService(Ci.nsIRDFContainerUtils),
        RDFS = this.rdfService;
        var bagr = this._rr("urn:root:bag"),
        bag = RDFCU.MakeBag(ds, bagr);
        ds.Assert(this._rr("urn:root"), this._rr(NS_RDF + "links"), bagr, true);
        for (var i = 0; i < files.length; i ++ ) {
            var result = this.getPage(files[i]);
            this._rdfAdd(result);
            if(result.date == "") this.markSeen(result.url);
        }
        this.RDF.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
    },
    
    // file manipulation
    _sitedeltaDir: function() {
        return this._dir.clone();
    },
    _saveFile: function(fn, data) {
        var file = this._sitedeltaDir();
        file.append(fn);
        var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
        var document = Cc["@mozilla.org/xul/xul-document;1"].createInstance(Ci.nsIDOMDocument).implementation;
        var doc = document.createDocument("", "", null);
        var root = doc.createElement("sitedelta");
        var elem = doc.createElement("url");
        if (data.user != "") {
            var attr = doc.createAttribute("user");
            attr.value = data.user;
            elem.attributes.setNamedItem(attr);
        }
        elem.appendChild(doc.createTextNode(data.url));
        root.appendChild(elem);
        if (data.name != "") {
            elem = doc.createElement("name");
            elem.appendChild(doc.createTextNode(data.name));
            root.appendChild(elem);
        }
        for (var i = 0; i < data.includes.length; i ++ ) {
            elem = doc.createElement("include");
            elem.appendChild(doc.createTextNode(data.includes[i]));
            root.appendChild(elem);
        }
        for (var i = 0; i < data.excludes.length; i ++ ) {
            elem = doc.createElement("exclude");
            elem.appendChild(doc.createTextNode(data.excludes[i]));
            root.appendChild(elem);
        }
        elem = doc.createElement("title");
        elem.appendChild(doc.createTextNode(data.title));
        root.appendChild(elem);
        elem = doc.createElement("date");
        elem.appendChild(doc.createTextNode(data.date));
        root.appendChild(elem);
        
        elem = doc.createElement("settings");
        if (data.checkDeleted != null) {
            var attr = doc.createAttribute("checkDeleted");
            attr.value = data.checkDeleted ? "true": "false";
            elem.attributes.setNamedItem(attr);
        }
        if (data.scanImages != null) {
            var attr = doc.createAttribute("scanImages");
            attr.value = data.scanImages ? "true": "false";
            elem.attributes.setNamedItem(attr);
        }
        if (data.backupPage != null) {
            var attr = doc.createAttribute("backupPage");
            attr.value = data.backupPage ? "true": "false";
            elem.attributes.setNamedItem(attr);
        }
        if (data.watchDelay != null) {
            var attr = doc.createAttribute("watchDelay");
            attr.value = data.watchDelay;
            elem.attributes.setNamedItem(attr);
        }
        if (data.watchEnableScript != null) {
            var attr = doc.createAttribute("watchEnableScript");
            attr.value = data.watchEnableScript ? "true": "false";
            elem.attributes.setNamedItem(attr);
        }
        if (data.ignoreCase != null) {
            var attr = doc.createAttribute("ignoreCase");
            attr.value = data.ignoreCase ? "true": "false";
            elem.attributes.setNamedItem(attr);
        }
        if (data.ignoreNumbers != null) {
            var attr = doc.createAttribute("ignoreNumbers");
            attr.value = data.ignoreNumbers ? "true": "false";
            elem.attributes.setNamedItem(attr);
        }
        if (elem.attributes.length > 0)
            root.appendChild(elem);
        
        elem = doc.createElement("content");
        elem.appendChild(doc.createTextNode(data.content));
        root.appendChild(elem);
        doc.appendChild(root);
        var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
        serializer.serializeToStream(doc, foStream, "UTF-8");
        foStream.close();
    },
    _getFilename: function(url) {
        var fn = new String(url);
        fn = fn.replace(/^.*:\/\//, "");
        fn = fn.replace(/[^\/]*@/, "");
        fn = fn.replace(/#.*$/, "");
        fn = fn.replace(/\./g, '-');
        fn = fn.replace(/\%[0-9A-Fa-f]{2}/g, "_");
        fn = fn.replace(/[^a-zA-Z0-9\.]+/g, "_");
        fn = fn.replace(/_$/, "");
        fn = fn.replace(/^_/, "");
        if(fn.length>100) fn=fn.substr(0,100);
        if (fn == '')
            fn = '_default_';
        return fn;
    },
    _readFileOld: function(fn) {
        var includes = new Array();
        var excludes = new Array();
        var url = fn;
        var title = "";
        var date = "";
        var last = " \n";
        var file = this._sitedeltaDir();
        file.append(fn);
        var name = "";
        if (file.exists()) {
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var is = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
            fstream.init(file, -1, 0, 0);
            is.init(fstream, "UTF-8", 1024, 0xFFFD);
            var str = {};
            var lis = is.QueryInterface(Ci.nsIUnicharLineInputStream);
            var contentStarted = false;
            var xpath = "/html/body[1]";
            do {
                var more = lis.readLine(str);
                var str2 = str.value;
                if ( ! contentStarted && !str2.match(/^[a-zA-Z0-9]+:/))
                    contentStarted = true;
                if (contentStarted) {
                    last += str2;
                } else {
                    if (str2.match(/^URL:/))
                        url = str2.replace(/^.*?:/, "");
                    else if (str2.match(/^XPATH:/))
                        includes.push(str2.replace(/^.*?:/, ""));
                    else if (str2.match(/^EXCLUDE:/))
                        excludes.push(str2.replace(/^.*?:/, ""));
                    else if (str2.match(/^TITLE:/))
                        title = str2.replace(/^.*?:/, "");
                    else if (str2.match(/^NAME:/))
                        name = str2.replace(/^.*?:/, "");
                    else if (str2.match(/^DATE:/))
                        date = str2.replace(/^.*?:/, "");
                }
            }
            while (more);
            is.close();
            fstream.close();
        }
        if (name == "" && url != fn)
            name = url.replace(/^https?:\/\//i, "");
        if (includes.length == 0)
            includes.push("/html/body[1]");
        var result = {};
        result.includes = includes;
        result.name = name;
        result.excludes = excludes;
        result.status = this.RESULT_UNCHECKED;
        result.title = title;
        result.date = date;
        result.url = url;
        result.content = last.replace(/\s+/g, " ");
        result.watchDelay = 0;
        return result;
    },
    _getText: function(node) {
        var doc = node.ownerDocument, cur=null, text="", ret = "";
        var tw = doc.createTreeWalker(node, Ci.nsIDOMNodeFilter.SHOW_ALL, this, true);
        while (cur = tw.nextNode()) {
            if (cur.nodeType == 3 || (this._scanImages && cur.nodeName == 'IMG')) {
                if (cur.nodeName == 'IMG')
                    text = "[" + cur.getAttribute("src") + "] ";
                else text = cur.data.replace(/\[/, "[ ") + " ";
                text = text.replace(/\s+/g, ' ');
                text = text.replace(/^ +/, '');
                text = text.replace(/ +$/, ' ');
                if (text != " ")
                    ret += text;
            }
        }
        return ret;
    },
    
    _walkTree: function(node, highlight, current, pos) {
        var insertElement = false,
        ret = "",
        changes = 0,
        currentpos = 0,
        text = "";
        var doc = node.ownerDocument;
        var page = this.getPage(doc.URL);
        if (page.checkDeleted != null) this._checkDeleted = page.checkDeleted;
        else this._checkDeleted = this.checkDeleted;
        if (page.scanImages != null) this._scanImages = page.scanImages;
        else this._scanImages = this.scanImages;
        var last = page.content;
        if (current != null) {
            currentpos = 1;
        } else {
            current = "";
            currentpos = -1;
        }

        var domactions = [];
        var tw = doc.createTreeWalker(node, Ci.nsIDOMNodeFilter.SHOW_ALL, this, true);
        while (cur = tw.nextNode()) {
            if (cur.nodeType == 3 || (this._scanImages && cur.nodeName == 'IMG')) {
                if (cur.nodeName == 'IMG') text = "[" + cur.getAttribute("src") + "] ";
                else text = cur.data.replace(/\[/, "[ ") + " ";
                text = text.replace(/[ \t\n\r]+/g, ' ');
                text = text.replace(/^ +/, '');
                text = text.replace(/ +$/, ' ');
                ret += text;
                if (text != "" && text != " ") {
                    if (!this._checkDeleted) {
                        if (last.indexOf(text) == -1) domactions.push({
                            action: "add",
                            node: cur
                        });
                    } else {
                        while (last.charAt(pos) == ' ' || last.charAt(pos) == "\n" || last.charAt(pos) == "\t") pos++;
                        if (last.indexOf(text) == -1) {
                            // new text
                            domactions.push({
                                action: "add",
                                node: cur
                            });
                            if (!insertElement) insertElement = cur;
                        } else if (last.indexOf(text, pos) == pos) {
                            // text unchanged
                            pos += text.length;
                            insertElement = false;
                        } else if (last.indexOf(text, pos) > pos) {
                            var missingtext = last.substring(pos, last.indexOf(text, pos));
                            if (currentpos > 0 && current.indexOf(missingtext, currentpos) > 0 && !(last.indexOf(current.substr(currentpos, missingtext.length + 1), pos) > pos)) {
                                // moved upwards
                                domactions.push({
                                    action: "move",
                                    node: cur
                                });
                                if (!insertElement) insertElement = cur;
                            } else {
                                // text removed
                                domactions.push({
                                    action: "remove",
                                    node: (insertElement ? insertElement: cur),
                                    data: missingtext
                                });
                                insertElement = false;
                                pos += missingtext.length + text.length;
                            }
                        } else if (last.indexOf(text) < pos) {
                            // new text is already known before
                            if (currentpos > 0 && current.indexOf(text) < currentpos) {
                                // copied
                                domactions.push({
                                    action: "add",
                                    node: cur
                                });
                            } else {
                                // moved
                                domactions.push({
                                    action: "move",
                                    node: cur
                                });
                            }
                            insertElement = cur;
                        }
                    }
                }
                if (currentpos > 0) currentpos += text.length;
            }
        }
        if (currentpos > 0 && this._checkDeleted) {
            if (currentpos > current.length) {
                if (pos + 1 < last.length) {
                    var missingtext = last.substring(pos, last.length - 1);
                    if (missingtext.replace(/[ \t\n]/g, "") != "") {
                        cur = node.ownerDocument.createElement("SPAN");
                        node.appendChild(cur);
                        domactions.push({
                            action: "remove",
                            node: cur,
                            data: missingtext
                        });
                        pos = last.length + 1;
                    }
                }
            }
        }

        if (highlight) {
            for (var i = 0; i < domactions.length; i++) {
                if (domactions[i].action == "add") this._DOMAdded(domactions[i].node, highlight, i);
                if (domactions[i].action == "move") this._DOMMoved(domactions[i].node, highlight, i);
                if (domactions[i].action == "remove") this._DOMRemoved(domactions[i].node, domactions[i].data, highlight, i);
            }
        }
        changes += domactions.length;
        return {
            text: ret,
            changes: changes,
            current: (current ? current.substr(currentpos) : null),
            pos: pos
        };
    },
    _DOMRemoved: function(cur, text, highlight, nr) {
        while (cur.newElement) cur = cur.newElement;
        var doc = cur.ownerDocument;
        var hil = doc.createElement("SPAN");
        var del = doc.createElement("DEL");
        del.setAttribute("style", "-moz-outline: dotted " + this.removeBorder + " 1px; background: " + this.removeBackground + "; color: #000;");
        del.id = "sitedelta-change" + nr;
        while (text.indexOf("[") != -1) {
            del.appendChild(doc.createTextNode(text.substring(0, text.indexOf("["))));
            text = text.substr(text.indexOf("[") + 1);
            if (text.charAt(0) == " ") {
                del.appendChild(doc.createTextNode("["));
            } else {
                var img = doc.createElement("IMG");
                img.setAttribute("src", text.substring(0, text.indexOf("]")));
                img.style.MozOpacity = "0.3";
                del.appendChild(img);
                text = text.substr(text.indexOf("]") + 1);
            }
        }
        del.appendChild(doc.createTextNode(text));
        hil.appendChild(del);
        hil.appendChild(cur.cloneNode(true));
        cur.parentNode.replaceChild(hil, cur);
        cur.newElement = hil;
    },
    _DOMMoved: function(cur, highlight, nr) {
        while (cur.newElement) cur = cur.newElement;
        var hil = cur.ownerDocument.createElement("SPAN");
        hil.setAttribute("style", "-moz-outline: dotted " + this.moveBorder + " 1px; background: " + this.moveBackground + "; color: #000;");
        hil.id = "sitedelta-change" + nr;
        hil.appendChild(cur.cloneNode(true));
        cur.parentNode.replaceChild(hil, cur);
        cur.newElement = hil;
    },
    _DOMAdded: function(cur, highlight, nr) {
        while (cur.newElement) cur = cur.newElement;
        var hil = cur.ownerDocument.createElement("SPAN");
        hil.setAttribute("style", "-moz-outline: dotted " + this.addBorder + " 1px; background: " + this.addBackground + "; color: #000;");
        hil.id = "sitedelta-change" + nr;
        hil.appendChild(cur.cloneNode(true));
        cur.parentNode.replaceChild(hil, cur);
        cur.newElement = hil;
    },
    _DOMChanged: function(doc, text, nr, type) {
        var del = doc.createElement("SPAN"),
        ret = del;
        if (type == "D" || type=="m") {
            ret = doc.createElement("SPAN");
            if (text == "")
                return ret;
            del = doc.createElement("SPAN");
            var img = doc.createElement("IMG");
            if(type=="D") {
	            del.setAttribute("style", "border: dotted " + this.removeBorder + " 1px; background: " + this.removeBackground + "; color: #000; display: none; position: absolute; width: auto; left: 0px; top: 0px; padding: 2px; -moz-border-radius: 5px; ");
	            img.setAttribute("src", "chrome://sitedelta/skin/del.png");
            } else {
	            del.setAttribute("style", "border: dotted " + this.moveBorder + " 1px; background: " + this.moveBackground + "; color: #000; display: none; position: absolute; width: auto; left: 0px; top: 0px; padding: 2px; -moz-border-radius: 5px; ");
	            img.setAttribute("src", "chrome://sitedelta/skin/cut.png");            	
            }
            img.setAttribute("border", "0");
            ret.appendChild(img);
            img.addEventListener("mouseover", function(event) {
                this.nextSibling.style.display = 'block';
                this.nextSibling.style.maxWidth = this.ownerDocument.width / 3;
            }, false)
                img.addEventListener("mousemove", function(event) {
                this.nextSibling.style.left = (event.layerX <= this.ownerDocument.width / 2 ? event.layerX + 4: Math.max(10, event.layerX - 4 - this.nextSibling.clientWidth)) + "px";
                this.nextSibling.style.top = (event.layerY - this.nextSibling.clientHeight > 0 ? (event.layerY - this.nextSibling.clientHeight): event.layerY + 10) + "px";
            }, false)
                img.addEventListener("mouseout", function(event) {
                this.nextSibling.style.display = 'none';
            }, false);
            ret.appendChild(del);
        } else if (type == "I" || type=="M") {
            del = doc.createElement("SPAN");
            ret = del;
            if(type=="I")
	            del.setAttribute("style", "display: inline; outline: " + this.addBorder + " dotted 1px; background: " + this.addBackground + "; color: #000;");
	        else
	            del.setAttribute("style", "display: inline; outline: " + this.moveBorder + " dotted 1px; background: " + this.moveBackground + "; color: #000;");
        }
        if (nr !=- 1 & type != "K")
            ret.id = "sitedelta-change" + nr;
        while (text.indexOf("[") !=- 1) {
            del.appendChild(doc.createTextNode(text.substring(0, text.indexOf("["))));
            text = text.substr(text.indexOf("[") + 1);
            if (text.charAt(0) == " ") {
                del.appendChild(doc.createTextNode("["));
            } else {
                var img = doc.createElement("IMG");
                img.setAttribute("src", text.substring(0, text.indexOf("]")));
                img.setAttribute("border",0);
//                img.addEventListener("error", function() {this.parentNode.removeChild(this);}, true);
                del.appendChild(img);
                text = text.substr(text.indexOf("]") + 1);
            }
        }
        if (text != "")
            del.appendChild(doc.createTextNode(text));
        return ret;
    },
    
    // hidden page load
    _watchCheckPage: function (result) {
		result.status=this.RESULT_CHECKING;
		this._watchUrl = result.url;
		var _svc=this;
        var windowMediator = Cc['@mozilla.org/appshell/window-mediator;1'].
                             getService(Ci.nsIWindowMediator);
        var window = windowMediator.getMostRecentWindow("navigator:browser");
        if (!window) {_svc._watchEndCheck(); return; }
        var document = window.document;
        var rootElement = document.documentElement;
	    _svc._timer.cancel();

	    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var channel = ioService.newChannelFromURI(_svc.getURI(result));  

        _svc._iframe = document.createElement('iframe');
        _svc._timer.initWithCallback(_svc, _svc.watchPageTimeout, _svc._timer.TYPE_ONE_SHOT);
        _svc._iframe._svc = _svc;
        _svc._iframe._reloaded = false;
        _svc._iframe.setAttribute("collapsed", true);
        _svc._iframe.setAttribute("type", "content");
        rootElement.appendChild(_svc._iframe);
        var webNav = _svc._iframe.docShell.QueryInterface(Ci.nsIWebNavigation);
        webNav.stop(Ci.nsIWebNavigation.STOP_ALL);
        _svc._iframe.docShell.allowJavascript = (result.watchEnableScript!=null?result.watchEnableScript:_svc.watchEnableScript); 
        _svc._iframe.docShell.allowAuth = false;
        _svc._iframe.docShell.allowPlugins = false;
        _svc._iframe.docShell.allowMetaRedirects = false;
        _svc._iframe.docShell.allowSubframes = false;
        _svc._iframe.docShell.allowImages = false;
        _svc._iframe.addEventListener("DOMContentLoaded", _svc._watchPageLoaded, true);
        var request = channel.QueryInterface(Ci.nsIRequest);
        request.loadFlags |= Ci.nsIRequest.LOAD_BACKGROUND | Ci.nsIRequest.VALIDATE_ALWAYS;
        var uriLoader = Cc["@mozilla.org/uriloader;1"].getService(Ci.nsIURILoader);
        uriLoader.openURI(channel, true, _svc._iframe.docShell);
    },
    _playSound: function(soundname) {
		var sound = Cc["@mozilla.org/sound;1"].createInstance(Ci.nsISound);
		if(soundname=="beep") {
			sound.beep();
		} else if(soundname.indexOf("file:")!=0) {
			sound.playSystemSound(soundname);
		} else {
            var ioService =	Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
            sound.play(ioService.newURI(soundname,null,null));
		}
    },
    _watchPageLoaded: function() {

    	var _svc=(this._svc?this._svc:this);
        _svc._timer.cancel();
        if(_svc._iframe) {
        	var channel = _svc._iframe.docShell.currentDocumentChannel;
        	if(channel) channel=channel.QueryInterface(Ci.nsIHttpChannel);
        	if(channel && channel.responseStatus == 401 && _svc._iframe._reloaded == false) {
        		_svc._iframe._reloaded = true;
                var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
                var channel = ioService.newChannelFromURI(channel.URI);  
                var request = channel.QueryInterface(Ci.nsIRequest);
                request.loadFlags |= Ci.nsIRequest.LOAD_BACKGROUND | Ci.nsIRequest.VALIDATE_ALWAYS;
                var uriLoader = Cc["@mozilla.org/uriloader;1"].getService(Ci.nsIURILoader);
                uriLoader.openURI(channel, true, _svc._iframe.docShell);
        		return;
        	} else if(channel && channel.responseStatus == 304) {   
    	        var result = _svc.getPage(_svc._iframe.contentDocument.URL);
    	        if(result.status != _svc.RESULT_NEW) result.status = 0;
    	        _svc._scheduleNextScan(result);
        	} else {
		        var result = _svc.getPage(_svc._iframe.contentDocument.URL);
		        if(result.status != _svc.RESULT_NEW && _svc.scanPage(_svc._iframe.contentDocument)>0) {
			        var result = _svc.getPage(_svc._iframe.contentDocument.URL);
	        		if(_svc.notifyAlert) {
						var alerts = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
						alerts.showAlertNotification("chrome://sitedelta/content/sitedeltaGross.gif",  _svc._strings.GetStringFromName("notifyTitle"), result.name, true, result.url, _svc);
	        		}
	        		if(_svc.notifySound!="") {
	        			_svc._playSound(_svc.notifySound);
	        		}
	        	}
        	}
        }
        _svc._watchUrl=null;
        _svc._watchEndCheck(_svc);
    },
    _watchEndCheck: function() {
    	var _svc=(this._svc?this._svc:this);
    	if(_svc._watchUrl!=null) {
          var result = _svc.getPage(_svc._watchUrl);
          if (result.status == _svc.RESULT_CHECKING) {
            result.status= _svc.RESULT_ERROR;
	        _svc._scheduleNextScan(result);
          }
          _svc._watchUrl=null;
    	}
        if (_svc._iframe) {
            var webNav = _svc._iframe.docShell.QueryInterface(Ci.nsIWebNavigation);
	        _svc._iframe.removeEventListener("DOMContentLoaded", _svc._watchPageLoaded, true);
            webNav.stop(Ci.nsIWebNavigation.STOP_ALL);
            if (_svc._iframe.parentNode)
                _svc._iframe.parentNode.removeChild(_svc._iframe);
            _svc._iframe._svc=null;
            _svc._iframe = null;
        }
        _svc._timer.initWithCallback(_svc, _svc.watchPageDelay, _svc._timer.TYPE_ONE_SHOT);
    },
    _watchScanNext: function() {
        var next = 0, nextpage=null,
        now = Date.now();
        var rootbag = this._rr("urn:root:bag");
        var bag = Cc["@mozilla.org/rdf/container;1"].createInstance(Ci.nsIRDFContainer);
        bag.Init(this.RDF, rootbag);
        var pages = bag.GetElements();
        while (pages.hasMoreElements()) {
            var page = pages.getNext().QueryInterface(Ci.nsIRDFResource);
            var nextscan = this.RDF.GetTarget(page, this._rr(SD_RDF + "nextScan"), true).QueryInterface(Ci.nsIRDFLiteral).Value;
            var status = this.RDF.GetTarget(page, this._rr(SD_RDF + "status"), true).QueryInterface(Ci.nsIRDFLiteral).Value;
            if (nextscan>0 && (status == this.RESULT_ERROR || status == this.RESULT_UNCHANGED || status == this.RESULT_UNCHECKED)) {
            	if(next==0) next=nextscan;
            	if(next>=nextscan) {
                	nextpage = page.Value;
	                next = nextscan;
	           	}
            }
        }
        if(next==0) return; 
		if(next<now) {
			nextpage=this.getPage(nextpage);
	        this._watchUrl = nextpage.url;
			this._watchCheckPage(nextpage);
		} else {
	        this._timer.initWithCallback(this, Math.max(next - now, this.watchPageDelay), this._timer.TYPE_ONE_SHOT);
		}
    },
    
    // diff, based on http://doi.acm.org/10.1145/359460.359467
    // and http://en.wikipedia.org/wiki/User:Cacycle/diff.js
    _diff: function(text, newStart, newEnd, oldStart, oldEnd, recursionLevel) {
        symbol = {
            newCtr: [],
            oldCtr: [],
            toNew: [],
            toOld: []
            };
        newStart = newStart || 0;
        newEnd = newEnd || text.newWords.length;
        oldStart = oldStart || 0;
        oldEnd = oldEnd || text.oldWords.length;
        recursionLevel = recursionLevel || 0;
        if (recursionLevel > 10) {
            return;
        }
        //
        for (var i = newStart; i < newEnd; i ++ ) {
            var word = text.newWords[i];
            if (symbol[word] == null)
                symbol[word] = {
                newCtr: 0,
                oldCtr: 0,
                toNew: null,
                toOld: null
            };
            symbol[word].newCtr ++ ;
            symbol[word].toNew = i;
            if (i < newEnd - 2) {
                var word = text.newWords[i] + text.newWords[i + 1] + text.newWords[i + 2];
                if (symbol[word] == null)
                    symbol[word] = {
                    newCtr: 0,
                    oldCtr: 0,
                    toNew: null,
                    toOld: null
                };
                symbol[word].newCtr ++ ;
                symbol[word].toNew = i;
            }
        }
        //
        for (var j = oldStart; j < oldEnd; j ++ ) {
            var word = text.oldWords[j];
            if (symbol[word] == null)
                symbol[word] = {
                newCtr: 0,
                oldCtr: 0,
                toNew: null,
                toOld: null
            };
            symbol[word].oldCtr ++ ;
            symbol[word].toOld = j;
            if (j < oldEnd - 2) {
                var word = text.oldWords[j] + text.oldWords[j + 1] + text.oldWords[j + 2];
                if (symbol[word] == null)
                    symbol[word] = {
                    newCtr: 0,
                    oldCtr: 0,
                    toNew: null,
                    toOld: null
                };
                symbol[word].oldCtr ++ ;
                symbol[word].toOld = j;
            }
        }
        //
        for (var i in symbol) {
            if ((symbol[i].newCtr == 1) && (symbol[i].oldCtr == 1) && !/\s+/.test(text.newWords[symbol[i].toNew])) {
                text.newToOld[symbol[i].toNew] = symbol[i].toOld;
                text.oldToNew[symbol[i].toOld] = symbol[i].toNew;
            }
        }
        //
        if (text.newWords[newStart] == text.oldWords[oldStart]) {
            text.newToOld[newStart] = oldStart;
            text.oldToNew[oldStart] = newStart;
        }
        for (var i = newStart; i < newEnd - 1; i ++ ) {
            if ((j = text.newToOld[i]) != null) {
                if ((text.newToOld[i + 1] == null) && (text.oldToNew[j + 1] == null)) {
                    if (text.newWords[i + 1] == text.oldWords[j + 1]) {
                        text.newToOld[i + 1] = j + 1;
                        text.oldToNew[j + 1] = i + 1;
                    }
                }
            }
        }
        //
        for (var i = newEnd - 1; i > newStart; i -- ) {
            if ((j = text.newToOld[i]) != null) {
                if ((text.newToOld[i - 1] == null) && (text.oldToNew[j - 1] == null)) {
                    if (text.newWords[i - 1] == text.oldWords[j - 1]) {
                        text.newToOld[i - 1] = j - 1;
                        text.oldToNew[j - 1] = i - 1;
                    }
                }
            }
        }
        //	
        i = newStart;
        j = oldStart;
        while (i < newEnd) {
            if (text.newToOld[i - 1] != null) {
                j = text.newToOld[i - 1] + 1;
            }
            if ((text.newToOld[i] == null) && (text.oldToNew[j] == null)) {
                var iStart = i;
                var iEnd = i;
                while ((text.newToOld[iEnd] == null) && (iEnd < newEnd)) {
                    iEnd ++ ;
                }
                var iLength = iEnd - iStart;
                var jStart = j;
                var jEnd = j;
                while ((text.oldToNew[jEnd] == null) && (jEnd < oldEnd)) {
                    jEnd ++ ;
                }
                var jLength = jEnd - jStart;
                if ((iLength > 0) && (jLength > 0)) {
                    if ((iLength > 1) || (jLength > 1)) {
                        if ((iStart != newStart) || (iEnd != newEnd) || (jStart != oldStart) || (jEnd != oldEnd)) {
                            this._diff(text, iStart, iEnd, jStart, jEnd, recursionLevel + 1);
                        }
                    }
                }
                i = iEnd;
            } else {
                i ++ ;
            }
        }
        //
        i = newEnd - 1;
        j = oldEnd - 1;
        while (i >= newStart) {
            if (text.newToOld[i + 1] != null) {
                j = text.newToOld[i + 1] - 1;
            }
            if ((text.newToOld[i] == null) && (text.oldToNew[j] == null)) {
                var iStart = i;
                var iEnd = i;
                while ((text.newToOld[iStart] == null) && (iStart >= newStart)) {
                    iStart -- ;
                }
                var iLength = iEnd - iStart;
                var jStart = j;
                var jEnd = j;
                while ((text.oldToNew[jStart] == null) && (jStart >= oldStart)) {
                    jStart -- ;
                }
                var jLength = jEnd - jStart;
                if ((iLength > 0) && (jLength > 0)) {
                    if ((iLength > 1) || (jLength > 1)) {
                        if ((iStart != newStart) || (iEnd != newEnd) || (jStart != oldStart) || (jEnd != oldEnd)) {
                            this._diff(text, iStart, iEnd, jStart, jEnd, recursionLevel + 1);
                        }
                    }
                }
                i = iStart - 1;
            } else {
                i -- ;
            }
        }
        return;
    },
    _loadFile: function(fn) {
        var result={_svc: this, url: fn, title: "", date: "", content: " \n",
        	user: "", pass: "", checkDeleted: null, includes: [], excludes: [],
        	scanImages: null, watchDelay: 0, backupPage: null, ignoreCase: null,
        	ignoreNumbers: null, name: "",
        	get status() {
        		var ret=this._svc.RDF.GetTarget(this._svc._rr(this.url), this._svc._rr(SD_RDF + "status"), true);
        		return ret?ret.QueryInterface(Ci.nsIRDFLiteral).Value:this._svc.RESULT_NEW;
        	},
        	set status(s) {
    			if(!this._svc.RDF.GetTarget(this._svc._rr(this.url), this._svc._rr(NS_RDF + "name"), true)) return;
        		var cur=this.status;
    			if(!this._svc.RDF.GetTarget(this._svc._rr(this.url), this._svc._rr(SD_RDF + "status"), true)) {
			        this._svc.RDF.Assert(this._svc._rr(this.url), this._svc._rr(SD_RDF + "status"), this._svc._rl(s), true);
    			} else {
			        this._svc.RDF.Change(this._svc._rr(this.url), this._svc._rr(SD_RDF + "status"), this._svc.RDF.GetTarget(this._svc._rr(this.url), this._svc._rr(SD_RDF + "status"), true), this._svc._rl(s));
    			}
		        this._svc._observerService.notifyObservers(null, "sitedelta", this.url);		
        	}
        };
        var file = this._sitedeltaDir();
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
            if ( ! dom || dom.firstChild.nodeName != "sitedelta") {
            	var result=this._readFileOld(fn);
            	this._saveFile(fn, result);
            	return this._loadFile(fn);
            }
	        var elem = dom.firstChild.firstChild;
            while (elem) {
                if (elem.firstChild || elem.nodeName == "settings") {
                    if (elem.nodeName == "url") {
                        result.url = elem.firstChild.data;
                        if (elem.hasAttribute("user"))
                            result.user = elem.attributes.getNamedItem("user").firstChild.data;
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
                            result.checkDeleted = elem.attributes.getNamedItem("checkDeleted").firstChild.data == "true";
                        if (elem.hasAttribute("scanImages"))
                            result.scanImages = elem.attributes.getNamedItem("scanImages").firstChild.data == "true";
                        if (elem.hasAttribute("watchEnableScript"))
                            result.backupPage = elem.attributes.getNamedItem("watchEnableScript").firstChild.data == "true";
                        if (elem.hasAttribute("backupPage"))
                            result.backupPage = elem.attributes.getNamedItem("backupPage").firstChild.data == "true";
                        if (elem.hasAttribute("watchDelay"))
                            result.watchDelay = elem.attributes.getNamedItem("watchDelay").firstChild.data;
                        if (elem.hasAttribute("enableWatch")) {
                            if (elem.attributes.getNamedItem("enableWatch").firstChild.data == "true")
                                result.watchDelay = 0;
                            else result.watchDelay =- 1;
                        }
                        if (elem.hasAttribute("ignoreCase"))
                            result.ignoreCase = elem.attributes.getNamedItem("ignoreCase").firstChild.data == "true";
                        if (elem.hasAttribute("ignoreNumbers"))
                            result.ignoreNumbers = elem.attributes.getNamedItem("ignoreNumbers").firstChild.data == "true";
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
    },
    alert: function(text) {
        var cs = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
        cs.logStringMessage("SiteDelta: " + text);
    },
    
    //***************************************************************
    QueryInterface: function(aIID) {
        if ( ! aIID.equals(Ci.nsISupports) && !aIID.equals(Ci.nsIObserver) && !aIID.equals(Ci.nsIDOMNodeFilter))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    }
};

var SiteDeltaFactory = {
    createInstance: function(aOuter, aIID) {
        if (aOuter != null)
            throw Components.results.NS_ERROR_NO_AGGREGATION;
        return(new SiteDelta()).QueryInterface(aIID);
    }
};

var SiteDeltaModule = {
    registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
        aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
    },
    
    unregisterSelf: function(aCompMgr, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
        aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
    },
    
    getClassObject: function(aCompMgr, aCID, aIID) {
        if ( ! aIID.equals(Ci.nsIFactory))
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        if (aCID.equals(CLASS_ID))
            return SiteDeltaFactory;
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },
    
    canUnload: function(aCompMgr) {
        return true;
    }
};

function NSGetModule(aCompMgr, aFileSpec) {
    return SiteDeltaModule;
}
