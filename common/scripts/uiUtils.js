var uiUtils = {
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
};
