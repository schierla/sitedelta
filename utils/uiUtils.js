var uiUtils = {
    tabs: [],
    show: function (id) {
        for(var i=0; i<uiUtils.tabs.length; i++) {
            var tab = uiUtils.tabs[i];
            document.querySelector("#"+tab.elem).style.display='none';
            document.querySelector("#"+tab.tab).classList.remove('selected');
            tab.footer.forEach(function(v,i,a) {
                document.querySelector("#"+v).style.display='none';
            });
        }
        var tab = uiUtils.tabs[id];
        document.querySelector("#"+tab.elem).style.display='block';
        document.querySelector("#"+tab.tab).classList.add('selected');
        tab.footer.forEach(function(v,i,a) {
            document.querySelector("#"+v).style.display='block';
        });
    },
    i18n: function() {
        var elems = document.querySelectorAll(".i18n");
        for(var i=0; i<elems.length; i++) {
            var text = elems[i].firstChild.data;
            if(text.startsWith("__MSG_") && text.endsWith("__")) {
                text = text.substr(6, text.length-8);
                text = chrome.i18n.getMessage(text);
                elems[i].firstChild.data = text;
            }
        }
    },
    init: function(tabs, tab) {
        uiUtils.i18n();
        uiUtils.tabs = tabs;
        tabs.forEach(function(v,i,a) {
            document.querySelector("#"+v.tab).addEventListener("click", 
                function(e) {
                    tabs.forEach(function(v,i,a) {
                        if(document.querySelector("#"+v.tab)==e.target) uiUtils.show(i);
                    })
                });
        });
        uiUtils.show(tab);
    }
};
