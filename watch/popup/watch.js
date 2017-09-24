uiUtils.i18n();

document.querySelector("#watch").addEventListener("click", function (e) {
	tabUtils.openResource("watch/show.htm?" + url);
	window.close();
});

document.querySelector("#options").addEventListener("click", function (e) {
	chrome.runtime.openOptionsPage();
	window.close();
});

document.querySelector("#open").addEventListener("click", function (e) {
	pageUtils.listChanged(function (urls) {
		for (var i = 0; i < urls.length; i++) {
			tabUtils.openResource("watch/show.htm?" + urls[i]);
		}
		window.close();
	});
});

document.querySelector("#changed").addEventListener("dblclick", function () {
	if (document.querySelector("#changed").value) {
		tabUtils.openResource("watch/show.htm?" + document.querySelector("#changed").value);
		window.close();
	}
});


function addChangedUrl(url) {
	pageUtils.getTitle(url, title => {
		var list = document.querySelector("#changed");
		var option = document.createElement("option");
		option.appendChild(document.createTextNode(title));
		option.setAttribute("value", url);
		option.setAttribute("title", url);
		list.appendChild(option);
	});
}

var url = null;
var tabId = null;
var title = null;

tabUtils.getActive(function (tab) {
	tabId = tab.id;
	url = tab.url;
	title = tab.title;

	pageUtils.listChanged(function (urls) {
		if (urls.length > 0) document.body.classList.add("changes");
		for (var i = 0; i < urls.length; i++) {
			addChangedUrl(urls[i]);
		}
	});

	if (url.substr(0, 4) != "http") {
		document.body.classList.add("unsupported");
		return;
	}
	pageUtils.getConfig(url, function (existing) {
		if (existing == null) {
			document.body.classList.add("disabled");
		} else {
			document.body.classList.add("enabled");
		}
	});
});