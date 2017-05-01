ui.init([
    {tab:"topage",elem:"page",footer:["managepages", "configure"]},
    {tab:"towatch",elem:"watch",footer:["managewatch", "watchpage"]}
], 0);

document.body.style.minWidth = "40em";
document.querySelector("#icon").src = "../icons/neutral.svg";

document.querySelector("#configure").addEventListener("click", function(e) {
    chrome.pageAction.setIcon({path: "../icons/neutral.svg", tabId: tabId});
    chrome.pageAction.show(tabId);
    window.location.href="pagepopup.htm";
});

document.querySelector("#managepages").addEventListener("click", function(e) {
	chrome.tabs.create({url: chrome.runtime.getURL("res/pages.htm")});
    window.close();
});

document.querySelector("#managewatch").addEventListener("click", function(e) {
	chrome.tabs.create({url: chrome.runtime.getURL("res/watch.htm")});
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
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    tabId = tabs[0].id;
    url = tabs[0].url;
    title = tabs[0].title;
    if(url.substr(0,4)!="http") {
        enableButtons(title, PAGESTATE.UNSUPPORTED);
        return;
    } 
    io.get(url, function(existing) {
        if(existing == null) {
            enableButtons(title, PAGESTATE.DISABLED);
        } else {
            enableButtons(title, PAGESTATE.ENABLED);
        }
    });
});