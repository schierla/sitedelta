//    result.title = doc.title.replace(/[\n\r]/g, ' ');

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

chrome.browserAction.onClicked.addListener(mainButtonClicked);
