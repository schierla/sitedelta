// page operations
var pageController = {
    pageGet: function(url, callback) {
        ioUtils.get(url, callback);
    },
    pageGetOrCreate: function(url, title, callback) {
        ioUtils.get(url, function(existing) {
            if(existing == null) {
                var config = defaultConfig();
                var pagetitle = title.replace(/[\n\r]/g, ' ');
                var set = {config: config, title: pagetitle};
                ioUtils.put(url, set);
                callback(set);
            } else {
                callback(existing);
            }
        });
    },
    pageDelete: function(url, callback) {
        ioUtils.delete(url, callback);
    },
    pageSetTitle: function(url, title, callback) {
        ioUtils.put(url, {title: title}, callback);
    },
    pageSetProperty: function(url, property, value, callback) {
        ioUtils.get(url, function(data) {
            data.config[property] = value;
            ioUtils.put(url, data, callback);
        });
    },
    pageRemoveInclude: function(url, region, callback) {
        ioUtils.get(url, function(data) {
            for(var i=0; i<data.config.includes.length; i++) {
                if(data.config.includes[i] == region) {
                    data.config.includes.splice(i--, 1);
                }
            }
            if(data.config.includes.length == 0) {
                data.config.includes.push("/html/body[1]");
            }
            ioUtils.put(url, data, callback);
        });
    },
    pageRemoveExclude: function(url, region, callback) {
        ioUtils.get(url, function(data) {
            for(var i=0; i<data.config.excludes.length; i++) {
                if(data.config.excludes[i] == region) {
                    data.config.excludes.splice(i--, 1);
                }
            }
            ioUtils.put(url, data, callback);
        });
    },
    pageAddInclude: function(url, xpath, callback) {
        ioUtils.get(url, function(data) {
            data.config.includes.push(xpath);
            ioUtils.put(url, data, callback);
        });
    },
    pageAddExclude: function(url, xpath, callback) {
        ioUtils.get(url, function(data) {
            data.config.excludes.push(xpath);
            ioUtils.put(url, data, callback);
        });
    }
};

