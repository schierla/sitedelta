// page operations
var pageController = {
    pageList: function(scope, callback) {
        ioUtils.list(scope, callback);
    }, 
    pageListChanged: function(scope, callback) {
        pageController.pageList(scope, function(pages) {
            var ret = [], seen = 0;
            for(var i=0; i<pages.length; i++) {
                let page = pages[i];
                pageController.pageGetChanges(scope, page, function(changes) {
                    if(changes > 0) ret.push(page);
                    seen++; if(seen == pages.length) callback(ret);
                });
            }
        });
    },
    pageGetNextScan: function(scope, url, callback) {
        ioUtils.get(scope, url, "nextScan", callback);
    },
    pageGetChanges: function(scope, url, callback) {
        ioUtils.get(scope, url, "changes", callback);
    },
    pageGetTitle: function(scope, url, callback) {
        ioUtils.get(scope, url, "title", callback);
    },    
    pageGetConfig: function(scope, url, callback) {
        ioUtils.get(scope, url, "config", callback);
    },
    pageGetContent: function(scope, url, callback) {
        ioUtils.get(scope, url, "content", callback);
    },
    pageGetConfigProperty: function(scope, url, property, callback) {
        pageController.pageGetConfig(scope, url, function(config) {
            callback(config[property]);
        });
    },
    pageGetOrCreateConfig: function(scope, url, title, callback) {
        pageController.pageGetConfig(scope, url, function(config) {
            if(config == null) {
                pageController.pageCreate(scope, url, title, function() {
                    pageController.pageGetConfig(scope, url, callback);
                });
            } else {
                callback(config);
            }
        });
    },
    pageCreate: function(scope, url, title, callback) {
        var config = defaultConfig();
        var pagetitle = title.replace(/[\n\r]/g, ' ');
        pageController.pageSetTitle(scope, url, pagetitle, function() {
            pageController.pageSetConfig(scope, url, config, function() {
                callback();
            });
        });
    },
    pageDelete: function(scope, url, callback) {
        ioUtils.delete(scope, url, callback);
    },
    pageSetNextScan: function(scope, url, nextScan, callback) {
        ioUtils.put(scope, url, "nextScan", nextScan, callback);
    },
    pageSetChanges: function(scope, url, changes, callback) {
        ioUtils.put(scope, url, "changes", changes, callback);
    },
    pageSetTitle: function(scope, url, title, callback) {
        ioUtils.put(scope, url, "title", title, callback);
    },
    pageSetConfig: function(scope, url, config, callback) {
        ioUtils.put(scope, url, "config", config, callback);
    },
    pageSetContent: function(scope, url, content, callback) {
        ioUtils.put(scope, url, "content", content, callback);
    },
    pageSetConfigProperty: function(scope, url, property, value, callback) {
        pageController.pageGetConfig(scope, url, function(config) {
            config[property] = value;
            pageController.pageSetConfig(scope, url, config, callback);
        });
    },
    pageRemoveInclude: function(scope, url, region, callback) {
        pageController.pageGetConfigProperty(scope, url, "includes", function(includes) {
            for(var i=0; i<includes.length; i++) {
                if(includes[i] == region) {
                    includes.splice(i--, 1);
                }
            }
            if(includes.length == 0) {
                includes.push("/html/body[1]");
            }
            pageController.pageSetConfigProperty(scope, url, "includes", includes, callback);
        });
    },
    pageRemoveExclude: function(scope, url, region, callback) {
        pageController.pageGetConfigProperty(scope, url, "excludes", function(excludes) {
            for(var i=0; i<excludes.length; i++) {
                if(excludes[i] == region) {
                    excludes.splice(i--, 1);
                }
            }
            pageController.pageSetConfigProperty(scope, url, "excludes", excludes, callback);
        });
    },
    pageAddInclude: function(scope, url, xpath, callback) {
        pageController.pageGetConfigProperty(scope, url, "includes", function(includes) {
            includes.push(xpath);
            pageController.pageSetConfigProperty(scope, url, "includes", includes, callback);
        });
    },
    pageAddExclude: function(scope, url, xpath, callback) {
        pageController.pageGetConfigProperty(scope, url, "excludes", function(excludes) {
            excludes.push(xpath);
            pageController.pageSetConfigProperty(scope, url, "excludes", excludes, callback);
        });
    }
};

