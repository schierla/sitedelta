function load() {
    ioUtils.listIndex(function(index) {
        var pages = document.querySelector("#pages");
        while(pages.firstChild) pages.removeChild(pages.firstChild);
        for(var url in index) {
            if(url == null) continue;
            addItem(url);
        }
    });
}
function addItem(url) {
    ioUtils.get(url, "title", function(title) {
        var item = document.createElement("option");
        item.setAttribute("value", url);
        item.setAttribute("title", url);
        item.appendChild(document.createTextNode(title));
        pages.appendChild(item);    
    });
}

document.querySelector("#delete").addEventListener("click", function(e) {
    if(document.querySelector("#pages").value != "") {
        ioUtils.delete(document.querySelector("#pages").value, load);
    }
});

document.querySelector("#open").addEventListener("click", function(e) {
    if(document.querySelector("#pages").value != "") {
        chrome.tabs.create({url: document.querySelector("#pages").value});
    }
});

document.querySelector("#pages").addEventListener("dblclick", function(e) {
    if(document.querySelector("#pages").value != "") {
        chrome.tabs.create({url: document.querySelector("#pages").value});
    }
});

uiUtils.i18n();
load();
