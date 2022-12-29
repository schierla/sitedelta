import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import * as watchUtils from "@sitedelta/common/src/scripts/watchUtils";
import * as configUtils from "@sitedelta/common/src/scripts/configUtils";
import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import { StateUpdater } from "preact/hooks";
import { t } from "../hooks/UseTranslation";

export function documentParser(content: string): Document {
  return new DOMParser().parseFromString(content, "text/html");
}

export const scanPages = async (
  pages: string[],
  setSelection: StateUpdater<string[]>
) => {
  setSelection(pages);
  for (const url of pages) {
    await watchUtils.scanPage(url, documentParser);
    setSelection((selection: string[]) =>
      selection.filter((page) => page != url)
    );
  }
};

export const markSeen = async (
  pages: string[],
  setSelection: StateUpdater<string[]>
) => {
  setSelection(pages);
  for (const url of pages) {
    await watchUtils.markSeen(url, documentParser);
    setSelection((selection) => selection.filter((page) => page != url));
  }
};

export const deletePages = (pages: string[]) => {
  for (const url of pages) {
    ioUtils.remove(url);
  }
};

export const setWatchDelay = async (pages: string[]) => {
  let oldValue: string | null = null;
  for (var key of pages) {
    var config = await pageUtils.getEffectiveConfig(key);
    if (config != null) {
      if (oldValue === null) oldValue = config.watchDelay + "";
      else if (oldValue != config.watchDelay + "") oldValue = "";
    }
  }
  if (oldValue === null) {
    oldValue = (await configUtils.getDefaultConfig()).watchDelay + "";
  }
  var delay = prompt(chrome.i18n.getMessage("configWatchDelay"), oldValue);
  if (delay !== null)
    for (var key of pages) {
      await pageUtils.setConfigProperty(
        key,
        "watchDelay",
        parseInt(delay || "0")
      );
      await watchUtils.scanPage(key, documentParser);
    }
};

export const openPages = async (
  pages: string[],
  setSelection: StateUpdater<string[]>
) => {
  setSelection(pages);
  if (pages.length === 1) {
    tabUtils.openResource("show.htm?" + pages[0]);
  } else {
    for (const url of pages) {
      await tabUtils.openResourceInBackground("show.htm?" + url);
      setSelection((selection) => selection.filter((page) => page != url));
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
};

export const getActions: (
  index: ioUtils.Index,
  selectedPages: string[],
  setSelection: StateUpdater<string[]>
) => [string, () => void][] = (index, selectedPages, setSelection) => {
  if (selectedPages.length === 0) {
    const changed = Object.keys(index).filter(
      (key) => (index[key].changes ?? 0) > 0
    );
    const changedActions: [string, () => void][] = [
      [t("pagesMarkSeenAll"), () => markSeen(Object.keys(index), setSelection)],
      [t("pagesOpenChanged"), () => openPages(changed, setSelection)],
    ];
    return [
      [t("pagesScanAll"), () => scanPages(Object.keys(index), setSelection)],
      ...(changed.length > 0 ? changedActions : []),
    ];
  } else if (selectedPages.length === 1) {
    return [
      [t("pagesScanOne"), () => scanPages(selectedPages, setSelection)],
      [t("pagesMarkSeenOne"), () => markSeen(selectedPages, setSelection)],
      [t("pagesDeleteOne"), () => deletePages(selectedPages)],
      [t("pagesWatchDelay"), () => setWatchDelay(selectedPages)],
      [t("pagesOpenOne"), () => openPages(selectedPages, setSelection)],
    ];
  } else {
    return [
      [t("pagesScanMultiple"), () => scanPages(selectedPages, setSelection)],
      [t("pagesMarkSeenMultiple"), () => markSeen(selectedPages, setSelection)],
      [t("pagesDeleteMultiple"), () => deletePages(selectedPages)],
      [t("pagesWatchDelay"), () => setWatchDelay(selectedPages)],
      [t("pagesOpenMultiple"), () => openPages(selectedPages, setSelection)],
    ];
  }
};
