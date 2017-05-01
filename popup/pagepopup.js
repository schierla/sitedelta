ui.init([
    {tab: "todetails", elem: "details", footer: []}, 
    {tab: "toregions", elem: "regions", footer: []},
    {tab: "toconfig", elem: "config", footer: []}
], 0);

document.body.style.minWidth="40em";
document.querySelector("#icon").src="../icons/neutral.svg";

document.querySelector("#includeadd").addEventListener("click", function(e) {
    chrome.runtime.sendMessage({command: "addIncludeRegion", tab: tabId, url: url}, function() {
        fillStatus({state: STATE.SELECTREGION});     
    });
});
document.querySelector("#excludeadd").addEventListener("click", function(e) {
    chrome.runtime.sendMessage({command: "addExcludeRegion", tab: tabId, url: url}, function() {
        fillStatus({state: STATE.SELECTREGION});     
    });
});
document.querySelector("#pagetitle").addEventListener("change", function(e) {
    io.put(url, {title: document.querySelector("#pagetitle").value});
});

document.querySelector("#checkdeleted").addEventListener("change", function(e) {
    io.get(url, function(data) {
        data.config.checkDeleted = document.querySelector("#checkdeleted").checked;
        io.put(url, data);
    });
});
document.querySelector("#checkimages").addEventListener("change", function(e) {
    io.get(url, function(data) {
        data.config.scanImages = document.querySelector("#checkimages").checked;
        io.put(url, data);
    });
});
document.querySelector("#ignorecase").addEventListener("change", function(e) {
    io.get(url, function(data) {
        data.config.ignoreCase = document.querySelector("#ignorecase").checked;
        io.put(url, data);
    });
});
document.querySelector("#ignorenumbers").addEventListener("change", function(e) {
    io.get(url, function(data) {
        data.config.ignoreNumbers = document.querySelector("#ignorenumbers").checked;
        io.put(url, data);
    });
});
var STATE = {
	LOADED: 1, 
	HIGHLIGHTED: 2,
	SELECTREGION: 3, 
    STORED: 100
};

document.querySelector("#highlight").addEventListener("click", function(e) {
    io.get(url, function(stored) {
        chrome.tabs.sendMessage(tabId, {command: "getContent", config: stored.config}, function(content) {
            if("content" in stored) {
                var old = stored.content;
                io.put(url, {content: content});
                chrome.tabs.sendMessage(tabId, {command: "highlightChanges", config: stored.config, content: old}, function(status) {
                    fillStatus(status);
                });
            } else {
                io.put(url, {content: content}, function() {});
                fillStatus({state: STATE.STORED});
            }
        });
    });
});

document.querySelector("#delete").addEventListener("click", function(e) {
    io.delete(url, function() {
        chrome.pageAction.hide(tabId, function() {
            window.close(); 
        });
    });
});

function checkCheckbox(checked, id) {
    var elem = document.querySelector("#" + id);
    if(checked == true) elem.setAttribute("checked", "checked"); else elem.removeAttribute("checked");
}

function fillUI(url, data) {
    document.querySelector("#url").value = url;
    document.querySelector("#pagetitle").value = data.title;
    checkCheckbox(data.config.checkDeleted, "checkdeleted");
    checkCheckbox(data.config.scanImages, "checkimages");
    checkCheckbox(data.config.ignoreCase, "ignorecase");
    checkCheckbox(data.config.ignoreNumbers, "ignorenumbers");

    var incelem = document.querySelector("#includeadd");
    for(var i=0; i<data.config.includes.length; i++) {
        var node = createRegionNode(data.config.includes[i], data.config.includeRegion);
        node.addEventListener("click", function(e) { removeIncludeRegion(e.target.firstChild.data, function() {window.close(); }); });        
        incelem.parentElement.insertBefore(node, incelem);
    }

    var excelem = document.querySelector("#excludeadd");
    for(var i=0; i<data.config.excludes.length; i++) {
        var node = createRegionNode(data.config.excludes[i], data.config.excludeRegion);
        node.addEventListener("click", function(e) { removeExcludeRegion(e.target.firstChild.data, function() {window.close(); }); });
        excelem.parentElement.insertBefore(node, excelem);
    }
}

function createRegionNode(xpath, color) {
    var node = document.createElement("div");
    node.classList.add("panel-list-item");
    var text = document.createElement("div");
    text.classList.add("text");
    node.appendChild(text);
    text.appendChild(document.createTextNode(xpath));
    var del = document.createElement("div");
    del.classList.add("text-shortcut");
    del.appendChild(document.createTextNode(chrome.i18n.getMessage("pagepopupRegionsRemove")));
    node.appendChild(del);
    node.addEventListener("mouseover", function(e) { chrome.tabs.sendMessage(tabId, {command: "showOutline", xpath: e.target.firstChild.data, color: color}); });
    node.addEventListener("mouseout", function(e) { chrome.tabs.sendMessage(tabId, {command: "removeOutline"}); });
    return node;
}

function removeIncludeRegion(region, callback) {
    chrome.tabs.sendMessage(tabId, {command: "removeOutline"});
    io.get(url, function(data) {
        for(var i=0; i<data.config.includes.length; i++) {
            if(data.config.includes[i] == region) {
                data.config.includes.splice(i--, 1);
            }
        }
        if(data.config.includes.length == 0) {
            data.config.includes.push("/html/body[1]");
        }
        io.put(url, data, callback);
    });
}

function removeExcludeRegion(region, callback) {
    chrome.tabs.sendMessage(tabId, {command: "removeOutline"});
    io.get(url, function(data) {
        for(var i=0; i<data.config.excludes.length; i++) {
            if(data.config.excludes[i] == region) {
                data.config.excludes.splice(i--, 1);
            }
        }
        io.put(url, data, callback);
    });
}

function fillStatus(status) {
    switch(status.state) {
    case STATE.LOADED:
        document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("pagepopupTitle");
        document.querySelector("#panel-contents").style.display='block';
        break;
    case STATE.HIGHLIGHTED:
        if(status.changes == 0) {
            document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("pagepopupTitleNoChanges");
            document.querySelector("#highlight").style.visibility='hidden';
        } else {
            document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("pagepopupTitleChanges", [status.current, status.changes]);
        }
        document.querySelector("#panel-contents").style.display='none';
        break;
    case STATE.SELECTREGION:
        document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("pagepopupTitleSelectRegion");
        document.querySelector("#panel-contents").style.display='none';
        document.querySelector("#highlight").style.visibility='hidden';
        break;
    case STATE.STORED:
        document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("pagepopupTitleStored");
        document.querySelector("#panel-contents").style.display='none';
        document.querySelector("#highlight").style.visibility='hidden';
        break;
    }
    document.querySelector("#panel-loading").style.display = "block";
}


var tabId = null;
var url = null;
chrome.tabs.query({active:true, currentWindow: true}, function(tabs) {
    tabId = tabs[0].id;
    url = tabs[0].url;
    if(url.substr(0,4)!="http") {
        window.close(); 
        return; 
    }

    chrome.tabs.sendMessage(tabId, {command: "getStatus"}, function(status) {
        if(chrome.runtime.lastError) {
            chrome.tabs.executeScript(tabId, {file: "/content/contentscript.js"});
            fillStatus({state: STATE.LOADED});
        } else {
            fillStatus(status);
        }
    });

    io.get(url, function(existing) {
        if(existing == null) {
            var config = defaultConfig();
            var title = tabs[0].title.replace(/[\n\r]/g, ' ');
            var set = {config: config, title: title};
            io.put(url, set);
            fillUI(url, set);
        } else {
            fillUI(url, existing);
        }
    });
});
