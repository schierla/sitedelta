uiUtils.init([
    {tab:"topage",elem:"page",footer:["managepages", "configure"]},
    {tab:"towatch",elem:"watch",footer:["managewatch", "watchpage"]}
], 0);

document.body.style.minWidth = "40em";
document.querySelector("#icon").src = "../icons/neutral.svg";

document.querySelector("#configure").addEventListener("click", function(e) {
    tabController.tabShowPageAction(tabId, "../icons/neutral.svg", function() {
        window.location.href="pagepopup.htm";
    });
});

document.querySelector("#managepages").addEventListener("click", function(e) {
	openResourceTab("res/pages.htm");
    window.close();
});

document.querySelector("#managewatch").addEventListener("click", function(e) {
	openResourceTab("res/watch.htm");
    window.close();
});

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
tabController.tabGetActive(function(tab) {
    tabId = tab.id;
    url = tab.url;
    title = tab.title;
    if(url.substr(0,4)!="http") {
        enableButtons(title, PAGESTATE.UNSUPPORTED);
        return;
    } 
    pageController.pageGet(url, function(existing) {
        if(existing == null) {
            enableButtons(title, PAGESTATE.DISABLED);
        } else {
            enableButtons(title, PAGESTATE.ENABLED);
        }
    });
});
