import {
  highlightChanges,
  highlightNext
} from "@sitedelta/common/src/model/highlightUtils";
import {
  abortSelect as regionAbortSelect,
  removeOutline as regionRemoveOutline,
  selectRegion,
  showOutline as regionShowOutline
} from "@sitedelta/common/src/model/regionUtils";
import { getText } from "@sitedelta/common/src/model/textUtils";
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
          contentscript.content = getText(document, request.config);
        }
        sendResponse(contentscript.content);
      } else if (request.command == "highlightChanges") {
        if (contentscript.state == PageState.HIGHLIGHTED) {
          if (contentscript.numChanges > 0)
            contentscript.currentChange = highlightNext(
              document,
              contentscript.currentChange
            );
          sendResponse({
            state: PageState.HIGHLIGHTED,
            changes: contentscript.numChanges,
            current: contentscript.currentChange,
          });
        } else {
          var changes = highlightChanges(
            document,
            request.config,
            request.content
          );
          contentscript.state = PageState.HIGHLIGHTED;
          contentscript.numChanges = changes;
          if (contentscript.numChanges > 0)
            contentscript.currentChange = highlightNext(document, 0);
          else contentscript.currentChange = 0;
          sendResponse({
            state: PageState.HIGHLIGHTED,
            changes: contentscript.numChanges,
            current: contentscript.currentChange,
          });
        }
      } else if(request.command == "abortRegion") {
        regionAbortSelect();
        contentscript.state = PageState.LOADED;
        contentscript.regionResult(null);
        contentscript.regionResult = null;
        sendResponse(null);
      } else if (request.command == "selectRegion") {
        contentscript.state = PageState.SELECTREGION;
        contentscript.regionResult = sendResponse;
        selectRegion(document).then(function (xpath) {
          contentscript.state = PageState.LOADED;
          contentscript.regionResult = null;
          sendResponse(xpath);
        });
        return true;
      } else if (request.command == "showOutline") {
        regionShowOutline(document, request.xpath, request.color);
        sendResponse(null);
      } else if (request.command == "removeOutline") {
        regionRemoveOutline(document);
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
