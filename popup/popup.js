ui.init([
    {tab:"topage",elem:"page",footer:["managepages", "configure"]},
    {tab:"towatch",elem:"watch",footer:["managewatch", "watchpage"]}
], 0);

document.body.style.minWidth="40em";
document.querySelector("#icon").src="../icons/neutral.svg";

document.querySelector("#configure").addEventListener("click", function(e) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        chrome.pageAction.setIcon({path: "../icons/neutral.svg", tabId: tabs[0].id});
        chrome.pageAction.show(tabs[0].id);
        window.location.href="pagepopup.htm";
    });
});

document.querySelector("#managepages").addEventListener("click", function(e) {
	chrome.tabs.create({url: chrome.runtime.getURL("res/pages.htm")});
    window.close();
});

document.querySelector("#managewatch").addEventListener("click", function(e) {
	chrome.tabs.create({url: chrome.runtime.getURL("res/watch.htm")});
    window.close();
});

function enableButtons(title, state) {
    document.querySelector("#enabled").style.display = (state==1?'block':'none');
    document.querySelector("#disabled").style.display = (state==0?'block':'none');
    document.querySelector("#unsupported").style.display = (state==-1?'block':'none');
    document.querySelector("#configure").style.visibility = (state==-1?'hidden':'visible');
    document.querySelector("#watchpage").style.visibility = (state==-1?'hidden':'visible');
    var titleElem = document.querySelector("#title");
    while(titleElem.firstChild) titleElem.removeChild(titleElem.firstChild);
    titleElem.appendChild(document.createTextNode(title));
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if(tabs[0].url.substr(0,4)!="http") {
        enableButtons(tabs[0].title, -1);
        return;
    } 
    io.get(tabs[0].url, function(existing) {
        if(existing == null) {
            enableButtons(tabs[0].title, 1);
        } else {
            enableButtons(tabs[0].title, 0);
        }
    });
});