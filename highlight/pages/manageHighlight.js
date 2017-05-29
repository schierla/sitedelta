function load() {
    chrome.storage.local.get(null, function(existing) {
        var pages = document.querySelector("#pages");
        while(pages.firstChild) pages.removeChild(pages.firstChild);
        for(var url in existing) {
            var li = document.createElement("li");
            li.appendChild(document.createTextNode(url));
            pages.appendChild(li);
        }
    });
}

load();