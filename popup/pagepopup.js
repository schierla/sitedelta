ui.init([
    {tab: "todetails", elem: "details", footer: []}, 
    {tab: "toregions", elem: "regions", footer: []},
    {tab: "toconfig", elem: "config", footer: []}
], 0);

document.body.style.minWidth="40em";
document.querySelector("#icon").src="../icons/neutral.svg";


document.querySelector("#highlight").addEventListener("click", function(e) {
    chrome.tabs.query({active:true, currentWindow: true}, function(tabs) {
        chrome.tabs.executeScript(tabs[0].id, {file: "/content/contentscript.js"}, function(done) {
            io.get(tabs[0].url, function(stored) {
                if(stored == null) {
                    console.log("stored is null");
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, {command: "getContent", config: stored.config}, function(content) {
                        if("content" in stored) {
                            if(content == stored.content) {
                                // unchanged
                                console.log("unchanged");
                            } else {
                                // changed
                                console.log("changed");
                                var set = {}; set[url] = content;
                                var old = stored.content;
                                io.put(tabs[0].url, {content: content});
                                chrome.tabs.sendMessage(tabs[0].id, {command: "highlightChanges", config: stored.config, content: old});
                            }         
                        } else {
                            io.put(tabs[0].url, {content: content}, function() {});
                            console.log("stored");
                        }
                    });
                }
            });
        });
    });
});

document.querySelector("#delete").addEventListener("click", function(e) {
    browser.tabs.query({currentWindow: true, active: true}).then(function(tabs) {
        chrome.pageAction.hide(tabs[0].id);
    });
    io.delete(document.querySelector("#url").value, function() {
        window.close(); 
    });
});

function checkCheckbox(checked, id) {
    var elem = document.querySelector("#" + id);
    if(checked == true) elem.setAttribute("checked", "checked"); else elem.removeAttribute("checked");
}

function fillUI(url, data) {
    document.querySelector("#url").value = url;
    document.querySelector("#title").value = data.title;
    checkCheckbox(data.config.checkDeleted, "checkdeleted");
    checkCheckbox(data.config.scanImages, "checkimages");
    checkCheckbox(data.config.ignoreCase, "ignorecase");
    checkCheckbox(data.config.ignoreNumbers, "ignorenumbers");
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var url = tabs[0].url;
    if(url.substr(0,4)!="http") {
        window.close(); 
        return; 
    }
    io.get(url, function(existing) {
        if(existing == null) {
            var config = defaultConfig();
            var title = tabs[0].title.replace(/[\n\r]/g, ' ');
            var set = {config: config, title: title};
            io.put(tabs[0].url, set);
            fillUI(url, set);
        } else {
            fillUI(url, existing);
        }
    });
});