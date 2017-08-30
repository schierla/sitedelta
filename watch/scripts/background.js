chrome.alarms.onAlarm.addListener(function(alarm) {
    var url = alarm.name;
    pageUtils.pageGetConfig(url, function(config) {
        if(config == null) return;
        watchUtils.watchLoadPage(url, function(doc) {
            var newContent = textUtils.getText(doc, config);
            pageUtils.pageGetContent(url, function(oldContent) {
                if(textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
                    pageUtils.pageGetTitle(url, function(title) {
                        chrome.notifications.create(url, {
                            "type": "basic",
                            "iconUrl": chrome.extension.getURL("icons/changed.svg"),
                            "title": chrome.i18n.getMessage("watchNotificationTitle"),
                            "message": title
                        });
                    });
                    watchUtils.watchSetChanges(url, 1);
                } else {
                    watchUtils.watchSetChanges(url, 0);
                    pageUtils.pageSetNextScan(url, Date.now() + 60000);
                }
            });
        });
    });
});

watchUtils.watchInitAlarms();
