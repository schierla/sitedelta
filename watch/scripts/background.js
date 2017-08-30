chrome.alarms.onAlarm.addListener(function(alarm) {
    var url = alarm.name;
    pageUtils.getConfig(url, function(config) {
        if(config == null) return;
        watchUtils.loadPage(url, function(doc) {
            var newContent = textUtils.getText(doc, config);
            pageUtils.getContent(url, function(oldContent) {
                if(textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
                    pageUtils.getTitle(url, function(title) {
                        chrome.notifications.create(url, {
                            "type": "basic",
                            "iconUrl": chrome.extension.getURL("icons/changed.svg"),
                            "title": chrome.i18n.getMessage("watchNotificationTitle"),
                            "message": title
                        });
                    });
                    watchUtils.setChanges(url, 1);
                } else {
                    watchUtils.setChanges(url, 0);
                    pageUtils.setNextScan(url, Date.now() + 60000);
                }
            });
        });
    });
});

watchUtils.initAlarms();
