chrome.alarms.onAlarm.addListener(function(alarm) {
    var url = alarm.name;
    pageController.pageGetConfig(SCOPE_WATCH, url, function(config) {
        watchController.watchLoadPage(url, function(doc) {
            var newContent = textUtils.getText(doc, config);
            pageController.pageGetContent(SCOPE_WATCH, url, function(oldContent) {
                if(textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
                    pageController.pageGetTitle(SCOPE_WATCH, url, function(title) {
                        chrome.notifications.create(url, {
                            "type": "basic",
                            "iconUrl": chrome.extension.getURL("icons/changed.svg"),
                            "title": chrome.i18n.getMessage("watchNotificationTitle"),
                            "message": title
                        });
                    });
                    watchController.watchSetChanges(url, 1);
                } else {
                    watchController.watchSetChanges(url, 0);
                    pageController.pageSetNextScan(SCOPE_WATCH, url, Date.now() + 60000);
                }
            });
        });
    });
});

watchController.watchInitAlarms();
