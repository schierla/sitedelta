var ui = {
    tabs: [],
    show: function (id) {
        for(var i=0; i<ui.tabs.length; i++) {
            var tab = ui.tabs[i];
            document.querySelector("#"+tab.elem).style.display='none';
            document.querySelector("#"+tab.tab).classList.remove('selected');
            tab.footer.forEach(function(v,i,a) {
                document.querySelector("#"+v).style.display='none';
            });
        }
        var tab = ui.tabs[id];
        document.querySelector("#"+tab.elem).style.display='block';
        document.querySelector("#"+tab.tab).classList.add('selected');
        tab.footer.forEach(function(v,i,a) {
            document.querySelector("#"+v).style.display='block';
        });
    },
    init: function(tabs, tab) {
        ui.tabs = tabs;
        tabs.forEach(function(v,i,a) {
            document.querySelector("#"+v.tab).addEventListener("click", 
                function(e) {
                    tabs.forEach(function(v,i,a) {
                        if(document.querySelector("#"+v.tab)==e.target) ui.show(i);
                    })
                });
        });
        ui.show(tab);
    }
};
