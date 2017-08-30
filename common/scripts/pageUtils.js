// page operations
var pageUtils = {
    pageList: function(callback) {
        ioUtils.findInIndex((url, status) => url, callback);
    }, 
    pageListChanged: function(callback) {
        ioUtils.findInIndex((url, status) => url, callback);
    }, 
    pageGetStatus: function(url, callback) {
        ioUtils.findInIndex((furl, fstatus) => (url == furl ? fstatus : null), 
                (result) => result.length > 0 ? callback(result[0]) : callback({}));
    },
    pageGetChanges: function(url, callback) {
        pageUtils.pageGetStatus(url, 
            (status) => callback(status["changes"]));
    },
    pageGetNextScan: function(url, callback) {
        pageUtils.pageGetStatus(url, 
            (status) => callback(status["nextScan"]));
    },
    pageGetTitle: function(url, callback) {
        ioUtils.get(url, "title", callback);
    },    
    pageGetConfig: function(url, callback) {
        ioUtils.get(url, "config", callback);
    },
    pageGetContent: function(url, callback) {
        ioUtils.get(url, "content", callback);
    },
    pageGetConfigProperty: function(url, property, callback) {
        pageUtils.pageGetConfig(url, (config) => callback(config[property]));
    },
    pageGetOrDefaultConfig: function(url, callback) {
        pageGetConfig(url, (config) => {
            if(config == null) callback(defaultConfig());
            else callback(config);
        });
    },
    pageGetOrCreateConfig: function(url, title, callback) {
        pageUtils.pageGetConfig(url, function(config) {
            if(config == null) {
                pageUtils.pageCreate(url, title, 
                    () => pageUtils.pageGetConfig(url, callback));
            } else {
                callback(config);
            }
        });
    },
    pageCreate: function(url, title, callback) {
        var config = defaultConfig();
        var pagetitle = title.replace(/[\n\r]/g, ' ');
        pageUtils.pageSetStatus(url, {}, 
            () => pageUtils.pageSetTitle(url, pagetitle, 
                () => pageUtils.pageSetConfig(url, config, 
                    () => callback())));
    },
    pageDelete: function(url, callback) {
        ioUtils.delete(url, callback);
    },
    pageSetStatus: function(url, status, callback) {
        ioUtils.setInIndex(url, status, callback);
    },
    pageSetNextScan: function(url, nextScan, callback) {
        pageUtils.pageGetStatus(url, 
            (status) => {status["nextScan"] = nextScan; pageUtils.pageSetStatus(url, status, callback);});
    },
    pageSetChanges: function(url, changes, callback) {
        pageUtils.pageGetStatus(url, 
            (status) => {status["changes"] = changes; pageUtils.pageSetStatus(url, status, callback);});
    },
    pageSetTitle: function(url, title, callback) {
        ioUtils.put(url, "title", title, callback);
    },
    pageSetConfig: function(url, config, callback) {
        ioUtils.put(url, "config", config, callback);
    },
    pageSetContent: function(url, content, callback) {
        ioUtils.put(url, "content", content, callback);
    },
    pageSetConfigProperty: function(url, property, value, callback) {
        pageUtils.pageGetConfig(url, 
            (config) => { config[property] = value; pageUtils.pageSetConfig(url, config, callback); });
    },
    pageRemoveInclude: function(url, region, callback) {
        pageUtils.pageGetConfigProperty(url, "includes", function(includes) {
            var newlist = [];
            for(var i=0; i<includes.length; i++) {
                if(includes[i] != region) {
                    newlist.push(includes[i]);
                }
            }
            if(newlist.length == 0) {
                newlist.push("/html/body[1]");
            }
            pageUtils.pageSetConfigProperty(url, "includes", newlist, callback);
        });
    },
    pageRemoveExclude: function(url, region, callback) {
        pageUtils.pageGetConfigProperty(url, "excludes", function(excludes) {
            var newlist = [];
            for(var i=0; i<excludes.length; i++) {
                if(excludes[i] != region) {
                    newlist.push(excludes[i]);
                }
            }
            pageUtils.pageSetConfigProperty(url, "excludes", newlist, callback);
        });
    },
    pageAddInclude: function(url, xpath, callback) {
        if(xpath == null) return;
        pageUtils.pageGetConfigProperty(url, "includes", function(includes) {
            includes.push(xpath);
            pageUtils.pageSetConfigProperty(url, "includes", includes, callback);
        });
    },
    pageAddExclude: function(url, xpath, callback) {
        if(xpath == null) return;
        pageUtils.pageGetConfigProperty(url, "excludes", function(excludes) {
            excludes.push(xpath);
            pageUtils.pageSetConfigProperty(url, "excludes", excludes, callback);
        });
    }
};

