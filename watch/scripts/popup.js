document.querySelector("#watch").addEventListener("click", function (e) {
	var showPrefix = chrome.runtime.getURL("show.htm?");
	chrome.tabs.update(tabId, { url: showPrefix + url }, () => { window.close(); });
});

document.querySelector("#open").addEventListener("click", function (e) {
	chrome.tabs.update(tabId, { url: url }, () => { window.close(); });
});

document.querySelector("#options").addEventListener("click", function (e) {
	tabUtils.openResource("manage.htm");
	window.close();
});

document.querySelector("#openAll").addEventListener("click", function (e) {
	chrome.runtime.sendMessage({ command: "openChanged" });
	window.close();
});

document.querySelector("#changed").addEventListener("dblclick", function () {
	if (document.querySelector("#changed").value) {
		tabUtils.openResource("show.htm?" + document.querySelector("#changed").value);
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

	if(url == "https://sitedelta.schierla.de/transfer/") {
		tabUtils._executeScripts(tabId, ["/common/scripts/transferScript.js"]);
		window.close();
		return;
	}

	pageUtils.listChanged(function (urls) {
		if (urls.length > 0) document.body.classList.add("changes");
		for (var i = 0; i < urls.length; i++) {
			addChangedUrl(urls[i]);
		}
	});

	var showPrefix = chrome.runtime.getURL("show.htm?");
	if (url.startsWith(showPrefix)) {
		document.body.classList.add("open");
		url = url.substr(showPrefix.length); 
	}

	if (url.substr(0, 4) != "http") {
		document.body.classList.add("unsupported");
		return;
	}
	pageUtils.getConfig(url, function (existing) {
		if (existing === null) {
			document.body.classList.add("disabled");
		} else {
			document.body.classList.add("enabled");
		}
	});
});
