chrome.alarms.onAlarm.addListener(function(alarm) {
    var url = alarm.name;
    console.log(url);
    pageUtils.getEffectiveConfig(url, function(config) {
        if(config == null) return;
        watchUtils.loadPage(url, function(doc) {
            var newContent = textUtils.getText(doc, config);
            pageUtils.getContent(url, function(oldContent) {
                if(textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
                    pageUtils.getTitle(url, function(title) {
                        chrome.notifications.create(url, {
                            "type": "basic", 
                            "iconUrl": chrome.extension.getURL("common/icons/changed-64.png"),
                            "title": chrome.i18n.getMessage("watchExtensionName"),
                            "message": title
                        });
                    });
                    watchUtils.setChanges(url, 1);
                } else {
                    watchUtils.setChanges(url, 0);
                }
            });
        });
    });
});

watchUtils.initAlarms();
watchUtils.showChanges();