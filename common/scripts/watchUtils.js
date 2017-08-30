// watch operations
var watchUtils = {
    watchInitAlarms: function() {
        pageUtils.pageList(function(pages) {
            for(var i=0; i<pages.length; i++) {
                watchUtils.watchUpdateAlarm(pages[i]);
            }
        });
    },
    watchUpdateAlarm(url) {
        pageUtils.pageGetNextScan(url,
            (nextScan) => chrome.alarms.create(url, {when: nextScan}));
    },

    watchLoadPage: function(url, callback) {
        watchUtils._watchDownloadPage(url, "", function(mime, content) {
            watchUtils._watchParsePage(url, mime, content, callback);
        });
    },

    watchSetChanges: function(url, changes) {
        pageUtils.pageSetChanges(url, changes, function() {
            pageUtils.pageListChanged(function(changed) {
                if(changed > 0) 
                    chrome.browserAction.setBadgeText({text:changed.length});
                else 
                    chrome.browserAction.setBadgeText({text:""});
            });
        });
    },

    _watchDownloadPage: function(url, mime, contentCallback) {
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
    _watchParsePage: function(url, mime, content, documentCallback) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(content, "text/html");
        if(mime.toLowerCase().indexOf("charset")<0) {
            var metas = doc.getElementsByTagName("meta");
            for(var i=0; i<metas.length; i++) {
                if(metas.item(i).getAttribute("http-equiv").toLowerCase()=="content-type") {
                    mime = metas.item(i).getAttribute("content");
                    if(mime.toLowerCase().indexOf("charset") > 0) {
                        watchUtils._watchDownloadPage(url, mime, function(mime, content) {
                            watchUtils._watchParsePage(url, mime, content, documentCallback);
                        });
                        return;
                    }
                }
            }
        }
        documentCallback(doc);
    }

};