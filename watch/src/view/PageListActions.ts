import { getDefaultConfig } from "@sitedelta/common/src/model/configUtils";
import { Index, remove as ioRemove } from "@sitedelta/common/src/model/ioUtils";
import {
  getEffectiveConfig as pageGetEffectiveConfig,
  setConfigProperty as pageSetConfigProperty,
} from "@sitedelta/common/src/model/pageUtils";
import {
  openResource,
  openResourceInBackground,
} from "@sitedelta/common/src/model/tabUtils";
import {
  markSeen as watchMarkSeen,
  scanPage as watchScanPage,
} from "@sitedelta/common/src/model/watchUtils";
import { t } from "@sitedelta/common/src/view/helpers";
import { Action, Dispatch, Dispatchable } from "hyperapp";

export function documentParser(content: string): Document {
  return new DOMParser().parseFromString(content, "text/html");
}

type PageEffectProps<S> = {
  pages: string[];
  SetSelection: Action<S, string[]>;
};

export function scanPages<S>(
  dispatch: Dispatch<S>,
  { pages, SetSelection }: PageEffectProps<S>
) {
  (async () => {
    let remainingPages = [...pages];
    dispatch([SetSelection, remainingPages]);
    for (const url of pages) {
      await watchScanPage(url, documentParser);
      remainingPages = remainingPages.filter((page) => page != url);
      dispatch([SetSelection, remainingPages]);
    }
  })();
}

export function markSeen<S>(
  dispatch: Dispatch<S>,
  { pages, SetSelection }: PageEffectProps<S>
) {
  (async () => {
    let remainingPages = [...pages];
    dispatch([SetSelection, remainingPages]);
    for (const url of pages) {
      await watchMarkSeen(url, documentParser);
      remainingPages = remainingPages.filter((page) => page != url);
      dispatch([SetSelection, remainingPages]);
    }
  })();
}

export async function deletePages<S>(
  _: Dispatch<S>,
  { pages }: PageEffectProps<S>
) {
  for (const url of pages) {
    await ioRemove(url);
  }
}

export function setWatchDelay<S>(
  _: Dispatch<S>,
  { pages }: PageEffectProps<S>
) {
  (async () => {
    let oldValue: string | null = null;
    for (var key of pages) {
      var config = await pageGetEffectiveConfig(key);
      if (config != null) {
        if (oldValue === null) oldValue = config.watchDelay + "";
        else if (oldValue != config.watchDelay + "") oldValue = "";
      }
    }
    if (oldValue === null) {
      oldValue = (await getDefaultConfig()).watchDelay + "";
    }
    var delay = prompt(chrome.i18n.getMessage("configWatchDelay"), oldValue);
    if (delay !== null)
      for (var key of pages) {
        await pageSetConfigProperty(key, "watchDelay", parseInt(delay || "0"));
        await watchScanPage(key, documentParser);
      }
  })();
}

export function openPages<S>(
  dispatch: Dispatch<S>,
  { pages, SetSelection }: PageEffectProps<S>
) {
  (async () => {
    let remainingPages = [...pages];
    dispatch([SetSelection, remainingPages]);
    if (pages.length === 1) {
      openResource("show.htm?" + pages[0]);
    } else {
      for (const url of pages) {
        await openResourceInBackground("show.htm?" + url);
        remainingPages = remainingPages.filter((page) => page != url);
        dispatch([SetSelection, remainingPages]);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  })();
}

function Scan<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [scanPages, props]];
}
function MarkSeen<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [markSeen, props]];
}
function Delete<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [deletePages, props]];
}
function SetDelay<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [setWatchDelay, props]];
}
function Open<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [openPages, props]];
}

function asAction<S>(action: Action<S>) {
  return action;
}

export function getActions<S>(
  index: Index,
  selected: string[],
  SetSelection: Action<S, string[]>
): [string, Dispatchable<S>][] {
  const all = Object.keys(index);
  const changed = all.filter((key) => (index[key].changes ?? 0) > 0);
  const ret: [string, Dispatchable<S>][] = [];
  if (selected.length === 0) {
    if (all.length > 0)
      ret.push([t("pagesScanAll"), [Scan, { pages: all, SetSelection }]]);
    if (changed.length > 0)
      ret.push(
        [t("pagesMarkSeenAll"), [MarkSeen, { pages: all, SetSelection }]],
        [t("pagesOpenChanged"), [Open, { pages: changed, SetSelection }]]
      );
  } else if (selected.length === 1) {
    ret.push(
      [t("pagesScanOne"), [Scan, { pages: selected, SetSelection }]],
      [t("pagesMarkSeenOne"), [MarkSeen, { pages: selected, SetSelection }]],
      [t("pagesDeleteOne"), [Delete, { pages: selected, SetSelection }]],
      [t("pagesWatchDelay"), [SetDelay, { pages: selected, SetSelection }]],
      [t("pagesOpenOne"), [Open, { pages: selected, SetSelection }]]
    );
  } else {
    ret.push(
      [t("pagesScanMultiple"), [Scan, { pages: selected, SetSelection }]],
      [
        t("pagesMarkSeenMultiple"),
        [MarkSeen, { pages: selected, SetSelection }],
      ],
      [t("pagesDeleteMultiple"), [Delete, { pages: selected, SetSelection }]],
      [t("pagesWatchDelay"), [SetDelay, { pages: selected, SetSelection }]],
      [t("pagesOpenMultiple"), [Open, { pages: selected, SetSelection }]]
    );
  }
  return ret;
}
