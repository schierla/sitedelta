import { Config } from "@sitedelta/common/src/model/config";
import {
  getContent as pageGetContent,
  getEffectiveConfig as pageGetEffectiveConfig,
  setContent as pageSetContent,
} from "@sitedelta/common/src/model/pageUtils";
import { executeScript as tabExecuteScript } from "@sitedelta/common/src/model/tabUtils";
import { isEqual as textIsEqual } from "@sitedelta/common/src/model/textUtils";
import { HighlightState, PageState } from "./highlightState";

// tab operations

export async function getStatus(tabId: number): Promise<HighlightState> {
  return await _csGetStatus(tabId);
}

export async function getContent(
  tabId: number,
  url: string
): Promise<string | null> {
  var config = await pageGetEffectiveConfig(url);
  if (config === null) return null;
  return await _csGetContent(tabId, config);
}

export async function checkChanges(
  tabId: number,
  url: string
): Promise<number> {
  var config = await pageGetEffectiveConfig(url);
  if (config === null) return -1;
  var oldcontent = await pageGetContent(url);
  if (oldcontent === null) return -1;
  var content = await _csGetContent(tabId, config);
  if (content === undefined) return -1;
  if (textIsEqual(oldcontent, content, config)) {
    // unchanged
    return 0;
  } else {
    return 1;
  }
}

export async function highlightChanges(
  tabId: number,
  url: string
): Promise<HighlightState> {
  var config = await pageGetEffectiveConfig(url);
  if (!config) return { state: PageState.ERROR };
  var content = await _csGetContent(tabId, config);
  if (content === undefined) return { state: PageState.ERROR };
  var oldcontent = await pageGetContent(url);
  if (oldcontent === null) oldcontent = "";
  await pageSetContent(url, content);
  var status = await _csHighlightChanges(tabId, config, oldcontent);
  return status;
}

export async function showOutline(
  tabId: number,
  xpath: string | string[],
  color: string
): Promise<void> {
  await _csShowOutline(tabId, xpath, color);
}

export async function removeOutline(tabId: number): Promise<void> {
  await _csRemoveOutline(tabId);
}

export async function abortSelect(
  tabId: number,
): Promise<string> {
  return await _bsAbortRegion(tabId);
}

export async function selectInclude(
  tabId: number,
  url: string
): Promise<string> {
  return await _bsAddIncludeRegion(tabId, url);
}

export async function selectExclude(
  tabId: number,
  url: string
): Promise<string> {
  return await _bsAddExcludeRegion(tabId, url);
}

export async function selectRegion(tabId: number) {
  return await _csSelectRegion(tabId);
}

export async function abortRegion(tabId: number) {
  return await _csAbortRegion(tabId);
}

export async function scanAll() {
  return await _bsScanAll();
}

export async function scan(url: string, tabId: number) {
  return await _bsScan(url, tabId);
}

// content script functions

function _csShowOutline(tab: number, xpath: string | string[], color: string) {
  return _callContentScript(tab, {
    command: "showOutline",
    xpath: xpath,
    color: color,
  });
}
function _csRemoveOutline(tab: number): Promise<void> {
  return _callContentScript(tab, { command: "removeOutline" });
}
function _csSelectRegion(tab: number): Promise<string> {
  return _callContentScript(tab, { command: "selectRegion" });
}
function _csAbortRegion(tab: number): Promise<string> {
  return _callContentScript(tab, { command: "abortRegion" });
}
function _csGetContent(tab: number, config: Config): Promise<string> {
  return _callContentScript(tab, { command: "getContent", config: config });
}
function _csHighlightChanges(
  tab: number,
  config: Config,
  content: string
): Promise<HighlightState> {
  return _callContentScript(tab, {
    command: "highlightChanges",
    config: config,
    content: content,
  });
}
function _csGetStatus(tab: number): Promise<HighlightState> {
  return _callContentScript(tab, { command: "getStatus" });
}

// background script functions

function _bsAddExcludeRegion(tab: number, url: string): Promise<string> {
  return _callBackgroundScript({
    command: "addExcludeRegion",
    tab: tab,
    url: url,
  });
}
function _bsAddIncludeRegion(tab: number, url: string): Promise<string> {
  return _callBackgroundScript({
    command: "addIncludeRegion",
    tab: tab,
    url: url,
  });
}
function _bsAbortRegion(tab: number): Promise<string> {
  return _callBackgroundScript({
    command: "abortRegion",
    tab: tab,
  });
}
function _bsScanAll(): Promise<void> {
  return _callBackgroundScript({ command: "scanAll" });
}
function _bsScan(url: string, tabId: number): Promise<void> {
  return _callBackgroundScript({ command: "scan", url: url, tabId: tabId });
}

// internal functions

async function _callBackgroundScript(
  command: Record<string, any>
): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(command, resolve);
  });
}

async function _callContentScript(
  tabId: number,
  command: {
    command: string;
    url?: string;
    config?: Config;
    content?: string;
    xpath?: string | string[];
    color?: string;
  }
): Promise<any> {
  var status = await new Promise((resolve) =>
    chrome.tabs.sendMessage(tabId, command, (ret) => {
      ret === undefined && chrome.runtime.lastError;
      resolve(ret);
    })
  );
  if (status === undefined) {
    await tabExecuteScript(tabId, "/highlightScript.js");
    var status = await new Promise((resolve) =>
      chrome.tabs.sendMessage(tabId, command, resolve)
    );
    if (status === undefined) {
      console.log(
        "Error calling content script '" +
          command.command +
          "': " +
          chrome.runtime.lastError
      );
      return;
    } else {
      return status;
    }
  } else {
    return status;
  }
}
