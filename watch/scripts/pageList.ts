namespace pageList {

	async function deletePage(key: string, data: any) {
		await ioUtils.remove(key);
	}

	async function openPage(key: string, data: any) {
		await tabUtils.openResource("show.htm?" + key); 
		await new Promise(resolve => setTimeout(resolve, 300));
	}

	async function openPageInBackground(key: string, data: any) {
		await tabUtils.openResourceInBackground("show.htm?" + key); 
		await new Promise(resolve => setTimeout(resolve, 300));
	}

	function previewPage(list: uiUtils.SortedList<any>) {
		var preview = document.querySelector("#preview") as HTMLIFrameElement; 
		if(!preview || window.getComputedStyle(preview).display == "none") return;
		var options = (document.querySelector("#pages") as HTMLSelectElement).options;
		var selectCount = 0, selected = ""; for (var i = 0; i < options.length; i++) if (options[i].selected) { selectCount++; selected = options[i].value; }
		if(selectCount == 1 && preview.src != chrome.runtime.getURL("show.htm?" + selected)) {
			preview.src = chrome.runtime.getURL("show.htm?" + selected);
		} else if(selectCount == 0) {
			preview.src = "about:blank";
		}
	}

	async function scanPage(key: string, data: any) {
		await watchUtils.scanPage(key);
	}

	async function markSeen(key: string, data: any) {
		await watchUtils.markSeen(key);
	}

	function selectAllIfNone(): void {
		var options = (document.querySelector("#pages") as HTMLSelectElement).options;
		for (var i = 0; i < options.length; i++)
			if (options[i].selected) return;
		for (var i = 0; i < options.length; i++)
			options[i].selected = true;
	}

	function selectChangedIfNone(): void {
		var options = (document.querySelector("#pages") as HTMLSelectElement).options;
		for (var i = 0; i < options.length; i++)
			if (options[i].selected) return;
		for (var i = 0; i < options.length; i++)
			if(options[i].classList.contains("changed")) 
				options[i].selected = true;
	}

	function createItem(key: string, data: any): HTMLOptionElement {
		var title = "title" in data ? data.title : key;
		if (!("title" in data)) pageUtils.getTitle(key);
		var ret = document.createElement("option");
		ret.setAttribute("value", key);
		ret.appendChild(document.createTextNode(title));
		return ret;
	}


	function updateItem(element: HTMLOptionElement, data: any) {
		(element.firstChild as CharacterData).data = data["title"];
		element.classList.remove("changed", "unchanged", "failed", "scanning");
		var title = element.getAttribute("value") || "";
		if (data.nextScan != 0)
			title += "\n" + chrome.i18n.getMessage("watchNextScan", new Date(data.nextScan).toLocaleString());
		element.setAttribute("title", title);

		if (data.changes === undefined) {
		} else if (data.changes > 0) {
			element.classList.add("changed");
		} else if (data.changes == 0) {
			element.classList.add("unchanged");
		} else if (data.changes == -1) {
			element.classList.add("failed");
		}
	}

	export function load(): void {
		var list = new uiUtils.SortedList("pages", createItem, updateItem);
		list.isBefore = (keya: string, a: any, keyb: string, b: any) => a.title !== undefined && b.title !== undefined && a.title.toLowerCase() < b.title.toLowerCase();

		var filter = document.querySelector("#filter") as HTMLInputElement;
		if(filter) {
			list.isShown = (key: string, data: any) => key.indexOf(filter.value) != -1 || (data.title !== undefined && data.title.indexOf(filter.value) != -1);
			filter.addEventListener("input", () => list.refresh());
		}
		(document.querySelector("#delete") as HTMLElement).addEventListener("click", () => list.foreachSelected(deletePage));
		(document.querySelector("#open") as HTMLElement).addEventListener("click", () => { selectChangedIfNone(); list.foreachSelected(openPage, openPageInBackground) });
		(document.querySelector("#scannow") as HTMLElement).addEventListener("click", () => { selectAllIfNone(); list.foreachSelected(scanPage) });
		(document.querySelector("#markseen") as HTMLElement).addEventListener("click", () => { selectAllIfNone(); list.foreachSelected(markSeen) });
		(document.querySelector("#pages") as HTMLElement).addEventListener("dblclick", () => list.foreachSelected(openPage));
		(document.querySelector("#pages") as HTMLElement).addEventListener("change", () => previewPage(list));
		(document.querySelector("#watchdelay") as HTMLElement).addEventListener("click", async () => {
			var oldValue: string|null = null;
			var selected = list.getSelected();
			for(var key in selected) {
				var config = await pageUtils.getEffectiveConfig(key);
				if(config != null) {
					if(oldValue === null) oldValue = config.watchDelay + "";
					else if(oldValue != config.watchDelay + "") oldValue = "";
				}
			}
			if(oldValue === null) {
				oldValue = (await configUtils.getDefaultConfig()).watchDelay + "";
			}
			var delay = prompt(chrome.i18n.getMessage("configWatchDelay"), oldValue) ;
			if(delay !== null) 
				list.foreachSelected(async (key,data) => {
					await pageUtils.setConfigProperty(key, "watchDelay", parseInt(delay || "0"));
					await scanPage(key, data);
				});
		});
		ioUtils.observeIndex(index => list.updateAll(index));
	}
}

pageList.load();