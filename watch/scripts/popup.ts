namespace watchPopup {

	async function addChangedUrl(url: string) {
		var title = await pageUtils.getTitle(url) || "";
		var list = document.querySelector("#changed") as HTMLSelectElement;
		var option = document.createElement("option");
		option.appendChild(document.createTextNode(title));
		option.setAttribute("value", url);
		option.setAttribute("title", url);
		list.appendChild(option);
	}

	async function addFailedUrl(url: string) {
		var title = await pageUtils.getTitle(url) || "";
		var list = document.querySelector("#failed") as HTMLSelectElement;
		var option = document.createElement("option");
		option.appendChild(document.createTextNode(title));
		option.setAttribute("value", url);
		option.setAttribute("title", url);
		list.appendChild(option);
	}

	var url: string;
	var tabId: number;
	var title: string;

	export async function initialize(): Promise<void> {

		(document.querySelector("#watch") as HTMLElement).addEventListener("click", async function (e) {
			await pageUtils.getOrCreateEffectiveConfig(url, title);
			var showPrefix = chrome.runtime.getURL("show.htm?");
			chrome.tabs.update(tabId, { url: showPrefix + url, active: true });
			window.close();
		});
	
		(document.querySelector("#open") as HTMLElement).addEventListener("click", function (e) {
			chrome.tabs.update(tabId, { url: url, active: true });
			window.close();
		});
	
		(document.querySelector("#sidebar") as HTMLElement).addEventListener("click", function (e) {
			if(chrome && (chrome as any).sidebarAction && (chrome as any).sidebarAction.open) 
				(chrome as any).sidebarAction.open(); 
			else 
				tabUtils.openResource("pages.htm");
			window.close();	
		});
	
		(document.querySelector("#scanAll") as HTMLElement).addEventListener("click", function (e) {
			chrome.runtime.sendMessage({ command: "scanAll" });
			window.close();
		});
	
		(document.querySelector("#openAll") as HTMLElement).addEventListener("click", function (e) {
			chrome.runtime.sendMessage({ command: "openChanged" });
			window.close();
		});
	
		(document.querySelector("#openFailed") as HTMLElement).addEventListener("click", function (e) {
			chrome.runtime.sendMessage({ command: "openFailed" });
			window.close();
    });
    
		(document.querySelector("#scanFailed") as HTMLElement).addEventListener("click", function (e) {
			chrome.runtime.sendMessage({ command: "scanFailed" });
			window.close();
		});

		(document.querySelector("#changed") as HTMLElement).addEventListener("dblclick", function () {
			if ((document.querySelector("#changed") as HTMLSelectElement).value) {
				tabUtils.openResource("show.htm?" + (document.querySelector("#changed") as HTMLSelectElement).value);
				window.close();
			}
		});

		(document.querySelector("#failed") as HTMLElement).addEventListener("dblclick", function () {
			if ((document.querySelector("#failed") as HTMLSelectElement).value) {
				tabUtils.openResource("show.htm?" + (document.querySelector("#failed") as HTMLSelectElement).value);
				window.close();
			}
		});

		var tab = await tabUtils.getActive();

		tabId = tab.id || 0;
		url = tab.url || "";
		title = tab.title || "";

		if(url == "https://sitedelta.schierla.de/transfer/") {
			await tabUtils.executeScripts(tabId, ["/common/scripts/transferScript.js"]);
			window.close();
			return;
		}

		var urls = await pageUtils.listChanged();
		if (urls.length > 0) 
			document.body.classList.add("changes");
		for (var i = 0; i < urls.length; i++) {
			await addChangedUrl(urls[i]);
			if(urls[i] == url) 
				document.body.classList.add("changed");
		}

		var urls = await pageUtils.listFailed();
		if (urls.length > 0) 
			document.body.classList.add("failed");
		for (var i = 0; i < urls.length; i++) {
			await addFailedUrl(urls[i]);
			if(urls[i] == url) 
				document.body.classList.add("failed");
		}

		var showPrefix = chrome.runtime.getURL("show.htm?");
		if (url.startsWith(showPrefix)) {
			document.body.classList.add("open");
			url = url.substr(showPrefix.length); 
		}

		if (url.substr(0, 4) != "http") {
			document.body.classList.add("unsupported");
			return;
		}
		
		var existing = await pageUtils.getConfig(url);
		if (existing === null) {
			document.body.classList.add("disabled");
		} else {
			document.body.classList.add("enabled");
		}
	}
}

watchPopup.initialize();