uiUtils.i18n();

function load() {
	pageUtils.list(pages => {
		var list = document.querySelector("#pages");
		while (list.firstChild) list.removeChild(list.firstChild);

		for (var i = 0; i < pages.length; i++) {
			var url = pages[i];
			addPage(url);
		}
	});
};

function addPage(url) {
	pageUtils.getTitle(url, title => {
		pageUtils.getChanges(url, changes => {
			pageUtils.getNextScan(url, nextScan => {
				var list = document.querySelector("#pages");
				var item = document.createElement("option");
				item.setAttribute("value", url);
				if (changes > 0) {
					item.classList.add("changed");
					item.setAttribute("title", url);
				} else {
					item.classList.add("unchanged");
					item.setAttribute("title", url +"\n"+ chrome.i18n.getMessage("watchNextScan", new Date(nextScan).toLocaleString()));
				} 
				item.appendChild(document.createTextNode(title));
				list.appendChild(item);
			})
		})
	});
}

document.querySelector("#delete").addEventListener("click", function (e) {
	if (document.querySelector("#pages").value != "") {
		ioUtils.remove(document.querySelector("#pages").value, load);
	}
});

document.querySelector("#open").addEventListener("click", function (e) {
	if (document.querySelector("#pages").value != "") {
		tabUtils.openResource("watch/show.htm?" + document.querySelector("#pages").value);
	}
});

document.querySelector("#pages").addEventListener("dblclick", function (e) {
	if (document.querySelector("#pages").value != "") {
		tabUtils.openResource("watch/show.htm?" + document.querySelector("#pages").value);
	}
});

load();