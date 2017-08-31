uiUtils.i18n();

document.querySelector("#setup").addEventListener("click", function(e) {
	chrome.runtime.openOptionsPage();
	window.close();
});

document.querySelector("#includeadd").addEventListener("click", function(e) {
	tabUtils.selectInclude(tabId, url, function() {
		fillStatus({state: STATE.SELECTREGION});     
	});
});

document.querySelector("#includedel").addEventListener("click", function(e) {
	var region = document.querySelector("#include").value;
	tabUtils.removeOutline(tabId, function() {
		pageUtils.removeInclude(url, region, function() {
			pageUtils.getEffectiveConfig(url, function(pageconfig) {
				showConfig(pageconfig);
				config = pageconfig;
			});
		});
	});
});

document.querySelector("#include").addEventListener("change", function(e) {
	var region = document.querySelector("#include").value;
	document.querySelector("#excludedel").setAttribute("disabled", "disabled"); 
	document.querySelector("#includedel").setAttribute("disabled", "disabled"); 
	if(region == null) return;
	document.querySelector("#exclude").value = null;
	document.querySelector("#includedel").removeAttribute("disabled");    
	tabUtils.showOutline(tabId, region, config.includeRegion, function() {}); 
});

   
document.querySelector("#excludeadd").addEventListener("click", function(e) {
	tabUtils.selectExclude(tabId, url, function() {
		fillStatus({state: STATE.SELECTREGION});     
	});
});

document.querySelector("#excludedel").addEventListener("click", function(e) {
	var region = document.querySelector("#exclude").value;
	tabUtils.removeOutline(tabId, function() {
		pageUtils.removeExclude(url, region, function() {
			pageUtils.getEffectiveConfig(url, function(pageconfig) {
				showConfig(pageconfig);
				config = pageconfig;
			});
		});
	});
});

document.querySelector("#exclude").addEventListener("change", function(e) {
	var region = document.querySelector("#exclude").value;
	document.querySelector("#excludedel").setAttribute("disabled", "disabled"); 
	document.querySelector("#includedel").setAttribute("disabled", "disabled"); 
	if(region == null) return;
	document.querySelector("#include").value = null;
	document.querySelector("#excludedel").removeAttribute("disabled");
	tabUtils.showOutline(tabId, region, config.excludeRegion, function() {}); 
});

document.querySelector("#pagetitle").addEventListener("change", function(e) {
	pageUtils.setTitle(url, document.querySelector("#pagetitle").value, function() {});
	document.querySelector("#delete").style.visibility = 'visible';    
});

document.querySelector("#checkdeleted").addEventListener("change", function(e) {
	pageUtils.setConfigProperty(url, "checkDeleted", document.querySelector("#checkdeleted").checked, function() {});
});
document.querySelector("#checkimages").addEventListener("change", function(e) {
	pageUtils.setConfigProperty(url, "scanImages", document.querySelector("#checkimages").checked, function() {});
});
document.querySelector("#ignorecase").addEventListener("change", function(e) {
	pageUtils.setConfigProperty(url, "ignoreCase", document.querySelector("#ignorecase").checked, function() {});
});
document.querySelector("#ignorenumbers").addEventListener("change", function(e) {
	pageUtils.setConfigProperty(url, "ignoreNumbers", document.querySelector("#ignorenumbers").checked, function() {});
});

document.querySelector("#delete").addEventListener("click", function(e) {
	tabUtils.showIcon(tabId, "neutral", function() {
		pageUtils.remove(url, function() {
			window.close(); 
		});
	});
});

document.querySelector("#highlight").addEventListener("click", function(e) {
	pageUtils.getOrCreateEffectiveConfig(url, document.querySelector("#pagetitle").value, () => {
		document.querySelector("#delete").style.visibility = 'visible';
		tabUtils.highlightChanges(tabId, url, function(status) {
			fillStatus(status);
		});
	});
});

document.querySelector("#expand").addEventListener("click", function(e) {
	pageUtils.getOrCreateEffectiveConfig(url, document.querySelector("#pagetitle").value, (pageconfig) => {
		showConfig(pageconfig);
		config = pageconfig;
		document.querySelector("#config").style.display = 'block';
		document.querySelector("#settings").style.display='block';    
		document.querySelector("#delete").style.visibility = 'visible';
	});
});

var STATE = {
	LOADED: 1, 
	HIGHLIGHTED: 2,
	SELECTREGION: 3
};

function showTitle(title) {
	document.querySelector("#url").value = url;
	document.querySelector("#pagetitle").value = title;
}

function showConfig(config) {
	document.querySelector("#checkdeleted").checked = config.checkDeleted;
	document.querySelector("#checkimages").checked = config.scanImages;
	document.querySelector("#ignorecase").checked = config.ignoreCase;
	document.querySelector("#ignorenumbers").checked = config.ignoreNumbers;

	document.querySelector("#excludedel").setAttribute("disabled", "disabled"); 
	document.querySelector("#includedel").setAttribute("disabled", "disabled"); 

	var incelem = document.querySelector("#include");
	while(incelem.firstChild) incelem.removeChild(incelem.firstChild);
	for(var i=0; i<config.includes.length; i++) {
		var node = createRegionNode(config.includes[i]);
		incelem.appendChild(node);
	}

	var excelem = document.querySelector("#exclude");
	while(excelem.firstChild) excelem.removeChild(excelem.firstChild);
	for(var i=0; i<config.excludes.length; i++) {
		var node = createRegionNode(config.excludes[i], config.excludeRegion);
		excelem.appendChild(node);
	}
}

function createRegionNode(xpath, color) {
	var node = document.createElement("option");
	node.setAttribute("value", xpath);
	node.appendChild(document.createTextNode(xpath));
	return node;
}

function fillStatus(status) {
	switch(status.state) {
	case STATE.LOADED:
		document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitle");
		document.querySelector("#expand").style.display='block';
		break;
	case STATE.HIGHLIGHTED:
		if(status.changes == 0) {
			tabUtils.showIcon(tabId, "unchanged", function() {});
			document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleNoChanges");
			document.querySelector("#highlight").style.visibility='hidden';
		} else {
			tabUtils.showIcon(tabId, "changed", function() {});
			document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleChanges", [status.current, status.changes]);
		}
		document.querySelector("#expand").style.display='none';
		break;
	case STATE.SELECTREGION:
		document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleSelectRegion");
		document.querySelector("#expand").style.display='none';
		document.querySelector("#highlight").style.visibility='hidden';
		break;
	}
	document.querySelector("#config").style.display='none';
	document.querySelector("#settings").style.display='none';
}

var tabId = null;
var url = null;
var config = null;

tabUtils.getActive(function(tab) {
	tabId = tab.id; url = tab.url;
	if(url.substr(0,4)!="http") {
		document.querySelector("#title").firstChild.data = chrome.i18n.getMessage("highlightTitleUnavailable");
		document.querySelector("#settings").style.display="block";
		document.querySelector("#buttons").style.display="none";
		document.querySelector("#textfields").style.display="none";
		document.querySelector("#setup").classList.add("default");
		return;
	}

	tabUtils.getStatus(tabId, fillStatus);
	pageUtils.getTitle(url, (title) => {
		if(title == null) {
			showTitle(tab.title); 
			document.querySelector("#delete").style.visibility = 'hidden';
		} else {
			showTitle(title); 
			document.querySelector("#delete").style.visibility = 'visible';
		}
	});
});
