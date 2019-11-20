namespace watchShow {
	var _iframe = document.getElementById("iframe") as HTMLIFrameElement;
	var _progress = document.getElementById("progress") as HTMLElement;
	var loadedDocument: Document | null;
	var oldContent: string;

	var url: string;
	var known = false;
	var title = "";
	var changes = -1, current = -1;

	async function highlight(): Promise<void> {
		if (document.body.classList.contains("selecting")) {
			regionUtils.abortSelect();
		}
		if (document.body.classList.contains("loadfail")) return;
		document.body.classList.remove("selecting", "unchanged", "changed", "expanded");
		document.body.classList.add("known");
		var config = await pageUtils.getOrCreateEffectiveConfig(url, title);
		var content = await pageUtils.getContent(url);
		oldContent = content; 

		if (!_iframe.contentWindow) return;
		var idoc = _iframe.contentWindow.document;
		known = true;

		var newcontent = textUtils.getText(idoc, config) || "";
		pageUtils.setContent(url, newcontent);

		changes = highlightUtils.highlightChanges(idoc, config, content);
		if (changes > 0) {
			document.body.classList.add("changed");
			current = 0; showData();
			await new Promise(resolve => setTimeout(resolve, 1000));
			current = highlightUtils.highlightNext(idoc, 0);
		} else if (changes == 0) {
			document.body.classList.add("unchanged");
		} else {
			document.body.classList.add("failed");
		}
		showData();
		await watchUtils.setChanges(url, changes >= 0 ? 0 : -1);
	}

	function stopIt(e: Event) {
		if (document.body.classList.contains("expanded")) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		if ((e as any).ctrlKey) return;
		var target: Node | null = e.target as Node;
		while (target != null) {
			if ((target as any).href) {
				window.location.search = (target as any).href;
				return;
			}
			target = target.parentNode;
		}
		e.preventDefault();
		e.stopPropagation();
	}

	function showPage(doc: Document | null): void {
		if (doc === null) return;
		if (title == "") title = doc.title;
		if (!_iframe.contentWindow) return;
		var idoc = _iframe.contentWindow.document;
		while (idoc.firstChild) idoc.removeChild(idoc.firstChild); idoc.appendChild(idoc.importNode(doc.documentElement, true)); 
		idoc.body.addEventListener("click", stopIt, true);
	}

	async function loadPage(): Promise<void> {
		document.body.classList.remove("loaded", "loadfail");
		changes = -1; current = -1; loadedDocument = null;
		var doc = await watchUtils.loadPage(url, (loaded, total) => {
			_progress.style.width = ((loaded / total) * 100) + "%";
		});
		if (doc === null) {
			document.body.classList.add("loadfail");
			return;
		} else {
			document.body.classList.add("loaded");
		}
		var base = doc.createElement("base");
		base.setAttribute("href", url);
		var existingbase = doc.querySelector("base[href]") as HTMLBaseElement;
		if(existingbase && existingbase.parentNode) {
			existingbase.parentNode.removeChild(existingbase);
			base.setAttribute("href", new URL(existingbase.getAttribute("href") || "", url).href);
		}
		doc.head.insertBefore(base, doc.head.firstChild);
		loadedDocument = doc;
		showPage(loadedDocument);
	}

	async function registerListeners() {
		for (var i = 0; i < options.length; i++) {
			await registerListener(options[i]);
		}
	}

	async function registerListener(option: CheckboxOption | ListOption | NumberOption) {
		var performUpdate = async (value: any) => {
			await pageUtils.setConfigProperty(url, option.key, value);
			if (option.post) 
				await Promise.resolve(option.post());
			if (option.type == "number") 
				inputElement(option.elem).value = "" + value;
			else if (option.type == "checkbox") 
				inputElement(option.elem).checked = value;
		};
		element(option.elem).addEventListener("change", async function (e) {
			var value: any;
			if (option.type == "number") {
				value = parseFloat(inputElement(option.elem).value);
				value = option.pre ? await Promise.resolve(option.pre(value)) : value;
			} else if (option.type == "checkbox") {
				value = inputElement(option.elem).checked;
				value = option.pre ? await Promise.resolve(option.pre(value)) : value;
			} else if (option.type == "list") {
				value = selectElement(option.elem).value;
				for (var i = 0; i < options.length; i++) {
					var otheroption = options[i];
					if (otheroption != option && otheroption.type == "list") {
						element(otheroption.delelem).setAttribute("disabled", "disabled");
						selectElement(otheroption.elem).value = "";
						if (otheroption.select) otheroption.select(null);
					}
				}
				element(option.delelem).removeAttribute("disabled");
				if (option.select) await Promise.resolve(option.select(value));
				return;
			}
			await performUpdate(value);
		});
		if (option.type == "list") {
			element(option.elem).addEventListener("dblclick", async function (e) {
				if (option.edit) {
					var oldValue = selectElement(option.elem).value;
					if (oldValue === "") return;
					var newValue = await Promise.resolve(option.edit(oldValue));
					if (newValue === null || newValue === "") return;
					var newlist: string[] = [];
					if(option.contents) for (var i = 0; i < option.contents.length; i++) {
						if (option.contents[i] != oldValue)
							newlist.push(option.contents[i]);
						else
							newlist.push(newValue);
					}
					if (option.pre) newlist = await Promise.resolve(option.pre(newlist));
					await performUpdate(newlist);
				}
			});
			element(option.addelem).addEventListener("click", async function (e) {
				var value = await Promise.resolve(option.add());
				if(!value) return;
				var newlist: string[] = [];
				if(option.contents) for (var i = 0; i < option.contents.length; i++) {
					newlist.push(option.contents[i]);
				}
				newlist.push(value);
				if (option.pre) 
					newlist = await Promise.resolve(option.pre(newlist));
				await performUpdate(newlist);
			});
			element(option.delelem).addEventListener("click", async function (e) {
				var value = selectElement(option.elem).value;
				var newlist: string[] = [];
				if(option.contents) for (var i = 0; i < option.contents.length; i++) {
					if (option.contents[i] != value) newlist.push(option.contents[i]);
				}
				if (option.select) await Promise.resolve(option.select(null));
				if (option.pre) newlist = await Promise.resolve(option.pre(newlist)); 
				await performUpdate(newlist);
			});
		}
	}

	async function showOptions() {
		var config = await pageUtils.getEffectiveConfig(url);
		if (!config) return;
		for (var i = 0; i < options.length; i++) {
			var option = options[i];
			if (option.type == "number")
				inputElement(option.elem).value = "" + config[option.key];
			else if (option.type == "checkbox")
				inputElement(option.elem).checked = config[option.key] as boolean;
			else if (option.type == "list") {
				var list = selectElement(option.elem);
				while (list.firstChild) list.removeChild(list.firstChild);
				var contents = config[option.key] as string[];
				option.contents = contents;
				for (var j = 0; j < contents.length; j++) {
					var item = contents[j];
					var node = document.createElement("option");
					node.setAttribute("value", item);
					node.appendChild(document.createTextNode(item));
					list.appendChild(node);
				}
				element(option.delelem).setAttribute("disabled", "disabled");
			}
		}
	}

	async function showData(): Promise<void> {
		inputElement("pagetitle").value = title;
		document.title = title;
		(element("changed").firstChild as CharacterData).data = chrome.i18n.getMessage("pageChanged", [current, changes]);
		var config = await pageUtils.getEffectiveConfig(url);
		if(!config) return;
		if(config.makeVisible) {
			setTimeout(function() {
				if(_iframe.contentWindow) 
					highlightUtils.makeVisible(_iframe.contentWindow.document, config as Config);
			}, 200);
		}
	}

	async function editRegion(xpath) {
		await showOutline(null);
		return prompt(chrome.i18n.getMessage("configRegionXpath"), xpath);
	}

	async function selectRegion(): Promise<string | null> {
		if(!_iframe.contentWindow) return null;
		var idoc = _iframe.contentWindow.document;
		if (document.body.classList.contains("selecting") || document.body.classList.contains("loadfail")) {
			regionUtils.abortSelect();
			document.body.classList.remove("selecting");
			var region = prompt(chrome.i18n.getMessage("configRegionXpath"), "");
			return region;
		} else {
			document.body.classList.add("selecting");
			var region: string | null = await regionUtils.selectRegionOverlay(element("overlay"), idoc);
			document.body.classList.remove("selecting");
			return region;
		}
	}

	async function showOutline(outline: string | null, property?: keyof Config): Promise<void> {
		if (!_iframe.contentWindow) return;
		var idoc = _iframe.contentWindow.document;
		if (outline) {
			var color = await pageUtils.getEffectiveConfigProperty(url, property || "includeRegion");
			regionUtils.showOutline(idoc, outline, color as string);
		} else {
			regionUtils.removeOutline(idoc);
		}
	}

	function addBodyIfEmpty(list: string[]) {
		if (list.length == 0) list.push("/html/body[1]");
		if (list.length > 1 && list[0] == "/html/body[1]") list.splice(0, 1);
		return list;
	}


	interface CheckboxOption {
		type: "checkbox", 
		key: keyof Config, 
		elem: string,
		pre?: (data: boolean) => (Promise<boolean> | boolean), 
		post?: () => (Promise<void> | void)
	}
	
	interface ListOption {
		type: "list", 
		key: keyof Config, 
		elem: string, 
		addelem: string,
		delelem: string, 
		contents?: string[],
		select: (data: string | null) => (Promise<void> | void), 
		add: () => (Promise<string | null> | string | null), 
		edit?: (data: string) => (Promise<string | null> | string | null),
		pre?: (data: string[]) => (Promise<string[]> | string[]), 
		post?: () => (Promise<void> | void)
	}

	interface NumberOption {
		type: "number", 
		key: keyof Config, 
		elem: string,
		pre?: (data: number) => (Promise<number> | number), 
		post?: () => (Promise<void> | void)
	}

	var options: (CheckboxOption | ListOption | NumberOption)[] = [
		{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
		{ type: "checkbox", key: "scanImages", elem: "checkimages" },
		{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
		{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
		{ type: "checkbox", key: "makeVisible", elem: "makevisible", post: expand },
		{ type: "checkbox", key: "stripStyles", elem: "stripstyles", post: expand },
		{ type: "checkbox", key: "isolateRegions", elem: "isolateregions", post: expand },
		{ type: "list", key: "includes", elem: "include", addelem: "includeadd", delelem: "includedel", select: xpath => showOutline(xpath, "includeRegion"), add: selectRegion, edit: editRegion, pre: addBodyIfEmpty, post: showOptions },
		{ type: "list", key: "excludes", elem: "exclude", addelem: "excludeadd", delelem: "excludedel", select: xpath => showOutline(xpath, "excludeRegion"), add: selectRegion, edit: editRegion, post: showOptions },
		{ type: "number", key: "watchDelay", elem: "watchDelay", pre: value => Math.floor(value) }
	];


	function inputElement(id: string)  : HTMLInputElement {
		return document.querySelector("#" + id)  as HTMLInputElement;
	}
	function selectElement(id: string)  : HTMLSelectElement {
		return document.querySelector("#" + id)  as HTMLSelectElement;
	}
	function element(id: string) : HTMLElement {
		return document.querySelector("#" + id)  as HTMLElement;
	}

	async function init(): Promise<void> {
		url = window.location.search.substr(1) + window.location.hash;
		if (url == "") url = "about:blank";

		var pagetitle = await pageUtils.getTitle(url);
		if (pagetitle !== null) {
			document.body.classList.add("known");
			known = true;
			title = pagetitle;
		}
		var result = await checkPermission(url);
		if (result) {
			await loadPage();
			await showData();
			if (known) {
				await highlight();
			}
		} else {
			document.body.classList.add("permissionDenied");
			element("permissionHost").appendChild(document.createTextNode(new URL(url).origin));
		}
	}

	function checkPermission(url: string) {
		return new Promise(resolve => chrome.permissions.contains({origins: [url] }, resolve));
	}

	function requestPermission(url: string) {
		chrome.permissions.request({ origins: [url] }, function(granted) {
			if (granted) {
				document.body.classList.remove("permissionDenied");
				init();
			} else {
			}
		});
	}

	element("grantHost").addEventListener("click", function(e) { requestPermission(url); });
	element("grantAll").addEventListener("click", function(e) { requestPermission("<all_urls>"); });

	element("pagetitle").addEventListener("change", async function (e) {
		title = inputElement("pagetitle").value;
		pageUtils.setTitle(url, title);
		await showData();
	});


	element("delete").addEventListener("click", async function (e) {
		await pageUtils.remove(url);
		document.body.classList.remove("unchanged", "changed", "failed", "known", "expanded");
		changes = -1, current = -1;
		known = false;
		showPage(loadedDocument);
		await showData();
	});

	async function expand() {
		if(oldContent !== null) pageUtils.setContent(url, oldContent);
		var config = await pageUtils.getOrCreateEffectiveConfig(url, title);
		document.body.classList.remove("unchanged", "changed", "failed");
		document.body.classList.add("expanded", "known");
		changes = -1, current = -1;
		known = true;
		showPage(loadedDocument);
		await showData();
		if(!_iframe.contentWindow) return;
		if (config.stripStyles)
			highlightUtils.stripStyles(_iframe.contentWindow.document);
		if (config.isolateRegions) 
			highlightUtils.isolateRegions(_iframe.contentWindow.document, config);
		await showOptions();
	}

	function openPage() {
		window.location.href = url;
	}


	export function initialize(): void {
		element("expand").addEventListener("click", expand);

		element("open").addEventListener("click", openPage);
	
		element("highlight").addEventListener("click", function (e) {
			document.body.classList.remove("expanded");
			if (changes > 0) {
				if(!_iframe.contentWindow) return;
				var idoc = _iframe.contentWindow.document;
				current = highlightUtils.highlightNext(idoc, current);
				showData();
			} else if (changes == 0) {
				showData();
			} else {
				highlight();
			};
		});

		init();
		registerListeners();
	}
}

watchShow.initialize();