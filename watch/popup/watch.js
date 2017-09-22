uiUtils.i18n();

document.querySelector("#watch").addEventListener("click", function(e) {
	tabUtils.openResource("watch/show.htm?" + url);
    window.close();
});

document.querySelector("#manage").addEventListener("click", function(e) {
	tabUtils.openResource("watch/manage.htm");
    window.close();
});

document.querySelector("#open").addEventListener("click", function(e) {
    pageUtils.listChanged(function(urls) {
        for(var i=0; i<urls.length; i++) {
            tabUtils.openResource("watch/show.htm?" + urls[i]);
        }
        window.close();
    });
});

document.querySelector("#changed").addEventListener("dblclick", function() {
    if(document.querySelector("#changed").value) {
        tabUtils.openResource("watch/show.htm?" + document.querySelector("#changed").value);
        window.close();
    }
});


function addChangedUrl(url) {
    var list = document.querySelector("#changed");
    var option = document.createElement("option");
    option.appendChild(document.createTextNode(url));
    option.setAttribute("value", url);
    list.appendChild(option);            
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
    switch(state) {
    case PAGESTATE.UNSUPPORTED: 
        document.querySelector("#status").firstChild.data = chrome.i18n.getMessage("watchUnsupported");
        document.querySelector("#watch").style.visibility = "hidden";
        break;
    case PAGESTATE.ENABLED:
        document.querySelector("#status").firstChild.data = chrome.i18n.getMessage("watchEnabled");
        break;
    case PAGESTATE.DISABLED:
        document.querySelector("#status").firstChild.data = chrome.i18n.getMessage("watchDisabled");
        break;
    }
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
