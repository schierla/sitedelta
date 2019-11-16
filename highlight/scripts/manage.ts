namespace highlightManage {
	var advancedEnabled: boolean = false;
	var advancedPermission = { permissions: [], origins: ["<all_urls>"] };
	
	function checkPermissions(): void {
		document.body.classList.remove("advancedEnabled");
		document.body.classList.remove("advancedUnsupported");
		if (chrome.permissions) {
			chrome.permissions.contains(advancedPermission, (success) => {
				advancedEnabled = success;
				if(success) document.body.classList.add("advancedEnabled");
			});
		} else {
			document.body.classList.add("advancedUnsupported");
		}
	}

	function requestPermission(): void {
		try {
			chrome.permissions.request(advancedPermission, (success) => {
				checkPermissions();
				notifyChanged();
			});
		} catch (e) {
			checkPermissions();
		}
	}

	function checkScanOnLoad(selected: boolean): boolean {
		return selected && advancedEnabled;
	}

	function checkHighlightOnLoad(selected: boolean): boolean {
		return selected && inputElement("scanonload").checked;
	}

	interface CheckboxOption {
		type: "checkbox", 
		key: keyof Config, 
		elem: string,
		pre?: (data: boolean) => (Promise<boolean> | boolean), 
		post?: () => (Promise<void> | void)
	}

	interface ColorOption {
		type: "color", 
		key: keyof Config, 
		elem: string,
		pre?: (data: string) => (Promise<string> | string), 
		post?: () => (Promise<void> | void)	
	}

	var options: (CheckboxOption | ColorOption)[] = [
		{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
		{ type: "checkbox", key: "scanImages", elem: "checkimages" },
		{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
		{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
		{ type: "checkbox", key: "makeVisible", elem: "makevisible" },
		{ type: "checkbox", key: "stripStyles", elem: "stripstyles" },
		{ type: "checkbox", key: "isolateRegions", elem: "isolateregions" },
		{ type: "checkbox", key: "showRegions", elem: "showregions" },
		{ type: "checkbox", key: "scanOnLoad", elem: "scanonload", pre: checkScanOnLoad, post: notifyChanged },
		{ type: "checkbox", key: "highlightOnLoad", elem: "highlightonload", pre: checkHighlightOnLoad, post: notifyChanged },
		{ type: "checkbox", key: "enableContextMenu", elem: "contextmenu", post: notifyChanged },
		{ type: "color", key: "addBackground", elem: "addbackground", post: updatePreview },
		{ type: "color", key: "addBorder", elem: "addborder", post: updatePreview },
		{ type: "color", key: "includeRegion", elem: "includeborder", post: updatePreview },
		{ type: "color", key: "excludeRegion", elem: "excludeborder", post: updatePreview }
	];

	function registerListeners(): void {
		element("enableAdvanced").addEventListener("click", function (e) {
			requestPermission();
		});
	
		element("importExport").addEventListener("click", function (e) {
			chrome.tabs.create({ url: "https://sitedelta.schierla.de/transfer/" }); 
		});

		for (var i = 0; i < options.length; i++) {
			registerListener(options[i]);
		}
	}
	function registerListener(option: CheckboxOption | ColorOption): void {
		inputElement(option.elem).addEventListener("change", async function (e) {
			var value: any;
			if (option.type == 'color') {
				value = inputElement(option.elem).value;
				value = option.pre ? await Promise.resolve(option.pre(value)) : value;
			} else if (option.type == "checkbox") {
				value = inputElement(option.elem).checked;
				value = option.pre ? await Promise.resolve(option.pre(value)) : value;
			}
			var update = {}; update[option.key] = value;
			await configUtils.setDefaultConfigProperties(update);
			if (option.post) 
				await Promise.resolve(option.post());
		});
	}
	function hexColor(color: string): string {
		if (color.length == 4) 
			return color[0] + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]; 
		else
			return color;
	}
	async function showOptions(): Promise<void> {
		var config = await configUtils.getDefaultConfig();
		for (var i = 0; i < options.length; i++) {
			if (options[i].type == "color")
				inputElement(options[i].elem).value = hexColor(config[options[i].key] as string);
			else if (options[i].type == "checkbox")
				inputElement(options[i].elem).checked = config[options[i].key] as boolean;
		}
		updatePreview();
	}

	function updatePreview(): void {
		var addpreview = element("addpreview");
		addpreview.style.border = "dotted black 1px";
		addpreview.style.background = inputElement("addbackground").value;
		addpreview.style.borderColor = inputElement("addborder").value;
		var includepreview = element("includepreview");
		includepreview.style.border = "dotted white 2px";
		includepreview.style.borderColor = inputElement("includeborder").value;
		var excludepreview = element("excludepreview");
		excludepreview.style.border = "dotted white 2px";
		excludepreview.style.borderColor = inputElement("excludeborder").value;

		var scanonload = inputElement("scanonload");
		var highlightonload = inputElement("highlightonload");
		if (!scanonload.checked) highlightonload.checked = false;
	}

	function inputElement(id: string)  : HTMLInputElement {
		return document.querySelector("#"+id)  as HTMLInputElement;
	}
	function element(id: string) : HTMLElement {
		return document.querySelector("#"+id)  as HTMLElement;
	}

	export function load(): void {
		checkPermissions();
		registerListeners();
		showOptions();
	}

	function notifyChanged() {
		showOptions();
		chrome.runtime.sendMessage({ command: "reinitialize" });
	}

}

highlightManage.load();
