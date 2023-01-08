import * as highlightUtils from "@sitedelta/common/src/model/highlightUtils";
import * as regionUtils from "@sitedelta/common/src/model/regionUtils";
import * as textUtils from "@sitedelta/common/src/model/textUtils";
import { HighlightState } from "./highlightState";

enum PageState {
  ERROR = 0,
  LOADED = 1,
  HIGHLIGHTED = 2,
  SELECTREGION = 3,
}

var contentscript: any;
if (contentscript === undefined) {
  contentscript = {
    messageHandler: function (
      request: Record<string, any>,
      sender: any,
      sendResponse: (response: any) => void
    ) {
      if (request.command == "getStatus") {
        var ret: HighlightState;
        if (contentscript.state == PageState.HIGHLIGHTED)
          ret = {
            state: PageState.HIGHLIGHTED,
            changes: contentscript.numChanges,
            current: contentscript.currentChange,
          };
        else ret = { state: contentscript.state };
        sendResponse(ret);
      } else if (request.command == "getContent") {
        if (contentscript.state == PageState.LOADED) {
          contentscript.content = textUtils.getText(document, request.config);
        }
        sendResponse(contentscript.content);
      } else if (request.command == "highlightChanges") {
        if (contentscript.state == PageState.HIGHLIGHTED) {
          if (contentscript.numChanges > 0)
            contentscript.currentChange = highlightUtils.highlightNext(
              document,
              contentscript.currentChange
            );
          sendResponse({
            state: PageState.HIGHLIGHTED,
            changes: contentscript.numChanges,
            current: contentscript.currentChange,
          });
        } else {
          var changes = highlightUtils.highlightChanges(
            document,
            request.config,
            request.content
          );
          contentscript.state = PageState.HIGHLIGHTED;
          contentscript.numChanges = changes;
          if (contentscript.numChanges > 0)
            contentscript.currentChange = highlightUtils.highlightNext(
              document,
              0
            );
          else contentscript.currentChange = 0;
          sendResponse({
            state: PageState.HIGHLIGHTED,
            changes: contentscript.numChanges,
            current: contentscript.currentChange,
          });
        }
      } else if (request.command == "selectRegion") {
        if (contentscript.state == PageState.SELECTREGION) {
          regionUtils.abortSelect();
          contentscript.state = PageState.LOADED;
          contentscript.regionResult(null);
          contentscript.regionResult = null;
          sendResponse(prompt(chrome.i18n.getMessage("configRegionXpath"), ""));
        } else {
          contentscript.state = PageState.SELECTREGION;
          contentscript.regionResult = sendResponse;
          regionUtils.selectRegion(document).then(function (xpath) {
            contentscript.state = PageState.LOADED;
            contentscript.regionResult = null;
            sendResponse(xpath);
          });
          return true;
        }
      } else if (request.command == "showOutline") {
        regionUtils.showOutline(document, request.xpath, request.color);
        sendResponse(null);
      } else if (request.command == "removeOutline") {
        regionUtils.removeOutline(document);
        sendResponse(null);
      }
    },

    state: PageState.LOADED,
    numChanges: 0,
    currentChange: 0,
    content: null,
    regionResult: null,
  };

  chrome.runtime.onMessage.addListener(contentscript.messageHandler);
}
