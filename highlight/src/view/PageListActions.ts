import { Index, remove as ioRemove } from "@sitedelta/common/src/model/ioUtils";
import { t } from "@sitedelta/common/src/view/helpers";
import { Action, Dispatch, Dispatchable } from "hyperapp";
import { scan } from "./highlightScriptUtils";

type PageEffectProps<S> = {
  pages: string[];
  SetSelection: Action<S, string[]>;
};

function Scan<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [scanPages, props]];
}
function Delete<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [deletePages, props]];
}
function Open<S>(s: S, props: PageEffectProps<S>): Dispatchable<S> {
  return [s, [openPages, props]];
}

export async function openPages<S>(
  dispatch: Dispatch<S>,
  { pages, SetSelection }: PageEffectProps<S>
) {
  const dispatchLater = (event: Dispatchable<S>) =>
    requestAnimationFrame(() => dispatch(event));
  let remainingPages = [...pages];
  dispatchLater([SetSelection, remainingPages]);
  if (pages.length === 1) {
    chrome.tabs.create({ url: pages[0] });
    dispatchLater([SetSelection, []]);
  } else {
    for (const url of pages) {
      chrome.tabs.create({ url, active: false });
      remainingPages = remainingPages.filter((page) => page != url);
      dispatchLater([SetSelection, remainingPages]);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

export function scanPages<S>(
  dispatch: Dispatch<S>,
  { pages, SetSelection }: PageEffectProps<S>
) {
  const dispatchLater = (event: Dispatchable<S>) =>
    requestAnimationFrame(() => dispatch(event));
  chrome.tabs.create({ url: "about:blank" }, async (tab) => {
    const tabId = tab.id ?? 0;
    let remainingPages = [...pages];
    for (const page of pages) {
      await scan(page, tabId);
      remainingPages = remainingPages.filter((p) => p != page);
      dispatchLater([SetSelection, remainingPages]);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    chrome.tabs.remove(tabId);
  });
}

export async function deletePages<S>(
  dispatch: Dispatch<S>,
  { pages, SetSelection }: PageEffectProps<S>
) {
  const dispatchLater = (event: Dispatchable<S>) =>
    requestAnimationFrame(() => dispatch(event));
  for (const url of pages) {
    await ioRemove(url);
  }
  dispatchLater([SetSelection, []]);
}

export function getActions<S>(
  index: Index,
  selected: string[],
  Unlock: boolean | Action<S>,
  SetSelection: Action<S, string[]>
): [string, Dispatchable<S>][] {
  const all = Object.keys(index);
  const changed = all.filter((key) => (index[key].changes ?? 0) > 0);
  const ret: [string, Dispatchable<S>][] = [];
  if (selected.length === 0) {
    if (all.length > 0 && Unlock !== false) {
      if (Unlock === true)
        ret.push([t("pagesScanAll"), [Scan, { pages: all, SetSelection }]]);
      else ret.push(["🔒 " + t("pagesScanAll"), Unlock]);
    }
    if (changed.length > 0)
      ret.push([
        t("pagesOpenChanged"),
        [Open, { pages: changed, SetSelection }],
      ]);
  } else if (selected.length === 1) {
    if (Unlock !== false) {
      if (Unlock === true)
        ret.push([
          t("pagesScanOne"),
          [Scan, { pages: selected, SetSelection }],
        ]);
      else ret.push(["🔒 " + t("pagesScanOne"), Unlock]);
    }
    ret.push(
      [t("pagesOpenOne"), [Open, { pages: selected, SetSelection }]],
      [t("pagesDeleteOne"), [Delete, { pages: selected, SetSelection }]]
    );
  } else {
    if (Unlock !== false) {
      if (Unlock === true)
        ret.push([
          t("pagesScanMultiple"),
          [Scan, { pages: selected, SetSelection }],
        ]);
      else ret.push(["🔒 " + t("pagesScanMultiple"), Unlock]);
    }
    ret.push(
      [t("pagesOpenMultiple"), [Open, { pages: selected, SetSelection }]],
      [t("pagesDeleteMultiple"), [Delete, { pages: selected, SetSelection }]]
    );
  }
  return ret;
}
