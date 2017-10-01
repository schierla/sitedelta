var transferUtils = {

    importConfig: function (config, hiddenFields, callback) {
        configUtils.getDefaultConfig(oldConfig => {
            var update = {};
            var imported = 0, skipped = 0;
            for (var key in config) {
                if (hiddenFields.indexOf(key) >= 0) continue;
                if (key in oldConfig) {
                    if (oldConfig[key] == config[key]) {
                        skipped++;
                    } else {
                        update[key] = config[key];
                        imported++;
                    }
                }
            }
            configUtils.setDefaultConfigProperties(update, () => callback(imported, skipped));
        });
    },

    importPages: function (pages, callback, imported, skipped) {
        if (imported === undefined) {
            return transferUtils.importPages(pages, callback, 0, 0);
        }
        if (pages.length == 0) {
            if (callback !== undefined) callback(imported, skipped);
        } else {
            var page = pages.shift();
            pageUtils.getConfig(page.url, (config) => {
                if (config !== null) 
                    return transferUtils.importPages(pages, callback, imported, skipped + 1);
                pageUtils.create(page.url, page.title, () => {
                    var settings = { "includes": page.includes, "excludes": page.excludes };
                    if (page.includes !== undefined) settings["incudes"] = page.includes;
                    if (page.excludes !== undefined) settings["excludes"] = page.excludes;
                    if (page.checkDeleted !== undefined) settings["checkDeleted"] = page.checkDeleted;
                    if (page.scanImages !== undefined) settings["scanImages"] = page.scanImages;
                    if (page.ignoreCase !== undefined) settings["ignoreCase"] = page.ignoreCase;
                    if (page.ignoreNumbers !== undefined) settings["ignoreNumbers"] = page.ignoreNumbers;
                    if (page.watchDelay !== undefined) settings["watchDelay"] = page.watchDelay;

                    pageUtils.setConfig(page.url, settings, () => {
                        pageUtils.setContent(page.url, page.content, () => {
                            pageUtils.setChanges(page.url, -1, () => {
                                transferUtils.importPages(pages, callback, imported + 1, skipped);
                            });
                        });
                    })
                });
            });
        }
    },

    exportConfig: function (hiddenFields, callback) {
        configUtils.getDefaultConfig(config => {
            var send = {};
            for (var key in config) {
                if (hiddenFields.indexOf(key) >= 0) continue;
                send[key] = config[key];
            }
            callback(send);
        });
    },

    exportPages: function (callback, urls, pages) {
        if (urls === undefined) {
            pageUtils.list(urls => {
                transferUtils.exportPages(callback, urls, []);
            });
            return;
        }
        if (urls.length == 0) {
            return callback(pages);
        }
        var url = urls.shift();
        pageUtils.getTitle(url, title => {
            pageUtils.getConfig(url, config => {
                pageUtils.getContent(url, content => {
                    var page = { url: url, title: title, content: content };
                    for (var key in config) {
                        page[key] = config[key];
                    }
                    pages.push(page);
                    transferUtils.exportPages(callback, urls, pages);
                });
            });
        });
    }
}