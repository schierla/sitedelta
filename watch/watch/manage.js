uiUtils.i18n();

pageUtils.list(pages => {
    var list = document.querySelector("#pages");
    while(list.firstChild) list.removeChild(list.firstChild);

    for(var i=0; i<pages.length; i++) {
        var url = pages[i];
        addPage(url);
    }
});

function addPage(url) {
    pageUtils.getTitle(url, title => {
        pageUtils.getChanges(url, changes => {
            var list = document.querySelector("#pages");
            var item = document.createElement("option");
            item.setAttribute("value", url);
            item.setAttribute("title", url);
            if(changes > 0) item.classList.add("changed");
            else item.classList.add("unchanged");
            item.appendChild(document.createTextNode(title));
            list.appendChild(item);
        })
    });
}