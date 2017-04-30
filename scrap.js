
function defaultConfig() {
	return {
		addBackground: "#ff8",
		addBorder: "#f00",
		includeRegion: "#f00",
		excludeRegion: "#0f0",
		showRegions: true,
		removeBackground: "#fee",
		removeBorder: "#ff0",
		moveBackground: "#efe",
		moveBorder: "#0b0",
		checkDeleted: true,
		ignoreCase: false,
		ignoreNumbers: false,
		scanImages: true		
	};
}

function mainButtonClicked() {
    chrome.tabs.query({"active":true,"currentWindow":true}, function(tabs) {
		chrome.tabs.create({url: chrome.runtime.getURL("res/pagesettings.htm?" + tabs[0].url)});
        chrome.tabs.executeScript(tabs[0].id, {file: "/content/contentscript.js"}, function(done) {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					console.log("Received " + xhr.responseText);
					chrome.tabs.sendMessage(tabs[0].id, {command: "debugSetContent", content: xhr.responseText}, function(content) {});
				}
			};
			xhr.open("GET", tabs[0].url, true);
			xhr.send();

			if(true) return;
			var config = defaultConfig();
			config["excludes"] = [];
			config["includes"] = ["/html/body[1]"];
			chrome.tabs.sendMessage(tabs[0].id, {command: "getContent", config: config}, function(content) {
				var url = tabs[0].url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
				chrome.storage.local.get(url, function(existing) {
					if(url in existing) {
						var old = existing[url];
						if(old == content) {
							console.log("unchanged");
						} else {
							console.log("changed");
							var set = {}; set[url] = content;
							chrome.storage.local.set(set);
							console.log("stored");
							chrome.tabs.sendMessage(tabs[0].id, {command: "highlightChanges", config: config, content: old});
							chrome.pageAction.show(tabs[0].id);
							console.log("highlighted");
						}
					} else {
						var set = {}; set[data.url] = content;
						chrome.storage.local.set(set);
						console.log("stored");
					}
				});
			});
		});
    });
}


	} else if(request.command == "debugSetContent") {
		console.log("debugSetContent");
		while(document.firstChild) document.removeChild(document.firstChild);
		var html = document.createElement("html");html.style.padding="0";html.style.margin="0";
		document.appendChild(html);
		var body = document.createElement("body");body.style.padding="0";body.style.margin="0";
		html.appendChild(body);
		var div1 = document.createElement("div");
		div1.style.position="absolute";div1.style.left="0";div1.style.top="0";div1.style.width="100%";div1.style.height="2em";div1.style.background="yellow";
		body.appendChild(div1);
		var div = document.createElement("div");
		div.style.position="absolute";div.style.top="2em";div.style.left="1px";div.style.right="1px";div.style.bottom="1px";div.style.margin="0";div.style.padding="0";
		body.appendChild(div);
		var iframe = document.createElement("iframe");
		iframe.setAttribute("sandbox", "allow-same-origin");
		iframe.style.position="absolute";iframe.style.width="100%";iframe.style.height="100%";iframe.style.border="none 0";iframe.style.padding="0"; iframe.style.margin="0";
		div.appendChild(iframe);
		iframe.onload = function() {
			var doc = iframe.contentDocument;
			var content = new DOMParser().parseFromString(request.content, "text/html");
			var elem = doc.importNode(content.documentElement, true);
			while(doc.firstChild) doc.removeChild(doc.firstChild);
			doc.appendChild(elem);	
			iframe.onload=null;
		}
		sendResponse("ok");

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
		sendResponse("Bye");
	}
);


chrome.browserAction.onClicked.addListener(mainButtonClicked);