uiUtils.i18n();

document.body.style.minWidth = "40em";
document.querySelector("#icon").src = "../common/icons/neutral.svg";

document.querySelector("#configure").addEventListener("click", function(e) {
    tabUtils.showPageAction(tabId, "../common/icons/neutral.svg", function() {
        window.location.href="highlight.htm";
    });
});

document.querySelector("#managepages").addEventListener("click", function(e) {
	tabUtils.openResource("pages/manageHighlight.htm");
    window.close();
});

document.querySelector("#watchpage").addEventListener("click", function(e) {
	tabUtils.openResource("pages/showWatch.htm?" + url);
    window.close();
});

document.querySelector("#managewatch").addEventListener("click", function(e) {
	tabUtils.openResource("pages/manageWatch.htm");
    window.close();
});

function addChangedUrl(url) {
    var sep = document.querySelector("#watchseparator");
    var div = document.createElement("div");
    div.classList.add("panel-list-item");
    var url = "http://www.google.de";
    div.appendChild(document.createTextNode(url));
    div.addEventListener("click", function() {
        tabUtils.openResource("pages/showWatch.htm?" + url);
    });
    sep.parentElement.insertBefore(div, sep);            
}

function createChangeList() {
    pageUtils.listChanged(function(urls) {
        for(var i=0; i<urls.length; i++) {
            addChangedUrl(urls[i]);
        }
    });
}

var PAGESTATE = {
    UNSUPPORTED: -1,
    DISABLED: 0,
    ENABLED: 1
};

function enableButtons(title, state) {
    document.querySelector("#pagetitle").value = title;
    document.querySelector("#url").value = url;
    switch(state) {
    case PAGESTATE.UNSUPPORTED: 
        document.querySelector("#status").firstChild.data = chrome.i18n.getMessage("popupHighlightUnsupported");
        document.querySelector("#configure").style.visibility = "hidden";
        document.querySelector("#watchpage").style.visibility = "hidden";
        break;
    case PAGESTATE.ENABLED:
        document.querySelector("#status").firstChild.data = chrome.i18n.getMessage("popupHighlightEnabled");
        break;
    case PAGESTATE.DISABLED:
        document.querySelector("#status").firstChild.data = chrome.i18n.getMessage("popupHighlightDisabled");
        break;
    }
    document.querySelector("#panel-loading").style.display = "block";
}

var url = null;
var tabId = null;
var title = null;
tabUtils.getActive(function(tab) {
    tabId = tab.id;
    url = tab.url;
    title = tab.title;
    createChangeList();
    
    if(url.substr(0,4)!="http") {
        enableButtons(title, PAGESTATE.UNSUPPORTED);
        return;
    } 
    pageUtils.getConfig(url, function(existing) {
        if(existing == null) {
            enableButtons(title, PAGESTATE.DISABLED);
        } else {
            enableButtons(title, PAGESTATE.ENABLED);
        }
    });
});
