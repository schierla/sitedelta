uiUtils.init([
    {tab: "todetails", elem: "details", footer: []}, 
    {tab: "toregions", elem: "regions", footer: []},
    {tab: "toconfig", elem: "config", footer: []}
], 0);

document.body.style.minWidth="40em";
document.querySelector("#icon").src="../icons/neutral.svg";

document.querySelector("#includeadd").addEventListener("click", function(e) {
    tabController.tabSelectInclude(tabId, url, function() {
        fillStatus({state: STATE.SELECTREGION});     
    });
});
document.querySelector("#excludeadd").addEventListener("click", function(e) {
    tabController.tabSelectExclude(tabId, url, function() {
        fillStatus({state: STATE.SELECTREGION});     
    });
});
document.querySelector("#pagetitle").addEventListener("change", function(e) {
    pageController.pageSetTitle(url, document.querySelector("#pagetitle").value, function() {});
});

document.querySelector("#checkdeleted").addEventListener("change", function(e) {
    pageController.pageSetProperty(url, "checkDeleted", document.querySelector("#checkdeleted").checked, function() {});
});
document.querySelector("#checkimages").addEventListener("change", function(e) {
    pageController.pageSetProperty(url, "scanImages", document.querySelector("#checkimages").checked, function() {});
});
document.querySelector("#ignorecase").addEventListener("change", function(e) {
    pageController.pageSetProperty(url, "ignoreCase", document.querySelector("#ignorecase").checked, function() {});
});
document.querySelector("#ignorenumbers").addEventListener("change", function(e) {
    pageController.pageSetProperty(url, "ignoreNumbers", document.querySelector("#ignorenumbers").checked, function() {});
});

var STATE = {
	LOADED: 1, 
	HIGHLIGHTED: 2,
	SELECTREGION: 3
};

document.querySelector("#highlight").addEventListener("click", function(e) {
    tabController.tabHighlightChanges(tabId, url, function(status) {
        fillStatus(status);
    });
});

document.querySelector("#delete").addEventListener("click", function(e) {
    tabController.tabHidePageAction(tabId, function() {
        pageController.pageDelete(url, function() {
            window.close(); 
        });
    });
});

function checkCheckbox(checked, id) {
    var elem = document.querySelector("#" + id);
    if(checked == true) elem.setAttribute("checked", "checked"); else elem.removeAttribute("checked");
}

function fillUI(data) {
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
    node.addEventListener("mouseover", function(e) { 
        tabController.tabShowOutline(tabId, xpath, color, function() {}); 
    });
    node.addEventListener("mouseout", function(e) { 
        tabController.tabRemoveOutline(tabId, function() {});
    });
    return node;
}

function removeIncludeRegion(region, callback) {
    tabController.tabRemoveOutline(tabId, function() {
        pageController.pageRemoveInclude(url, region, callback);
    });
}

function removeExcludeRegion(region, callback) {
    tabController.tabRemoveOutline(tabId, function() {
        pageController.pageRemoveExclude(url, region, callback);
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
    }
    document.querySelector("#panel-loading").style.display = "block";
}

var tabId = null;
var url = null;

tabController.tabGetActive(function(tab) {
    tabId = tab.id; url = tab.url;
    if(url.substr(0,4)!="http") {
        window.close(); 
        return; 
    }

    tabController.tabGetStatus(tabId, fillStatus);
    pageController.pageGetOrCreate(url, tab.title, fillUI);
});