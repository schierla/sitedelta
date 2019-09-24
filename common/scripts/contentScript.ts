var STATE = {
	LOADED: 1,
	HIGHLIGHTED: 2,
	SELECTREGION: 3
};

var contentscript;
if (contentscript === undefined) {
	contentscript = {
		messageHandler: function (request, sender, sendResponse) {
			if (request.command == "getStatus") {
				if (contentscript.state == STATE.HIGHLIGHTED)
					sendResponse({ state: STATE.HIGHLIGHTED, changes: contentscript.numChanges, current: contentscript.currentChange });
				else
					sendResponse({ state: contentscript.state });
			} else if (request.command == "getContent") {
				if (contentscript.state == STATE.LOADED) {
					contentscript.content = textUtils.getText(document, request.config);
				}
				sendResponse(contentscript.content);
			} else if (request.command == "highlightChanges") {
				if (contentscript.state == STATE.HIGHLIGHTED) {
					if (contentscript.numChanges > 0)
						contentscript.currentChange = highlightUtils.highlightNext(document, contentscript.currentChange);
					sendResponse({ state: STATE.HIGHLIGHTED, changes: contentscript.numChanges, current: contentscript.currentChange });
				} else {
					var changes = highlightUtils.highlightChanges(document, request.config, request.content);
					contentscript.state = STATE.HIGHLIGHTED;
					contentscript.numChanges = changes;
					if (contentscript.numChanges > 0)
						contentscript.currentChange = highlightUtils.highlightNext(document, 0);
					else
						contentscript.currentChange = 0;
					sendResponse({ state: STATE.HIGHLIGHTED, changes: contentscript.numChanges, current: contentscript.currentChange });
				}
			} else if (request.command == "selectRegion") {
				if (contentscript.state == STATE.SELECTREGION) {
					regionUtils.abortSelect();
					contentscript.state = STATE.LOADED;
					contentscript.regionResult(null);
					contentscript.regionResult = null;
					sendResponse(prompt(chrome.i18n.getMessage("configRegionXpath"), ""));
				} else {
					contentscript.state = STATE.SELECTREGION;
					contentscript.regionResult = sendResponse;
					regionUtils.selectRegion(document).then(function(xpath) {
						contentscript.state = STATE.LOADED;
						contentscript.regionResult = null;
						sendResponse(xpath);
					});
					return true;
				}
			} else if (request.command == "showOutline") {
				regionUtils.showOutline(document, request.xpath, request.color);
				sendResponse(null);
			} else if (request.command == "removeOutline") {
				regionUtils.removeOutline();
				sendResponse(null);
			}
		},

		state: STATE.LOADED,
		numChanges: 0,
		currentChange: 0,
		content: null,
		regionResult: null
	}

	chrome.runtime.onMessage.addListener(contentscript.messageHandler);
}