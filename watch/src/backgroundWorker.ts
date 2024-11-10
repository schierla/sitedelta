import { Config } from "@sitedelta/common/src/model/config";
import { runBackgroundScript } from "./background";

let creating: Promise<void> | undefined;
async function setupOffscreenDocument(path: string) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) return;

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Background Scan: Parse the loaded page',
    });
    await creating;
    creating = undefined;
  }
}

const textExtractor = async (content: string, config: Config) => {
  await setupOffscreenDocument("offscreen.htm");
  return await chrome.runtime.sendMessage({command: "extractText", data: {content, config}});
}
const charsetSniffer = async (content: string) => {
  await setupOffscreenDocument("offscreen.htm");
  return await chrome.runtime.sendMessage({command: "sniffCharset", data: {content}});
}

runBackgroundScript(textExtractor, charsetSniffer);