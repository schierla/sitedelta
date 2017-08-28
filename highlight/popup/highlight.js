uiUtils.i18n();

document.querySelector("#setup").addEventListener("click", function(e) {
    chrome.runtime.openOptionsPage();
    window.close();
});

document.querySelector("#includeadd").addEventListener("click", function(e) {
    tabController.tabSelectInclude(tabId, url, function() {
        fillStatus({state: STATE.SELECTREGION});     
    });
});

document.querySelector("#includedel").addEventListener("click", function(e) {
    var region = document.querySelector("#include").value;
    tabController.tabRemoveOutline(tabId, function() {
        pageController.pageRemoveInclude(url, region, function() {
            pageController.pageGetConfig(url, function(pageconfig) {
                showConfig(pageconfig);
                config = pageconfig;
            });
        });
    });
});

document.querySelector("#include").addEventListener("change", function(e) {
    var region = document.querySelector("#include").value;
    document.querySelector("#excludedel").setAttribute("disabled", "disabled"); 
    document.querySelector("#includedel").setAttribute("disabled", "disabled"); 
    if(region == null) return;
    document.querySelector("#exclude").value = null;
    document.querySelector("#includedel").removeAttribute("disabled");    
    tabController.tabShowOutline(tabId, region, config.includeRegion, function() {}); 
});

   
document.querySelector("#excludeadd").addEventListener("click", function(e) {
    tabController.tabSelectExclude(tabId, url, function() {
        fillStatus({state: STATE.SELECTREGION});     
    });
});

document.querySelector("#excludedel").addEventListener("click", function(e) {
    var region = document.querySelector("#exclude").value;
    tabController.tabRemoveOutline(tabId, function() {
        pageController.pageRemoveExclude(url, region, function() {
            pageController.pageGetConfig(url, function(pageconfig) {
                showConfig(pageconfig);
                config = pageconfig;
            });
        });
    });
});

document.querySelector("#exclude").addEventListener("change", function(e) {
    var region = document.querySelector("#exclude").value;
    document.querySelector("#excludedel").setAttribute("disabled", "disabled"); 
    document.querySelector("#includedel").setAttribute("disabled", "disabled"); 
    if(region == null) return;
    document.querySelector("#include").value = null;
    document.querySelector("#excludedel").removeAttribute("disabled");
    tabController.tabShowOutline(tabId, region, config.excludeRegion, function() {}); 
});

document.querySelector("#pagetitle").addEventListener("change", function(e) {
    pageController.pageSetTitle(url, document.querySelector("#pagetitle").value, function() {});
});

document.querySelector("#checkdeleted").addEventListener("change", function(e) {
    pageController.pageSetConfigProperty(url, "checkDeleted", document.querySelector("#checkdeleted").checked, function() {});
});
document.querySelector("#checkimages").addEventListener("change", function(e) {
    pageController.pageSetConfigProperty(url, "scanImages", document.querySelector("#checkimages").checked, function() {});
});
document.querySelector("#ignorecase").addEventListener("change", function(e) {
    pageController.pageSetConfigProperty(url, "ignoreCase", document.querySelector("#ignorecase").checked, function() {});
});
document.querySelector("#ignorenumbers").addEventListener("change", function(e) {
    pageController.pageSetConfigProperty(url, "ignoreNumbers", document.querySelector("#ignorenumbers").checked, function() {});
});

document.querySelector("#delete").addEventListener("click", function(e) {
    tabController.tabShowIcon(tabId, "/common/icons/neutral.svg", function() {
        pageController.pageDelete(url, function() {
            window.close(); 
        });
    });
});

document.querySelector("#highlight").addEventListener("click", function(e) {
    tabController.tabHighlightChanges(tabId, url, function(status) {
        fillStatus(status);
    });
});

document.querySelector("#expand").addEventListener("click", function(e) {
    document.querySelector("#config").style.display = 'block';
    document.querySelector("#settings").style.display='block';    
});

var STATE = {
	LOADED: 1, 
	HIGHLIGHTED: 2,
	SELECTREGION: 3
};

function checkCheckbox(checked, id) {
    var elem = document.querySelector("#" + id);
    if(checked == true) elem.setAttribute("checked", "checked"); else elem.removeAttribute("checked");
}

function showTitle(title) {
    document.querySelector("#url").value = url;
    document.querySelector("#pagetitle").value = title;
}

function showConfig(config) {
    checkCheckbox(config.checkDeleted, "checkdeleted");
    checkCheckbox(config.scanImages, "checkimages");
    checkCheckbox(config.ignoreCase, "ignorecase");
    checkCheckbox(config.ignoreNumbers, "ignorenumbers");

    document.querySelector("#excludedel").setAttribute("disabled", "disabled"); 
    document.querySelector("#includedel").setAttribute("disabled", "disabled"); 

    var incelem = document.querySelector("#include");
    while(incelem.firstChild) incelem.removeChild(incelem.firstChild);
    console.log(config.includes);
    for(var i=0; i<config.includes.length; i++) {
        var node = createRegionNode(config.includes[i]);
        incelem.appendChild(node);
    }

    var excelem = document.querySelector("#exclude");
    while(excelem.firstChild) excelem.removeChild(excelem.firstChild);
    for(var i=0; i<config.excludes.length; i++) {
        var node = createRegionNode(config.excludes[i], config.excludeRegion);
        excelem.appendChild(node);
    }
}

function createRegionNode(xpath, color) {
    var node = document.createElement("option");
    node.setAttribute("value", xpath);
    node.appendChild(document.createTextNode(xpath));
    return node;
}

function fillStatus(status) {
    switch(status.state) {
    case STATE.LOADED:
        document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitle");
        document.querySelector("#expand").style.display='block';
        break;
    case STATE.HIGHLIGHTED:
        if(status.changes == 0) {
            tabController.tabShowIcon(tabId, "/common/icons/unchanged.svg", function() {});
            document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleNoChanges");
            document.querySelector("#highlight").style.visibility='hidden';
        } else {
            tabController.tabShowIcon(tabId, "/common/icons/changed.svg", function() {});
            document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleChanges", [status.current, status.changes]);
        }
        document.querySelector("#expand").style.display='none';
        break;
    case STATE.SELECTREGION:
        document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleSelectRegion");
        document.querySelector("#expand").style.display='none';
        document.querySelector("#highlight").style.visibility='hidden';
        break;
    }
    document.querySelector("#config").style.display='none';
    document.querySelector("#settings").style.display='none';
}

var tabId = null;
var url = null;
var config = null;

tabController.tabGetActive(function(tab) {
    tabId = tab.id; url = tab.url;
    if(url.substr(0,4)!="http") {
        document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleUnavailable");
        document.querySelector("#settings").style.display="block";
        document.querySelector("#buttons").style.display="none";
        document.querySelector("#textfields").style.display="none";
        document.querySelector("#setup").classList.add("default");
        return;
    }

    tabController.tabGetStatus(tabId, fillStatus);
    pageController.pageGetOrCreateConfig(url, tab.title, function(pageconfig) {
        pageController.pageGetTitle(url, showTitle);
        showConfig(pageconfig);
        config = pageconfig;
    });
});
